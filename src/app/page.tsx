'use client';

import { useState } from 'react';
import axios from 'axios';
import { YouTubeDownloader } from '@/components/YouTubeDownloader';
import { VideoProcessor } from '@/components/VideoProcessor';

interface TranscriptionResult {
  transcription: string;
  language: string;
  model: string;
  duration: number;
}

interface SummaryResult {
  summary: string;
  wordCount: number;
  keyTopics: string[];
  sentiment: string;
  summaryType: string;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'download' | 'process' | 'transcribe' | 'summarize' | 'complete'>('download');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [error, setError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionStep, setTranscriptionStep] = useState('');

  const handleVideoDownloaded = (file: File, info: any) => {
    setVideoFile(file);
    setVideoInfo(info);
    setCurrentStep('process');
    setError('');
  };

  const handleAudioExtracted = async (audio: Blob) => {
    setAudioBlob(audio);
    setCurrentStep('transcribe');
    setError('');
    
    // Automaticamente iniciar transcrição
    await handleTranscribe(audio);
  };

  const handleTranscribe = async (audio: Blob, language: string = 'auto', model: string = 'base') => {
    setIsTranscribing(true);
    setError('');
    setTranscriptionProgress(0);
    setTranscriptionStep('Preparando áudio para transcrição...');

    try {
      // Simular progresso visual durante o processo
      const progressSteps = [
        { progress: 10, step: 'Preparando arquivo de áudio...' },
        { progress: 25, step: 'Enviando para servidor de transcrição...' },
        { progress: 40, step: 'Inicializando modelo de IA...' },
        { progress: 60, step: 'Processando áudio com Whisper...' },
        { progress: 80, step: 'Finalizando transcrição...' },
        { progress: 95, step: 'Preparando resultado...' }
      ];

      // Simular progresso gradual
      for (const { progress, step } of progressSteps) {
        setTranscriptionProgress(progress);
        setTranscriptionStep(step);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const formData = new FormData();
      formData.append('audio', audio, 'audio.mp3');
      formData.append('language', language);
      formData.append('model', model);

      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscriptionProgress(100);
      setTranscriptionStep('Transcrição concluída!');
      setTranscription(response.data);
      setCurrentStep('summarize');
      
      // Automaticamente gerar resumo
      await handleSummarize(response.data.transcription);
    } catch (error) {
      console.error('Erro na transcrição:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Erro ao transcrever áudio');
      } else {
        setError('Erro desconhecido na transcrição');
      }
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
      setTranscriptionStep('');
    }
  };

