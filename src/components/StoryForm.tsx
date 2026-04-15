import { useState } from 'react';
import { StoryFormData, Genre, VoiceId } from '@/types/story';
import { VOICE_OPTIONS, GENRE_LABELS } from '@/lib/voices';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  isLoading: boolean;
  sequelContext?: { id: string; title: string; summary?: string };
}

export function StoryForm({ onSubmit, isLoading, sequelContext }: StoryFormProps) {
  const [genre, setGenre] = useState<Genre>('scary');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [voiceId, setVoiceId] = useState<VoiceId>('american-male');
  const [videoLength, setVideoLength] = useState([75]);
  const [musicDescription, setMusicDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      genre,
      theme,
      description,
      voiceId,
      videoLength: videoLength[0],
      musicDescription,
      sequelOf: sequelContext?.id,
      sequelContext: sequelContext?.summary,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {sequelContext && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-primary font-medium">📎 Sequel to: "{sequelContext.title}"</p>
        </div>
      )}

      {/* Genre Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Genre</label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(GENRE_LABELS) as [Genre, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGenre(key as Genre)}
              className={`rounded-lg border p-3 text-center text-sm transition-all ${
                genre === key
                  ? 'border-primary bg-primary/10 text-primary glow-gold'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Theme / Topic</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., Haunted lighthouse on a remote island..."
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Story Details</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the story you want: characters, setting, tone, key events..."
          className="min-h-[100px] resize-none border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary"
          required
        />
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Narrator Voice</label>
        <Select value={voiceId} onValueChange={(v) => setVoiceId(v as VoiceId)}>
          <SelectTrigger className="border-border bg-card text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {VOICE_OPTIONS.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <span className="flex items-center gap-2">
                  <span>{voice.gender === 'male' ? '🎙️' : '🎤'}</span>
                  <span>{voice.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Length */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Video Length: <span className="text-primary">{videoLength[0]}s</span>
        </label>
        <Slider
          value={videoLength}
          onValueChange={setVideoLength}
          min={60}
          max={105}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>60s (Short)</span>
          <span>105s (Extended)</span>
        </div>
      </div>

      {/* Music Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Background Music / Sound</label>
        <input
          type="text"
          value={musicDescription}
          onChange={(e) => setMusicDescription(e.target.value)}
          placeholder="e.g., Eerie ambient piano, building tension with subtle strings..."
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading || !theme || !description}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold glow-gold"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Generating Story...
          </span>
        ) : (
          '✨ Generate Story'
        )}
      </Button>
    </motion.form>
  );
}
