import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LyricLine } from '../types';
import { Play, Pause, RotateCcw, Download, Check, Undo2, Trash2, Edit2 } from 'lucide-react';
import { formatTime } from '../utils/helpers';

interface LyricsViewProps {
  lyrics: LyricLine[];
  setLyrics: (lyrics: LyricLine[]) => void;
  audioUrl: string;
  onReset: () => void;
  title?: string;
}

const LyricsView: React.FC<LyricsViewProps> = ({ lyrics, setLyrics, audioUrl, onReset, title = "Música Desconhecida" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Find the index of the first line that doesn't have a timestamp yet
  const nextUnsyncedIndex = lyrics.findIndex(l => l.timestamp === null);
  
  // For playback highlighting (auto-scroll)
  const activePlayIndex = lyrics.findIndex((line, i) => {
    if (line.timestamp === null) return false;
    const nextLine = lyrics.slice(i + 1).find(l => l.timestamp !== null);
    return currentTime >= line.timestamp && (!nextLine || currentTime < nextLine.timestamp);
  });

  // Scroll logic
  useEffect(() => {
    // Only auto-scroll if we are NOT hovering to edit (simplified check: usually we want to follow action)
    // We prioritize the next unsynced line for the synchronizer person
    const targetIndex = nextUnsyncedIndex !== -1 ? nextUnsyncedIndex : activePlayIndex;
    
    if (targetIndex !== -1 && containerRef.current) {
      const activeElement = document.getElementById(`lyric-${targetIndex}`);
      if (activeElement) {
        // Use a slight delay or less aggressive behavior could be better, but standard is fine
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activePlayIndex, nextUnsyncedIndex]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // The Manual Sync Action
  const syncCurrentLine = useCallback(() => {
    if (nextUnsyncedIndex === -1 || !audioRef.current) return;

    const currentTimestamp = audioRef.current.currentTime;
    
    // Create new array with updated timestamp
    const newLyrics = [...lyrics];
    newLyrics[nextUnsyncedIndex] = {
      ...newLyrics[nextUnsyncedIndex],
      timestamp: currentTimestamp,
      formattedTime: `[${formatTime(currentTimestamp)}]`
    };

    setLyrics(newLyrics);
  }, [lyrics, nextUnsyncedIndex, setLyrics]);

  // Undo Logic
  const undoLastSync = useCallback(() => {
    let indexToUndo = -1;

    if (nextUnsyncedIndex === -1) {
      indexToUndo = lyrics.length - 1;
    } else if (nextUnsyncedIndex > 0) {
      indexToUndo = nextUnsyncedIndex - 1;
    }

    if (indexToUndo !== -1) {
      const newLyrics = [...lyrics];
      newLyrics[indexToUndo] = {
        ...newLyrics[indexToUndo],
        timestamp: null,
        formattedTime: '[--:--.--]'
      };
      setLyrics(newLyrics);
    }
  }, [lyrics, nextUnsyncedIndex, setLyrics]);

  // Editing Logic
  const handleLineTextChange = (index: number, newText: string) => {
    const newLyrics = [...lyrics];
    newLyrics[index] = { ...newLyrics[index], text: newText };
    setLyrics(newLyrics);
  };

  const handleDeleteLine = (index: number) => {
    const newLyrics = lyrics.filter((_, i) => i !== index);
    setLyrics(newLyrics);
  };

  // Keyboard shortcut 'v', Space, Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'v') {
        e.preventDefault(); 
        syncCurrentLine();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Backspace') {
        // Only undo if not editing text
        undoLastSync();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncCurrentLine, undoLastSync, togglePlay]);

  const downloadLrc = () => {
    const content = lyrics
      .filter(l => l.timestamp !== null)
      .map(l => `${l.formattedTime} ${l.text}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.lrc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncedCount = lyrics.filter(l => l.timestamp !== null).length;
  const progressPercent = (syncedCount / lyrics.length) * 100;
  const canUndo = nextUnsyncedIndex === -1 || nextUnsyncedIndex > 0;

  return (
    <div className="flex flex-col h-[700px] w-full max-w-5xl mx-auto bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800">
      
      {/* Header & Controls */}
      <div className="bg-zinc-900 p-6 border-b border-zinc-800 z-10 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-white truncate">{title}</h2>
            <p className="text-zinc-400 text-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${nextUnsyncedIndex === -1 ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {nextUnsyncedIndex === -1 ? "Sincronização Completa!" : "Modo de Sincronização Manual"}
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={downloadLrc}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
              title="Baixar .LRC"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onReset}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition"
              title="Nova Música"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Sync Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-105 shadow-lg"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col justify-center">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-2 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
             <button
              onClick={undoLastSync}
              disabled={!canUndo}
              className={`
                flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all
                ${!canUndo 
                  ? 'text-zinc-600 cursor-not-allowed' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
              `}
              title="Desfazer (Backspace)"
            >
              <Undo2 size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1">Undo</span>
            </button>

            {/* THE BIG SYNC BUTTON */}
            <button
              onClick={syncCurrentLine}
              disabled={nextUnsyncedIndex === -1}
              className={`
                flex flex-col items-center justify-center w-24 h-20 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all
                ${nextUnsyncedIndex === -1 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' 
                  : 'bg-indigo-600 border-indigo-800 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}
              `}
            >
              <span className="text-2xl font-black">V</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics Display */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 relative bg-black/40 backdrop-blur-sm scroll-smooth"
      >
        <div className="space-y-4 flex flex-col items-center text-center">
          {lyrics.length === 0 ? (
            <div className="text-zinc-500 mt-10">Nenhuma letra detectada.</div>
          ) : (
            lyrics.map((line, idx) => {
              const isSynced = line.timestamp !== null;
              const isNext = idx === nextUnsyncedIndex;
              const isPast = isSynced && currentTime > (line.timestamp || 0);
              const isActive = isSynced && idx === activePlayIndex;

              return (
                <div
                  key={line.id}
                  id={`lyric-${idx}`}
                  className={`
                    group relative transition-all duration-300 ease-in-out px-4 py-3 rounded-2xl max-w-4xl w-full
                    border border-transparent flex items-center gap-3
                    ${isActive 
                      ? 'bg-indigo-500/20 text-white scale-105 border-indigo-500/30' 
                      : ''}
                    ${isNext 
                      ? 'bg-zinc-800/80 text-white border-zinc-700 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900 scale-100 opacity-100 z-10 shadow-xl' 
                      : ''}
                    ${!isSynced && !isNext 
                      ? 'text-zinc-600 opacity-50 scale-95' 
                      : ''}
                    ${isSynced && !isActive 
                      ? 'text-zinc-400 hover:text-zinc-200' 
                      : ''}
                  `}
                  onClick={() => {
                    // Clicking the container (outside input) seeks the audio
                    if (isSynced && audioRef.current && line.timestamp !== null) {
                      audioRef.current.currentTime = line.timestamp;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                >
                    {/* Time or Status */}
                    <div className="w-16 text-xs font-mono text-zinc-500 text-right flex-shrink-0">
                      {isSynced ? (
                        formatTime(line.timestamp!)
                      ) : (
                        isNext ? <span className="text-indigo-400 font-bold animate-pulse">AGORA</span> : "--:--"
                      )}
                    </div>

                    {/* Text Input */}
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleLineTextChange(idx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()} // Allow cursor movement
                      className={`
                        flex-1 bg-transparent border-none outline-none text-lg md:text-xl font-medium text-center w-full
                        focus:ring-0 focus:border-b focus:border-indigo-500 transition-colors
                        ${isNext ? 'font-bold placeholder-zinc-500' : ''}
                        ${isActive ? 'text-white' : 'text-inherit'}
                      `}
                      placeholder="Digitar letra..."
                    />

                    {/* Action Buttons */}
                    <div className="w-16 flex-shrink-0 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                       <button
                         onClick={(e) => { e.stopPropagation(); handleDeleteLine(idx); }}
                         className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                         title="Excluir linha"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>

                    {/* Mobile Sync Indicator (Overlay) */}
                    {isNext && (
                         <div className="absolute right-4 md:hidden">
                            <button 
                             onClick={(e) => { e.stopPropagation(); syncCurrentLine(); }}
                             className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full text-white shadow-lg active:scale-90"
                           >
                             V
                           </button>
                         </div>
                    )}
                </div>
              );
            })
          )}
          <div className="h-[40vh]"></div> 
        </div>
      </div>
      
      {/* Mobile Sticky Button Area */}
      {nextUnsyncedIndex !== -1 && (
        <div className="md:hidden absolute bottom-6 right-6 z-50 flex flex-col gap-4 items-center">
           {canUndo && (
             <button
               onClick={undoLastSync}
               className="w-12 h-12 bg-zinc-800 rounded-full text-zinc-400 shadow-lg flex items-center justify-center active:scale-95 border border-zinc-700"
             >
               <Undo2 size={20} />
             </button>
           )}
           <button 
             onClick={syncCurrentLine}
             className="w-16 h-16 bg-indigo-600 rounded-full text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center font-bold text-2xl active:scale-95 transition-transform border-4 border-zinc-900"
           >
             V
           </button>
        </div>
      )}

      {/* Audio Element Hidden */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default LyricsView;