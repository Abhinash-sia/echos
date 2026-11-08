'use client';

import React, { useMemo, useState } from 'react';
import { WebGLCanvas } from './WebGLCanvas';
import { MemoryOrbScene } from './MemoryOrbScene';
import { Button } from '../ui/Button';
import { SparklesIcon } from '../icons/Icons';

export interface MemoryOrbProps {
  className?: string;
}

export function MemoryOrb({ className = '' }: MemoryOrbProps) {
  const [simulateFallback, setSimulateFallback] = useState(false);
  const scene = useMemo(() => new MemoryOrbScene(), []);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[480px] rounded-sm border border-border-hairline shadow-elevated bg-paper-elevated overflow-hidden">
        <WebGLCanvas
          sceneRenderer={scene}
          className="w-full h-full"
          fallbackTitle="Celestial Memory Monument"
          forceFallback={simulateFallback}
        />

        {/* Ambient Overlay Badges */}
        <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xs bg-paper/80 backdrop-blur-sm border border-border-hairline text-ink font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <SparklesIcon size={12} className="text-terracotta" />
            <span>WebGL2 Ethereal Shader</span>
          </span>
        </div>

        <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-xs bg-paper/80 backdrop-blur-sm border border-border-hairline text-ink-muted font-mono text-[9px] uppercase tracking-wider">
            WebGL2 Render · Interactive Parallax Tilt
          </span>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex items-center justify-between px-1 text-xs text-ink-muted font-mono">
        <span>Interact: Move cursor or touch to tilt lighting</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSimulateFallback(!simulateFallback)}
          className="text-xs font-mono"
        >
          {simulateFallback ? 'Restore 3D Scene' : 'Test Graceful Fallback'}
        </Button>
      </div>
    </div>
  );
}
