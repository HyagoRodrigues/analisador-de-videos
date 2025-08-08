'use client';

import { useState } from 'react';
import axios from 'axios';

interface YouTubeDownloaderProps {
  onVideoDownloaded: (videoFile: File, videoInfo: any) => void;
  onError: (error: string) => void;
}

interface VideoInfo {
  title: string;
  duration: string;
  thumbnail: string;
  uploader: string;
  upload_date: string;
}

export const YouTubeDownloader: React.FC<YouTubeDownloaderProps> = ({
  onVideoDownloaded,
  onError,
}) => {
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const getVideoInfo = async (url: string): Promise<VideoInfo | null> => {
    try {
      const response = await axios.post('/api/video-info', { url });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do vídeo:', error);
      return null;
    }
  };

  const downloadVideo = async () => {
    if (!url.trim()) {
      onError('Por favor, insira uma URL válida do YouTube');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      onError('URL do YouTube inválida');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setVideoInfo(null);

    try {
      // Primeiro, obter informações do vídeo
      const info = await getVideoInfo(url);
      if (info) {
        setVideoInfo(info);
      }

      // Fazer download do vídeo
      const response = await axios.post('/api/download-video', 
        { url },
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDownloadProgress(progress);
            }
          },
        }
      );

      // Criar arquivo a partir do blob
      const videoBlob = new Blob([response.data], { type: 'video/mp4' });
      const fileName = info?.title ? `${info.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4` : 'video.mp4';
      const videoFile = new File([videoBlob], fileName, { type: 'video/mp4' });

      onVideoDownloaded(videoFile, info);
      setDownloadProgress(100);
    } catch (error) {
      console.error('Erro ao fazer download do vídeo:', error);
      if (axios.isAxiosError(error)) {
        onError(error.response?.data?.error || 'Erro ao fazer download do vídeo');
      } else {
        onError('Erro desconhecido ao fazer download do vídeo');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📥 Download de Vídeo do YouTube
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
            URL do YouTube
          </label>
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input-field"
            disabled={isDownloading}
          />
        </div>

        <button
          onClick={downloadVideo}
          disabled={isDownloading || !url.trim()}
          className="btn-primary w-full"
        >
          {isDownloading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="spinner"></div>
              <span>Fazendo download... {downloadProgress}%</span>
            </div>
          ) : (
            '📥 Fazer Download'
          )}
        </button>

        {isDownloading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        )}

        {videoInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Informações do Vídeo:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600"><strong>Título:</strong> {videoInfo.title}</p>
                <p className="text-sm text-gray-600"><strong>Duração:</strong> {videoInfo.duration}</p>
                <p className="text-sm text-gray-600"><strong>Canal:</strong> {videoInfo.uploader}</p>
                <p className="text-sm text-gray-600"><strong>Data:</strong> {videoInfo.upload_date}</p>
              </div>
              {videoInfo.thumbnail && (
                <div className="flex justify-center">
                  <img
                    src={videoInfo.thumbnail}
                    alt="Thumbnail do vídeo"
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};