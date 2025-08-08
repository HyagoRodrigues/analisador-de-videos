import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    // Validar URL do YouTube
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'URL do YouTube inválida' },
        { status: 400 }
      );
    }

    // Criar arquivo temporário
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const fileName = `video_${uuidv4()}.mp4`;
    tempFilePath = path.join(tempDir, fileName);

    // Fazer download do vídeo
    await downloadVideo(url, tempFilePath);

    // Verificar se o arquivo foi criado
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Arquivo de vídeo não foi criado');
    }

    // Ler o arquivo e retornar como stream
    const videoBuffer = fs.readFileSync(tempFilePath);
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFilePath);
    tempFilePath = null;

    // Retornar o vídeo como blob
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': videoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erro ao fazer download do vídeo:', error);
    
    // Limpar arquivo temporário em caso de erro
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivo temporário:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function downloadVideo(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Usar yt-dlp para fazer download do vídeo
    const ytDlpProcess = spawn('yt-dlp', [
      '-f', 'best[ext=mp4]/best', // Preferir MP4, mas aceitar outros formatos
      '-o', outputPath,
      '--no-playlist', // Não baixar playlist inteira
      '--max-filesize', '500M', // Limitar tamanho do arquivo
      url
    ]);

    let stderr = '';

    ytDlpProcess.stdout.on('data', (data) => {
      // Log do progresso (opcional)
      console.log('yt-dlp stdout:', data.toString());
    });

    ytDlpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('yt-dlp stderr:', data.toString());
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Erro do yt-dlp:', stderr);
        reject(new Error(`Falha no download: ${stderr}`));
        return;
      }

      resolve();
    });

    ytDlpProcess.on('error', (error) => {
      console.error('Erro ao executar yt-dlp:', error);
      reject(new Error('yt-dlp não encontrado. Certifique-se de que está instalado.'));
    });
  });
}

// Função para limpeza de arquivos temporários antigos (executar periodicamente)
export function cleanupTempFiles() {
  const tempDir = path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hora

  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Arquivo temporário removido: ${file}`);
      } catch (error) {
        console.error(`Erro ao remover arquivo temporário ${file}:`, error);
      }
    }
  });
}