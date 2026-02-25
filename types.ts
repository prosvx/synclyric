export interface LyricLine {
  id: string;
  timestamp: number | null; // Time in seconds (null if not yet synced)
  formattedTime: string; // [mm:ss.xx]
  text: string;
}

export interface AudioFile {
  file: File;
  previewUrl: string;
  base64: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY_TO_GENERATE = 'READY_TO_GENERATE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}
