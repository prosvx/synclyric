import { LyricLine } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const parseLyrics = (content: string): LyricLine[] => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  return lines.map((line, index) => {
    const cleanLine = line.trim();
    // Check if it already has timestamp (in case of re-import or hybrid)
    const match = cleanLine.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
    
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const text = match[4].trim();
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
      
      return {
        id: `line-${index}`,
        timestamp: totalSeconds,
        formattedTime: `[${match[1]}:${match[2]}.${match[3]}]`,
        text: text
      };
    } else {
      // Plain text, unsynced
      return {
        id: `line-${index}`,
        timestamp: null,
        formattedTime: '[--:--.--]',
        text: cleanLine
      };
    }
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
