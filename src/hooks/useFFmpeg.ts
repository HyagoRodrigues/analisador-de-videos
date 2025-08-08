import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { useState, useRef, useCallback } from 'react';

export interface UseFFmpegReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  load: () => Promise<void>;
  extractAudio: (videoFile: File) => Promise<Blob | null>;
  convertVideo: (videoFile: File, format: string) => Promise<Blob | null>;
}

export const useFFmpeg = (): UseFFmpegReturn => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (isLoaded || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      // Configurar listener de progresso
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message);
      });

      // Carregar FFmpeg core usando UMD para evitar problemas com módulos
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setIsLoaded(true);
      setProgress(100);
    } catch (err) {
      console.error('Erro ao carregar FFmpeg:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar FFmpeg');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const extractAudio = useCallback(async (videoFile: File): Promise<Blob | null> => {
    if (!ffmpegRef.current || !isLoaded) {
      throw new Error('FFmpeg não está carregado');
    }

    try {
      setError(null);
      setProgress(0);

      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp3';

      // Escrever arquivo de entrada
      const arrayBuffer = await videoFile.arrayBuffer();
      await ffmpeg.writeFile(inputFileName, new Uint8Array(arrayBuffer));

      // Executar comando de extração de áudio
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // Sem vídeo
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        '-ar', '22050',
        '-y', // Sobrescrever arquivo de saída
        outputFileName
      ]);

      // Ler arquivo de saída
      const data = await ffmpeg.readFile(outputFileName);
      const audioBlob = new Blob([data], { type: 'audio/mp3' });

      // Limpar arquivos temporários
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      setProgress(100);
      return audioBlob;
    } catch (err) {
      console.error('Erro ao extrair áudio:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao extrair áudio');
      return null;
    }
  }, [isLoaded]);

  const convertVideo = useCallback(async (videoFile: File, format: string): Promise<Blob | null> => {
    if (!ffmpegRef.current || !isLoaded) {
      throw new Error('FFmpeg não está carregado');
    }

    try {
      setError(null);
      setProgress(0);

      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.mp4';
      const outputFileName = `output.${format}`;

      // Escrever arquivo de entrada
      const arrayBuffer = await videoFile.arrayBuffer();
      await ffmpeg.writeFile(inputFileName, new Uint8Array(arrayBuffer));

      // Executar comando de conversão
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-y', // Sobrescrever arquivo de saída
        outputFileName
      ]);

      // Ler arquivo de saída
      const data = await ffmpeg.readFile(outputFileName);
      const videoBlob = new Blob([data], { type: `video/${format}` });

      // Limpar arquivos temporários
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      setProgress(100);
      return videoBlob;
    } catch (err) {
      console.error('Erro ao converter vídeo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao converter vídeo');
      return null;
    }
  }, [isLoaded]);

  return {
    isLoaded,
    isLoading,
    error,
    progress,
    load,
    extractAudio,
    convertVideo,
  };
};