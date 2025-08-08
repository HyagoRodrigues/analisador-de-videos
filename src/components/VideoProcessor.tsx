'use client';

import { useState, useEffect } from 'react';
import { useFFmpeg } from '@/hooks/useFFmpeg';

interface VideoProcessorProps {
  videoFile: File | null;
  videoInfo: any;
  onAudioExtracted: (audioBlob: Blob) => void;
  onError: (error: string) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  videoFile,
  videoInfo,
  onAudioExtracted,
  onError,
}) => {
  const {
    isLoaded,
    isLoading,
    error,
    progress,
    load,
    extractAudio,
  } = useFFmpeg();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleLoadFFmpeg = async () => {
    try {
      await load();
    } catch (err) {
      onError('Erro ao carregar FFmpeg. Verifique sua conexão com a internet.');
    }
  };

  const handleExtractAudio = async () => {
    if (!videoFile || !isLoaded) {
      onError('Vídeo não carregado ou FFmpeg não está pronto');
      return;
    }

    setIsProcessing(true);
    setProcessStep('Extraindo áudio do vídeo...');

    try {
      const audioBlob = await extractAudio(videoFile);
      if (audioBlob) {
        onAudioExtracted(audioBlob);
        setProcessStep('Áudio extraído com sucesso!');
      } else {
        onError('Falha ao extrair áudio do vídeo');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro desconhecido ao extrair áudio');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!videoFile) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">Nenhum vídeo carregado para processamento</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🎬 Processamento de Vídeo
      </h2>

      {/* Informações do arquivo */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Arquivo Carregado:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600"><strong>Nome:</strong> {videoFile.name}</p>
            <p className="text-sm text-gray-600"><strong>Tamanho:</strong> {formatFileSize(videoFile.size)}</p>
            <p className="text-sm text-gray-600"><strong>Tipo:</strong> {videoFile.type}</p>
          </div>
          {videoInfo && (
            <div>
              <p className="text-sm text-gray-600"><strong>Título:</strong> {videoInfo.title}</p>
              <p className="text-sm text-gray-600"><strong>Duração:</strong> {videoInfo.duration}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status do FFmpeg */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Status do FFmpeg:</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${
            isLoaded ? 'bg-green-500' : isLoading ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isLoaded ? 'Carregado e pronto' : isLoading ? 'Carregando...' : 'Não carregado'}
          </span>
          {isLoading && (
            <span className="text-sm text-gray-500">({progress}%)</span>
          )}
        </div>

        {!isLoaded && !isLoading && (
          <button
            onClick={handleLoadFFmpeg}
            className="btn-secondary mt-2"
          >
            🔄 Carregar FFmpeg
          </button>
        )}

        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Ações de processamento */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Ações Disponíveis:</h3>
        
        <button
          onClick={handleExtractAudio}
          disabled={!isLoaded || isProcessing}
          className="btn-primary w-full"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="spinner"></div>
              <span>Processando... {progress}%</span>
            </div>
          ) : (
            '🎵 Extrair Áudio para Transcrição'
          )}
        </button>

        {isProcessing && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {processStep}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Informações sobre o processamento */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Informações Importantes:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• O processamento é feito localmente no seu navegador</li>
          <li>• Arquivos grandes podem demorar mais para processar</li>
          <li>• Seus dados nunca saem do seu computador</li>
          <li>• O FFmpeg será baixado apenas uma vez (≈30MB)</li>
        </ul>
      </div>
    </div>
  );
};