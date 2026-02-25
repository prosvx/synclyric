import React, { useState } from 'react';
import { AudioFile, LyricLine, AppState } from './types';
import FileUploader from './components/FileUploader';
import LyricsView from './components/LyricsView';
import { fileToBase64, parseLyrics } from './utils/helpers';
import { generateLyricsFromAudio } from './services/geminiService';
import { Sparkles, Music2, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.UPLOADING);
      setError(null);
      
      if (file.size > 25 * 1024 * 1024) { 
        throw new Error("Arquivo muito grande. Por favor envie arquivos menores que 25MB.");
      }

      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      
      setAudioFile({
        file,
        base64,
        previewUrl
      });
      
      setAppState(AppState.READY_TO_GENERATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar arquivo.");
      setAppState(AppState.IDLE);
    }
  };

  const handleGenerate = async () => {
    if (!audioFile) return;

    try {
      setAppState(AppState.GENERATING);
      setError(null);

      const rawText = await generateLyricsFromAudio(audioFile.base64, audioFile.file.type);
      const parsedLyrics = parseLyrics(rawText);
      
      if (parsedLyrics.length === 0) {
        parsedLyrics.push({
          id: 'error',
          timestamp: null,
          formattedTime: '[--:--]',
          text: rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText
        });
      }

      setLyrics(parsedLyrics);
      setAppState(AppState.PLAYING);
    } catch (err) {
      console.error(err);
      setError("Falha ao transcrever. Tente novamente.");
      setAppState(AppState.READY_TO_GENERATE);
    }
  };

  const handleReset = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile.previewUrl);
    }
    setAudioFile(null);
    setLyrics([]);
    setError(null);
    setAppState(AppState.IDLE);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-800/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-800/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <Music2 className="w-8 h-8 text-indigo-500 mr-2" />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              SyncLyric AI
            </h1>
          </div>
          <p className="text-zinc-400 max-w-md mx-auto">
            1. Envie a música. 2. A IA transcreve. 3. Você aperta <strong>V</strong> para sincronizar.
          </p>
        </div>

        <div className="w-full flex flex-col items-center">
          
          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 max-w-md w-full animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {appState === AppState.IDLE && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex justify-center">
              <FileUploader onFileSelect={handleFileSelect} />
            </div>
          )}

          {appState === AppState.UPLOADING && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-zinc-400">Processando arquivo...</p>
            </div>
          )}

          {appState === AppState.READY_TO_GENERATE && audioFile && (
             <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-8 text-center animate-in fade-in slide-in-from-bottom-8">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Music2 className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 truncate">
                  {audioFile.file.name}
                </h3>
                <p className="text-zinc-500 text-sm mb-8">
                  {(audioFile.file.size / (1024 * 1024)).toFixed(2)} MB • {audioFile.file.type}
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Trocar
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
                  >
                    <Sparkles size={18} className="mr-2" />
                    Transcrever
                  </button>
                </div>
             </div>
          )}

          {appState === AppState.GENERATING && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in max-w-md text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Transcrevendo áudio...</h3>
                <p className="text-zinc-500 text-sm">
                  Estamos extraindo a letra. Em breve você poderá sincronizá-la manualmente.
                </p>
              </div>
            </div>
          )}

          {appState === AppState.PLAYING && audioFile && (
            <div className="w-full animate-in fade-in zoom-in-95 duration-500">
              <LyricsView 
                lyrics={lyrics}
                setLyrics={setLyrics}
                audioUrl={audioFile.previewUrl} 
                onReset={handleReset}
                title={audioFile.file.name}
              />
            </div>
          )}
        </div>

        <div className="mt-16 text-zinc-600 text-xs">
          Powered by Gemini 2.0 Flash/Pro
        </div>
      </div>
    </div>
  );
};

export default App;
