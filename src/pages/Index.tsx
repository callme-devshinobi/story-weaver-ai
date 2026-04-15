import { useState } from 'react';
import { useStoryPipeline } from '@/hooks/useStoryPipeline';
import { StoryForm } from '@/components/StoryForm';
import { PipelineProgress } from '@/components/PipelineProgress';
import { SceneEditor } from '@/components/SceneEditor';
import { VideoPreview } from '@/components/VideoPreview';
import { GENRE_LABELS } from '@/lib/voices';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'dashboard' | 'create' | 'pipeline';

const Index = () => {
  const [view, setView] = useState<View>('dashboard');
  const [sequelContext, setSequelContext] = useState<{ id: string; title: string; summary?: string } | undefined>();
  const { stories, currentStory, createStory, retrySceneImage, setCurrentStory } = useStoryPipeline();

  const handleCreate = () => {
    setSequelContext(undefined);
    setView('create');
  };

  const handleCreateSequel = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setSequelContext({
        id: story.id,
        title: story.title,
        summary: story.scenes.map((s) => s.narration).join(' '),
      });
      setView('create');
    }
  };

  const handleSubmit = async (data: any) => {
    setView('pipeline');
    await createStory(data);
  };

  const handleViewStory = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setCurrentStory(story);
      setView('pipeline');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="font-heading text-xl font-bold text-gradient-gold">StoryForge</h1>
          </button>
          {view !== 'dashboard' && (
            <button
              onClick={() => setView('dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4 py-8">
                <h2 className="font-heading text-4xl font-bold text-foreground">
                  AI Faceless Content <span className="text-gradient-gold">Pipeline</span>
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Generate compelling stories with AI narration, cinematic scene images, and professional voiceover — all exportable as video.
                </p>
                <button
                  onClick={handleCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors glow-gold"
                >
                  ✨ Create New Story
                </button>
              </div>

              {/* Stories Grid */}
              {stories.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Your Stories</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stories.map((story) => (
                      <motion.div
                        key={story.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-all cursor-pointer"
                        onClick={() => handleViewStory(story.id)}
                      >
                        {/* Thumbnail */}
                        {story.scenes[0]?.imageUrl && (
                          <div className="mb-3 h-32 overflow-hidden rounded-md">
                            <img
                              src={story.scenes[0].imageUrl}
                              alt=""
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {GENRE_LABELS[story.genre]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            story.status === 'ready' ? 'bg-success/10 text-success' :
                            story.status === 'error' ? 'bg-destructive/10 text-destructive' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {story.status}
                          </span>
                        </div>
                        <h4 className="font-heading font-semibold text-foreground line-clamp-1">
                          {story.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {story.scenes.length} scenes · {story.videoLength}s
                        </p>

                        {story.status === 'ready' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateSequel(story.id);
                            }}
                            className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            📎 Create Sequel
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {stories.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-5xl mb-4">🎥</p>
                  <p>No stories yet. Create your first one!</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                {sequelContext ? 'Create Sequel' : 'New Story'}
              </h2>
              <StoryForm
                onSubmit={handleSubmit}
                isLoading={false}
                sequelContext={sequelContext}
              />
            </motion.div>
          )}

          {view === 'pipeline' && currentStory && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Progress */}
              <div className="rounded-lg border border-border bg-card p-6">
                <PipelineProgress story={currentStory} />
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Video Preview */}
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                    Video Preview
                  </h3>
                  <VideoPreview story={currentStory} />
                </div>

                {/* Scenes */}
                <div>
                  <SceneEditor story={currentStory} onRetryImage={retrySceneImage} />
                </div>
              </div>

              {currentStory.status === 'ready' && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleCreateSequel(currentStory.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-6 py-3 text-primary hover:bg-primary/10 transition-colors"
                  >
                    📎 Create Sequel Story
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
