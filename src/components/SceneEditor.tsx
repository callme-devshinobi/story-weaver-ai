import { Scene, Story } from '@/types/story';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SceneEditorProps {
  story: Story;
  onRetryImage: (storyId: string, sceneId: string) => void;
}

export function SceneEditor({ story, onRetryImage }: SceneEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading font-semibold text-foreground">
        Scenes ({story.scenes.length})
      </h3>
      <div className="grid gap-3">
        <AnimatePresence>
          {story.scenes.map((scene, i) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              {/* Image preview */}
              <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {scene.imageStatus === 'done' && scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${scene.sceneNumber}`}
                    className="h-full w-full object-cover"
                  />
                ) : scene.imageStatus === 'generating' ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : scene.imageStatus === 'error' ? (
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    <span className="text-xs text-destructive">Failed</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => onRetryImage(story.id, scene.id)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Pending
                  </div>
                )}
              </div>

              {/* Scene info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">Scene {scene.sceneNumber}</span>
                  <span className="text-xs text-muted-foreground">{scene.durationSeconds}s</span>
                  <div className="flex gap-1 ml-auto">
                    <StatusDot status={scene.imageStatus} label="IMG" />
                    <StatusDot status={scene.audioStatus} label="AUD" />
                  </div>
                </div>
                <p className="text-sm text-secondary-foreground line-clamp-2">{scene.narration}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusDot({ status, label }: { status: string; label: string }) {
  const color =
    status === 'done'
      ? 'bg-success'
      : status === 'generating'
      ? 'bg-primary animate-pulse'
      : status === 'error'
      ? 'bg-destructive'
      : 'bg-muted-foreground/30';

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
