import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface VideoInfo {
  title: string;
  duration: string;
  thumbnail: string;
  uploader: string;
  upload_date: string;
  description?: string;
  view_count?: number;
}

export async function POST(request: NextRequest) {
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

    const videoInfo = await getVideoInfo(url);
    
    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('Erro ao obter informações do vídeo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao obter informações do vídeo' },
      { status: 500 }
    );
  }
}

function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    // Usar yt-dlp para obter informações do vídeo
    const ytDlpProcess = spawn('yt-dlp', [
      '--dump-json',
      '--no-download',
      url
    ]);

    let stdout = '';
    let stderr = '';

    ytDlpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytDlpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Erro do yt-dlp:', stderr);
        reject(new Error(`yt-dlp falhou com código ${code}: ${stderr}`));
        return;
      }

      try {
        const videoData = JSON.parse(stdout);
        
        const videoInfo: VideoInfo = {
          title: videoData.title || 'Título não disponível',
          duration: formatDuration(videoData.duration || 0),
          thumbnail: videoData.thumbnail || '',
          uploader: videoData.uploader || 'Canal não disponível',
          upload_date: formatDate(videoData.upload_date || ''),
          description: videoData.description || '',
          view_count: videoData.view_count || 0,
        };

        resolve(videoInfo);
      } catch (parseError) {
        console.error('Erro ao analisar JSON do yt-dlp:', parseError);
        reject(new Error('Erro ao analisar informações do vídeo'));
      }
    });

    ytDlpProcess.on('error', (error) => {
      console.error('Erro ao executar yt-dlp:', error);
      reject(new Error('yt-dlp não encontrado. Certifique-se de que está instalado.'));
    });
  });
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return 'Duração não disponível';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Data não disponível';
  
  // yt-dlp retorna datas no formato YYYYMMDD
  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}