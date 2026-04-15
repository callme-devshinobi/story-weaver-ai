import { useState, useCallback } from 'react';
import { Story, Scene, StoryFormData, Genre } from '@/types/story';
import { getVoiceById } from '@/lib/voices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useStoryPipeline() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { toast } = useToast();

  const createStory = useCallback(async (formData: StoryFormData) => {
    const storyId = generateId();
    const story: Story = {
      id: storyId,
      title: 'Generating...',
      genre: formData.genre,
      theme: formData.theme,
      description: formData.description,
      voiceId: formData.voiceId,
      videoLength: formData.videoLength,
      musicDescription: formData.musicDescription,
      sequelOf: formData.sequelOf,
      sequelContext: formData.sequelContext,
      scenes: [],
      status: 'generating-script',
      createdAt: new Date(),
    };

    setCurrentStory(story);
    setStories((prev) => [story, ...prev]);

    try {
      // Step 1: Generate story script
      const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-story', {
        body: {
          genre: formData.genre,
          theme: formData.theme,
          description: formData.description,
          videoLength: formData.videoLength,
          sequelContext: formData.sequelContext,
          musicDescription: formData.musicDescription,
        },
      });

      if (scriptError || scriptData?.error) throw new Error(scriptData?.error || 'Failed to generate script');

      const scenes: Scene[] = scriptData.scenes.map((s: any, i: number) => ({
        id: generateId(),
        sceneNumber: i + 1,
        narration: s.narration,
        imagePrompt: s.imagePrompt,
        durationSeconds: s.durationSeconds || 10,
        imageStatus: 'pending' as const,
        audioStatus: 'pending' as const,
      }));

      const updatedStory: Story = {
        ...story,
        title: scriptData.title,
        scenes,
        status: 'generating-assets',
      };

      setCurrentStory(updatedStory);
      setStories((prev) => prev.map((s) => (s.id === storyId ? updatedStory : s)));

      // Step 2: Generate images and audio in parallel
      const voice = getVoiceById(formData.voiceId);
      const updatedScenes = [...scenes];

      const imagePromises = scenes.map(async (scene, i) => {
        try {
          updatedScenes[i] = { ...updatedScenes[i], imageStatus: 'generating' };
          updateStoryScenes(storyId, updatedScenes);

          const { data, error } = await supabase.functions.invoke('generate-scene-image', {
            body: { imagePrompt: scene.imagePrompt, genre: formData.genre },
          });

          if (error || data?.error) throw new Error(data?.error || 'Image gen failed');
          updatedScenes[i] = { ...updatedScenes[i], imageUrl: data.imageUrl, imageStatus: 'done' };
        } catch (e) {
          console.error(`Scene ${i + 1} image error:`, e);
          updatedScenes[i] = { ...updatedScenes[i], imageStatus: 'error' };
        }
        updateStoryScenes(storyId, [...updatedScenes]);
      });

      // Generate audio sequentially (ElevenLabs limits to 2 concurrent requests)
      const generateAllAudio = async () => {
        for (let i = 0; i < scenes.length; i++) {
          try {
            updatedScenes[i] = { ...updatedScenes[i], audioStatus: 'generating' };
            updateStoryScenes(storyId, [...updatedScenes]);

            const { data, error } = await supabase.functions.invoke('generate-voiceover', {
              body: { text: scenes[i].narration, elevenLabsVoiceId: voice?.elevenLabsVoiceId },
            });

            if (error || data?.error) throw new Error(data?.error || 'Audio gen failed');
            const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
            updatedScenes[i] = { ...updatedScenes[i], audioUrl, audioStatus: 'done' };
          } catch (e) {
            console.error(`Scene ${i + 1} audio error:`, e);
            updatedScenes[i] = { ...updatedScenes[i], audioStatus: 'error' };
          }
          updateStoryScenes(storyId, [...updatedScenes]);
          // Small delay between requests to avoid rate limits
          if (i < scenes.length - 1) await new Promise((r) => setTimeout(r, 500));
        }
      };

      await Promise.all([...imagePromises, generateAllAudio()]);

      const hasErrors = updatedScenes.some((s) => s.imageStatus === 'error' || s.audioStatus === 'error');
      const finalStory: Story = {
        ...updatedStory,
        scenes: updatedScenes,
        status: hasErrors ? 'error' : 'ready',
      };

      setCurrentStory(finalStory);
      setStories((prev) => prev.map((s) => (s.id === storyId ? finalStory : s)));

      if (!hasErrors) {
        toast({ title: '✨ Story ready!', description: `"${scriptData.title}" is ready for preview.` });
      } else {
        toast({ title: '⚠️ Story generated with errors', description: 'Some scenes failed. You can retry them.', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Pipeline error:', e);
      const errorStory = { ...story, status: 'error' as const };
      setCurrentStory(errorStory);
      setStories((prev) => prev.map((s) => (s.id === storyId ? errorStory : s)));
      toast({ title: 'Generation failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  }, [toast]);

  const updateStoryScenes = useCallback((storyId: string, scenes: Scene[]) => {
    setCurrentStory((prev) => (prev?.id === storyId ? { ...prev, scenes: [...scenes] } : prev));
    setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, scenes: [...scenes] } : s)));
  }, []);

  const retrySceneImage = useCallback(async (storyId: string, sceneId: string) => {
    const story = stories.find((s) => s.id === storyId) || currentStory;
    if (!story) return;

    const sceneIndex = story.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex === -1) return;

    const updatedScenes = [...story.scenes];
    updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], imageStatus: 'generating' };
    updateStoryScenes(storyId, updatedScenes);

    try {
      const { data, error } = await supabase.functions.invoke('generate-scene-image', {
        body: { imagePrompt: updatedScenes[sceneIndex].imagePrompt, genre: story.genre },
      });

      if (error || data?.error) throw new Error(data?.error || 'Image retry failed');
      updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], imageUrl: data.imageUrl, imageStatus: 'done' };
    } catch {
      updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], imageStatus: 'error' };
    }
    updateStoryScenes(storyId, updatedScenes);

    // Check if all scenes done now
    const allDone = updatedScenes.every((s) => s.imageStatus === 'done' && s.audioStatus === 'done');
    if (allDone) {
      const readyStory = { ...story, scenes: updatedScenes, status: 'ready' as const };
      setCurrentStory(readyStory);
      setStories((prev) => prev.map((s) => (s.id === storyId ? readyStory : s)));
    }
  }, [stories, currentStory, updateStoryScenes]);

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory,
    retrySceneImage,
  };
}
