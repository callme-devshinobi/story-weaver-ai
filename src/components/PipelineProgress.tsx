import { Story } from '@/types/story';
import { motion } from 'framer-motion';

interface PipelineProgressProps {
  story: Story;
}

export function PipelineProgress({ story }: PipelineProgressProps) {
  const totalScenes = story.scenes.length;
  const imagesDone = story.scenes.filter((s) => s.imageStatus === 'done').length;
  const audioDone = story.scenes.filter((s) => s.audioStatus === 'done').length;
  const imagesGenerating = story.scenes.filter((s) => s.imageStatus === 'generating').length;
  const audioGenerating = story.scenes.filter((s) => s.audioStatus === 'generating').length;

  const steps = [
    {
      label: 'Script',
      status: story.status === 'generating-script' ? 'active' : totalScenes > 0 ? 'done' : 'pending',
    },
    {
      label: `Images (${imagesDone}/${totalScenes})`,
      status: imagesGenerating > 0 ? 'active' : imagesDone === totalScenes && totalScenes > 0 ? 'done' : imagesDone > 0 ? 'partial' : 'pending',
    },
    {
      label: `Audio (${audioDone}/${totalScenes})`,
      status: audioGenerating > 0 ? 'active' : audioDone === totalScenes && totalScenes > 0 ? 'done' : audioDone > 0 ? 'partial' : 'pending',
    },
    {
      label: 'Ready',
      status: story.status === 'ready' ? 'done' : story.status === 'error' ? 'error' : 'pending',
    },
  ];

  const overallProgress = totalScenes > 0
    ? Math.round(((imagesDone + audioDone) / (totalScenes * 2)) * 100)
    : story.status === 'generating-script' ? 10 : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step.status === 'done'
                  ? 'bg-primary text-primary-foreground'
                  : step.status === 'active'
                  ? 'bg-primary/20 text-primary animate-pulse border border-primary'
                  : step.status === 'error'
                  ? 'bg-destructive/20 text-destructive border border-destructive'
                  : step.status === 'partial'
                  ? 'bg-warning/20 text-warning border border-warning'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.status === 'done' ? '✓' : step.status === 'error' ? '!' : i + 1}
            </div>
            <span className={`text-xs ${step.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {story.title !== 'Generating...' && (
        <p className="text-center text-sm text-foreground font-medium">
          "{story.title}"
        </p>
      )}
    </div>
  );
}
