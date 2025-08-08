import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  let tempAudioPath: string | null = null;
  let tempTranscriptPath: string | null = null;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    let audioFile: File | null = null;
    let language = 'auto';
    let model = 'base';
    let audioBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Processar FormData (upload de arquivo)
      const formData = await request.formData();
      audioFile = formData.get('audio') as File;
      language = formData.get('language') as string || 'auto';
      model = formData.get('model') as string || 'base';
      
      if (!audioFile) {
        return NextResponse.json(
          { error: 'Arquivo de áudio é obrigatório' },
          { status: 400 }
        );
      }
      
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    } else if (contentType.includes('application/json')) {
      // Processar JSON (dados base64)
      const body = await request.json();
      const { audioData, language: reqLanguage, model: reqModel } = body;
      
      if (!audioData) {
        return NextResponse.json(
          { error: 'Dados de áudio são obrigatórios' },
          { status: 400 }
        );
      }
      
      language = reqLanguage || 'auto';
      model = reqModel || 'base';
      
      // Converter base64 para buffer
      try {
        audioBuffer = Buffer.from(audioData, 'base64');
      } catch (error) {
        return NextResponse.json(
          { error: 'Dados de áudio inválidos (base64 esperado)' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Content-Type não suportado. Use multipart/form-data ou application/json' },
        { status: 400 }
      );
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'Falha ao processar dados de áudio' },
        { status: 400 }
      );
    }

    // Criar diretório temporário
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Salvar arquivo de áudio temporário
    const audioFileName = `audio_${uuidv4()}.mp3`;
    tempAudioPath = path.join(tempDir, audioFileName);
    
    fs.writeFileSync(tempAudioPath, audioBuffer);

    // Fazer transcrição
    const transcription = await transcribeAudio(tempAudioPath, language, model);
    
    // Limpar arquivo temporário de áudio
    fs.unlinkSync(tempAudioPath);
    tempAudioPath = null;

    return NextResponse.json({
      transcription,
      language: language === 'auto' ? 'detectado automaticamente' : language,
      model,
      duration: audioFile ? audioFile.size : audioBuffer.length // Aproximação
    });
  } catch (error) {
    console.error('Erro na transcrição:', error);
    
    // Limpar arquivos temporários em caso de erro
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivo de áudio temporário:', cleanupError);
      }
    }
    
    if (tempTranscriptPath && fs.existsSync(tempTranscriptPath)) {
      try {
        fs.unlinkSync(tempTranscriptPath);
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivo de transcrição temporário:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor na transcrição' },
      { status: 500 }
    );
  }
}

function transcribeAudio(audioPath: string, language: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Definir diretório de saída
    const outputDir = path.dirname(audioPath);
    
    const args = [
      audioPath,
      '--model', model,
      '--output_format', 'txt',
      '--output_dir', outputDir,
      '--verbose', 'False'
    ];

    // Adicionar idioma se especificado
    if (language !== 'auto') {
      args.push('--language', language);
    }

    console.log('Executando Whisper com argumentos:', args);
    const whisperProcess = spawn('whisper', args);

    let stdout = '';
    let stderr = '';

    whisperProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    whisperProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    whisperProcess.on('close', (code) => {
      console.log('Whisper finalizado com código:', code);
      console.log('Stdout:', stdout);
      console.log('Stderr:', stderr);
      
      if (code !== 0) {
        console.error('Erro do Whisper:', stderr);
        reject(new Error(`Whisper falhou com código ${code}: ${stderr}`));
        return;
      }

      // O Whisper cria um arquivo .txt com o mesmo nome do arquivo de áudio
      const audioFileName = path.basename(audioPath, path.extname(audioPath));
      const transcriptPath = path.join(path.dirname(audioPath), `${audioFileName}.txt`);
      
      console.log('Procurando arquivo de transcrição em:', transcriptPath);
      
      try {
        if (fs.existsSync(transcriptPath)) {
          const transcription = fs.readFileSync(transcriptPath, 'utf-8').trim();
          console.log('Transcrição lida do arquivo:', transcription.substring(0, 100) + '...');
          
          // Limpar arquivo de transcrição
          fs.unlinkSync(transcriptPath);
          
          if (transcription && transcription.length > 10) {
            resolve(transcription);
          } else {
            reject(new Error('Transcrição vazia ou muito curta'));
          }
        } else {
          // Se não encontrar o arquivo, tentar extrair do stdout
          console.log('Arquivo de transcrição não encontrado, tentando stdout');
          const transcription = stdout.trim();
          if (transcription && transcription.length > 10) {
            resolve(transcription);
          } else {
            reject(new Error('Arquivo de transcrição não encontrado e stdout vazio ou muito curto'));
          }
        }
      } catch (readError) {
        console.error('Erro ao ler arquivo de transcrição:', readError);
        reject(new Error('Erro ao ler resultado da transcrição'));
      }
    });

    whisperProcess.on('error', (error) => {
      console.error('Erro ao executar Whisper:', error);
      reject(new Error('Whisper não encontrado. Certifique-se de que está instalado.'));
    });
  });
}

// Modelos disponíveis do Whisper
export const WHISPER_MODELS = [
  { value: 'tiny', label: 'Tiny (~39 MB)', description: 'Mais rápido, menor precisão' },
  { value: 'base', label: 'Base (~74 MB)', description: 'Equilibrio entre velocidade e precisão' },
  { value: 'small', label: 'Small (~244 MB)', description: 'Boa precisão, velocidade moderada' },
  { value: 'medium', label: 'Medium (~769 MB)', description: 'Alta precisão, mais lento' },
  { value: 'large', label: 'Large (~1550 MB)', description: 'Máxima precisão, mais lento' },
];

// Idiomas suportados
export const SUPPORTED_LANGUAGES = [
  { value: 'auto', label: 'Detectar automaticamente' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: 'Japonês' },
  { value: 'ko', label: 'Coreano' },
  { value: 'zh', label: 'Chinês' },
];