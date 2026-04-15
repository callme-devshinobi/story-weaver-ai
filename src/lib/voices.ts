import { VoiceOption } from '@/types/story';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'nigerian-male',
    label: 'African Nigerian Male',
    accent: 'Nigerian',
    gender: 'male',
    elevenLabsVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel - deep resonant
  },
  {
    id: 'nigerian-female',
    label: 'African Nigerian Female',
    accent: 'Nigerian',
    gender: 'female',
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
  },
  {
    id: 'american-male',
    label: 'English American Male',
    accent: 'American',
    gender: 'male',
    elevenLabsVoiceId: 'nPczCjzI2devNBz1zQrb', // Brian
  },
  {
    id: 'american-female',
    label: 'English American Female',
    accent: 'American',
    gender: 'female',
    elevenLabsVoiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica
  },
  {
    id: 'british-male',
    label: 'English UK Male',
    accent: 'British',
    gender: 'male',
    elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb', // George
  },
  {
    id: 'british-female',
    label: 'English UK Female',
    accent: 'British',
    gender: 'female',
    elevenLabsVoiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
  },
];

export const getVoiceById = (id: string): VoiceOption | undefined =>
  VOICE_OPTIONS.find((v) => v.id === id);

export const GENRE_LABELS: Record<string, string> = {
  scary: '🎃 Scary',
  history: '📜 History',
  crime: '🔍 Crime',
  financial: '💰 Financial Advice',
  bible: '📖 Bible Stories',
};

export const GENRE_COLORS: Record<string, string> = {
  scary: 'from-red-900/40 to-red-950/60',
  history: 'from-amber-900/40 to-amber-950/60',
  crime: 'from-slate-800/40 to-slate-900/60',
  financial: 'from-emerald-900/40 to-emerald-950/60',
  bible: 'from-indigo-900/40 to-indigo-950/60',
};
