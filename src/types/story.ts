export type Genre = 'scary' | 'history' | 'crime' | 'financial' | 'bible';

export type VoiceId =
  | 'nigerian-male'
  | 'nigerian-female'
  | 'american-male'
  | 'american-female'
  | 'british-male'
  | 'british-female';

export interface VoiceOption {
  id: VoiceId;
  label: string;
  accent: string;
  gender: 'male' | 'female';
  elevenLabsVoiceId: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  narration: string;
  imagePrompt: string;
  imageUrl?: string;
  imageStatus: 'pending' | 'generating' | 'done' | 'error';
  audioUrl?: string;
  audioStatus: 'pending' | 'generating' | 'done' | 'error';
  durationSeconds: number;
}

export interface Story {
  id: string;
  title: string;
  genre: Genre;
  theme: string;
  description: string;
  voiceId: VoiceId;
  videoLength: number; // 60-105 seconds
  musicDescription: string;
  sequelOf?: string; // previous story id
  sequelContext?: string; // previous story summary for continuation
  scenes: Scene[];
  status: 'draft' | 'generating-script' | 'generating-assets' | 'ready' | 'exporting' | 'done' | 'error';
  createdAt: Date;
}

export interface StoryFormData {
  genre: Genre;
  theme: string;
  description: string;
  voiceId: VoiceId;
  videoLength: number;
  musicDescription: string;
  sequelOf?: string;
  sequelContext?: string;
}
