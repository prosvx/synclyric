import React, { useCallback } from 'react';
import { Upload, Music } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      } else {
        alert("Por favor, suba apenas arquivos de áudio.");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className="w-full max-w-xl mx-auto border-2 border-dashed border-zinc-700 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => document.getElementById('audio-input')?.click()}
    >
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-zinc-800 p-4 rounded-full mb-4 group-hover:bg-indigo-600 transition-colors duration-300">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Subir Música</h3>
        <p className="text-zinc-400 text-center text-sm mb-4">
          Arraste e solte seu arquivo de áudio (MP3, WAV) aqui ou clique para selecionar.
        </p>
        <div className="flex items-center space-x-2 text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">
          <Music size={12} />
          <span>Suporta arquivos de até 20MB</span>
        </div>
        <input 
          type="file" 
          id="audio-input" 
          className="hidden" 
          accept="audio/*"
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default FileUploader;