  const handleSummarize = async (transcriptionText: string, summaryType: string = 'brief') => {
    setIsSummarizing(true);
    setError('');

    try {
      const response = await axios.post('/api/summarize', {
        transcription: transcriptionText,
        summaryType,
        language: 'pt'
      });

      setSummary(response.data);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Erro ao gerar resumo');
      } else {
        setError('Erro desconhecido ao gerar resumo');
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const resetProcess = () => {
    setCurrentStep('download');
    setVideoFile(null);
    setVideoInfo(null);
    setAudioBlob(null);
    setTranscription(null);
    setSummary(null);
    setError('');
    setTranscriptionProgress(0);
    setTranscriptionStep('');
  };

  const downloadTranscription = () => {
    if (!transcription) return;
    
    const content = `Transcrição do Vídeo\n` +
                   `========================\n\n` +
                   `Modelo: ${transcription.model}\n` +
                   `Idioma: ${transcription.language}\n` +
                   `Palavras: ${transcription.transcription.split(' ').length}\n\n` +
                   `Conteúdo:\n` +
                   `----------\n` +
                   `${transcription.transcription}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcricao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!transcription || !summary || !videoInfo) return;

    const content = `# Análise de Vídeo do YouTube\n\n## Informações do Vídeo\n**Título:** ${videoInfo.title}\n**Duração:** ${videoInfo.duration}\n**Canal:** ${videoInfo.uploader}\n**Data:** ${videoInfo.upload_date}\n\n## Transcrição\n${transcription.transcription}\n\n## Resumo\n${summary.summary}\n\n## Tópicos Principais\n${summary.keyTopics.map(topic => `- ${topic}`).join('\n')}\n\n## Análise\n**Palavras:** ${summary.wordCount}\n**Sentimento:** ${summary.sentiment}\n**Modelo de Transcrição:** ${transcription.model}\n**Idioma:** ${transcription.language}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analise_${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🎬 Analisador de Vídeos do YouTube
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Extraia transcrições e gere resumos inteligentes usando processamento local
            </p>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              {[
                { step: 'download', label: 'Download', icon: '📥' },
                { step: 'process', label: 'Processar', icon: '🎬' },
                { step: 'transcribe', label: 'Transcrever', icon: '📝' },
                { step: 'summarize', label: 'Resumir', icon: '📊' },
                { step: 'complete', label: 'Concluído', icon: '✅' }
              ].map((item, index) => {
                const isActive = currentStep === item.step;
                const isCompleted = ['download', 'process', 'transcribe', 'summarize', 'complete'].indexOf(currentStep) > index;
                
                return (
                  <div key={item.step} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`ml-2 text-sm ${
                      isActive ? 'text-blue-600 font-medium' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                    {index < 4 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div className="text-red-800">{error}</div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Download */}
            {currentStep === 'download' && (
              <YouTubeDownloader
                onVideoDownloaded={handleVideoDownloaded}
                onError={handleError}
              />
            )}

            {/* Step 2: Process */}
            {(currentStep === 'process' || currentStep === 'transcribe' || currentStep === 'summarize' || currentStep === 'complete') && (
              <VideoProcessor
                videoFile={videoFile}
                videoInfo={videoInfo}
                onAudioExtracted={handleAudioExtracted}
                onError={handleError}
              />
            )}

            {/* Step 3: Transcription Status */}
            {(currentStep === 'transcribe' || currentStep === 'summarize' || currentStep === 'complete') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Transcrição</h2>
                {isTranscribing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4">
                      <div className="spinner mr-3"></div>
                      <span className="text-gray-600">Transcrevendo áudio...</span>
                    </div>
                    
                    {/* Barra de Progresso */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${transcriptionProgress}%` }}
                      ></div>
                    </div>
                    
                    {/* Informações do Progresso */}
                    <div className="text-center space-y-2">
                      <div className="text-lg font-medium text-gray-700">
                        {transcriptionProgress}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {transcriptionStep}
                      </div>
                    </div>
                    
                    {/* Informações Adicionais */}
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">🤖</span>
                        <strong>Processamento com IA:</strong>
                      </div>
                      <ul className="list-disc list-inside space-y-1 ml-6">
                        <li>Utilizando modelo Whisper para transcrição</li>
                        <li>Processamento local e seguro</li>
                        <li>Tempo estimado: 1-3 minutos</li>
                      </ul>
                    </div>
                  </div>
                ) : transcription ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div><strong>Modelo:</strong> {transcription.model}</div>
                          <div><strong>Idioma:</strong> {transcription.language}</div>
                          <div><strong>Palavras:</strong> {transcription.transcription.split(' ').length}</div>
                        </div>
                        <button
                          onClick={downloadTranscription}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <span>📥</span>
                          Baixar Transcrição
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap">{transcription.transcription}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Aguardando processamento de áudio...
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Summary */}
            {(currentStep === 'summarize' || currentStep === 'complete') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Resumo</h2>
                {isSummarizing ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="spinner mr-3"></div>
                    <span className="text-gray-600">Gerando resumo...</span>
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div><strong>Palavras:</strong> {summary.wordCount}</div>
                        <div><strong>Sentimento:</strong> {summary.sentiment}</div>
                        <div><strong>Tipo:</strong> {summary.summaryType}</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{summary.summary}</p>
                    </div>
                    {summary.keyTopics.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">🔑 Tópicos Principais:</h3>
                        <div className="flex flex-wrap gap-2">
                          {summary.keyTopics.map((topic, index) => (
                            <span key={index} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Aguardando transcrição...
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 'complete' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Análise Concluída</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={downloadResults}
                    className="btn-primary flex-1"
                  >
                    📥 Baixar Resultados (Markdown)
                  </button>
                  <button
                    onClick={resetProcess}
                    className="btn-secondary flex-1"
                  >
                    🔄 Nova Análise
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}