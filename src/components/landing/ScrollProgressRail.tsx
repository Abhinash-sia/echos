'use client';

import React, { useEffect, useState } from 'react';

const FOLIO_CHAPTERS = [
  { id: 'hero', code: '01', label: 'Sanctuary' },
  { id: 'manifesto', code: '02', label: 'Manifesto' },
  { id: 'contact-sheet', code: '03', label: '35mm Sheet' },
  { id: 'archive', code: '04', label: 'Archive' },
  { id: 'chamber', code: '05', label: 'Chamber' },
  { id: 'chronology', code: '06', label: 'Chronology' },
  { id: 'showcase', code: '07', label: 'Application' },
];

/**
 * Editorial folio scroll progress rail anchored on wide viewports.
 */
export function ScrollProgressRail() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState('hero');

  useEffect(() => {
    const updateScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.max(0, Math.min(1, scrollY / maxScroll)));

      let current = 'hero';
      const threshold = window.innerHeight * 0.42;
      for (const chapter of FOLIO_CHAPTERS) {
        const el = document.getElementById(chapter.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            current = chapter.id;
          }
        }
      }
      setActiveId(current);
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  return (
    <aside
      aria-label="Folio scroll progress"
      className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3 pointer-events-auto select-none"
    >
      <div className="neu-card px-2.5 py-3.5 rounded-full flex flex-col items-center gap-2.5">
        <span className="font-mono text-[8px] uppercase tracking-widest text-[#767C9D] dark:text-[#C8BCAA]">
          EPOCH
        </span>
        <span className="font-mono text-[10px] font-bold tracking-wider text-[#FF684D]">
          {Math.round(2026 + progress * 14)}
        </span>

        {/* Track */}
        <div className="relative w-1 h-28 rounded-full neu-well overflow-hidden">
          <div
            className="w-full rounded-full transition-transform duration-75 origin-top"
            style={{
              height: '100%',
              transform: `scaleY(${Math.max(0.06, progress)})`,
              background:
                'linear-gradient(to bottom var(--in-oklab), #FF684D, #FFB93F, #39BFAE)',
            }}
          />
        </div>

        {/* Chapter Dots */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          {FOLIO_CHAPTERS.map((chapter) => {
            const isActive = activeId === chapter.id;
            return (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                title={`${chapter.code} · ${chapter.label}`}
                aria-label={`Jump to ${chapter.label}`}
                className="group relative flex items-center justify-center p-1"
              >
                <span
                  className={`block rounded-full transition-all duration-200 ${
                    isActive
                      ? 'w-2 h-2 bg-[#FF684D] shadow-[0_0_8px_rgba(255,104,77,0.65)]'
                      : 'w-1.5 h-1.5 bg-[#191A2B]/25 dark:bg-white/25 group-hover:bg-[#FF684D]/70'
                  }`}
                />
                <span className="pointer-events-none absolute right-6 px-2 py-0.5 rounded-sm bg-[#191A2B] text-[#F7F3EC] dark:bg-[#F7F3EC] dark:text-[#191A2B] font-mono text-[9px] uppercase tracking-wider whitespace-nowrap opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-md">
                  {chapter.code} · {chapter.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default ScrollProgressRail;

