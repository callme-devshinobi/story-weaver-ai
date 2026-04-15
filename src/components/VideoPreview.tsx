import { useState, useRef, useCallback, useEffect } from 'react';
import { Story } from '@/types/story';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface VideoPreviewProps {
  story: Story;
}

export function VideoPreview({ story }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const readyScenes = story.scenes.filter(
    (s) => s.imageStatus === 'done' && s.imageUrl
  );

  const totalDuration = readyScenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  // Preload images
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const map = new Map<string, HTMLImageElement>();
    readyScenes.forEach((scene) => {
      if (scene.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = scene.imageUrl;
        img.onload = () => {
          map.set(scene.id, img);
          setLoadedImages(new Map(map));
        };
      }
    });
  }, [story.scenes]);

  const getSceneAtTime = useCallback(
    (time: number) => {
      let elapsed = 0;
      for (let i = 0; i < readyScenes.length; i++) {
        if (time < elapsed + readyScenes[i].durationSeconds) {
          return { index: i, localTime: time - elapsed, duration: readyScenes[i].durationSeconds };
        }
        elapsed += readyScenes[i].durationSeconds;
      }
      return { index: readyScenes.length - 1, localTime: 0, duration: readyScenes[readyScenes.length - 1]?.durationSeconds || 10 };
    },
    [readyScenes]
  );

  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { index, localTime, duration } = getSceneAtTime(time);
      const scene = readyScenes[index];
      if (!scene) return;

      const img = loadedImages.get(scene.id);
      if (!img) {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Ken Burns effect
      const progress = localTime / duration;
      const scale = 1 + 0.15 * progress; // zoom from 1x to 1.15x
      const panX = -20 * progress;
      const panY = -10 * progress;

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2 + panX, -canvas.height / 2 + panY);

      // Draw image covering canvas
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = canvas.height;
        drawW = canvas.height * imgRatio;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvas.width;
        drawH = canvas.width / imgRatio;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Scene transition fade
      if (localTime < 0.5) {
        ctx.fillStyle = `rgba(13, 17, 23, ${1 - localTime * 2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (localTime > duration - 0.5) {
        const fadeOut = (localTime - (duration - 0.5)) * 2;
        ctx.fillStyle = `rgba(13, 17, 23, ${fadeOut})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      setCurrentSceneIndex(index);
    },
    [readyScenes, loadedImages, getSceneAtTime]
  );

  const playAudioForScene = useCallback(
    (index: number) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const scene = readyScenes[index];
      if (scene?.audioUrl && scene.audioStatus === 'done') {
        const audio = new Audio(scene.audioUrl);
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
    },
    [readyScenes]
  );

  const play = useCallback(() => {
    setIsPlaying(true);
    startTimeRef.current = performance.now();
    let lastSceneIndex = -1;

    const animate = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
        return;
      }

      drawFrame(elapsed);

      const { index } = getSceneAtTime(elapsed);
      if (index !== lastSceneIndex) {
        lastSceneIndex = index;
        playAudioForScene(index);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [drawFrame, getSceneAtTime, playAudioForScene, totalDuration]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animationRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const exportVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(0);
    chunksRef.current = [];

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000,
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    };

    mediaRecorder.start(100);

    // Render all frames
    const startTime = performance.now();
    let lastSceneIndex = -1;

    const renderExport = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        mediaRecorder.stop();
        return;
      }

      setExportProgress(Math.round((elapsed / totalDuration) * 100));
      drawFrame(elapsed);

      const { index } = getSceneAtTime(elapsed);
      if (index !== lastSceneIndex) {
        lastSceneIndex = index;
      }

      animationRef.current = requestAnimationFrame(renderExport);
    };

    animationRef.current = requestAnimationFrame(renderExport);
  }, [drawFrame, getSceneAtTime, totalDuration, story.title]);

  if (readyScenes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        Waiting for scene images...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full"
          style={{ aspectRatio: '16/9' }}
        />

        {/* Scene indicator */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {readyScenes.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === currentSceneIndex ? 'w-6 bg-primary' : 'w-2 bg-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={isPlaying ? stop : play}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPlaying ? '⏹ Stop' : '▶ Play Preview'}
        </Button>
        <Button
          onClick={exportVideo}
          disabled={isExporting || isPlaying}
          variant="outline"
          className="flex-1 border-primary text-primary hover:bg-primary/10"
        >
          {isExporting ? `Exporting ${exportProgress}%...` : '⬇ Export Video'}
        </Button>
      </div>
    </div>
  );
}
