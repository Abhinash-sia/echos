import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MemoryOrbScene } from '@/components/canvas/MemoryOrbScene';

describe('Phase 5A: Frontend Design Foundation & Tokens', () => {
  it('should declare all required editorial and cinematic tokens in tokens.css', () => {
    const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
    expect(fs.existsSync(tokensPath)).toBe(true);

    const content = fs.readFileSync(tokensPath, 'utf8');

    // Editorial Light Tokens
    expect(content).toContain('--bg-paper:');
    expect(content).toContain('--bg-paper-warm:');
    expect(content).toContain('--text-primary:');
    expect(content).toContain('--accent-terracotta:');
    expect(content).toContain('--accent-ochre:');
    expect(content).toContain('--font-condensed:');
    expect(content).toContain('--font-serif:');
    expect(content).toContain('--font-sans:');
    expect(content).toContain('--ease-editorial:');

    // Cinematic Dark Tokens
    expect(content).toContain('.dark');
    expect(content).toContain("data-theme='dark'");
    expect(content.toLowerCase()).toContain('--bg-paper: #0e0f12');
    expect(content.toLowerCase()).toMatch(/--text-primary:\s*(#f7f3ec|#f5efe6)/);

    // Playful Surrealism Core Color System Tokens
    expect(content.toLowerCase()).toContain('--color-electric-coral: #ff684d');
    expect(content.toLowerCase()).toContain('--color-tangerine: #ffb93f');
    expect(content.toLowerCase()).toContain('--color-dream-pink: #f3a9d5');
    expect(content.toLowerCase()).toContain('--color-cobalt: #4f66e8');
    expect(content.toLowerCase()).toContain('--color-acid-lime: #b7db50');
    expect(content.toLowerCase()).toContain('--color-vibrant-teal: #39bfae');
    expect(content.toLowerCase()).toContain('--color-midnight: #191a2b');
    expect(content.toLowerCase()).toContain('--color-warm-cream: #f7f3ec');
    expect(content.toLowerCase()).toContain('--color-solar-yellow: #f7d84b');
  });

  it('should configure Tailwind inline theme and film grain in globals.css', () => {
    const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const content = fs.readFileSync(globalsPath, 'utf8');

    expect(content).toContain("@import 'tailwindcss'");
    expect(content).toContain("@import '../styles/tokens.css'");
    expect(content).toContain('.film-grain');
    expect(content).toContain('prefers-reduced-motion');
  });

  it('should initialize MemoryOrbScene and handle motion modes and cleanup safely', () => {
    const scene = new MemoryOrbScene();
    expect(scene).toBeDefined();

    // Verify reduced motion toggling
    expect(() => scene.setReducedMotion(true)).not.toThrow();
    expect(() => scene.setReducedMotion(false)).not.toThrow();

    // Verify destroy does not throw even before init
    expect(() => scene.destroy()).not.toThrow();
  });

  it('should verify WebGL architecture, fallback, IntersectionObserver, and context loss handling in WebGLCanvas', () => {
    const canvasPath = path.resolve(process.cwd(), 'src/components/canvas/WebGLCanvas.tsx');
    expect(fs.existsSync(canvasPath)).toBe(true);

    const canvasContent = fs.readFileSync(canvasPath, 'utf8');

    // 1. IntersectionObserver pause/resume
    expect(canvasContent).toContain('new IntersectionObserver');
    expect(canvasContent).toContain('setIsIntersecting');
    expect(canvasContent).toContain('if (isIntersecting)');

    // 2. DPR Clamping
    expect(canvasContent).toContain('Math.min(window.devicePixelRatio || 1, 2)');

    // 3. Fallback on context creation / init failure
    expect(canvasContent).toContain("canvas.getContext('webgl2'");
    expect(canvasContent).toContain('setHasWebGL(false)');
    expect(canvasContent).toContain('fallbackTitle');

    // 4. Reduced-motion compliance
    expect(canvasContent).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(canvasContent).toContain('sceneRenderer.setReducedMotion');

    // 5. Context loss and restore listeners
    expect(canvasContent).toContain('webglcontextlost');
    expect(canvasContent).toContain('webglcontextrestored');

    // 6. Complete cleanup on unmount
    expect(canvasContent).toContain('cancelAnimationFrame(animationFrameId)');
    expect(canvasContent).toContain('observer.disconnect()');
    expect(canvasContent).toContain('sceneRenderer.destroy()');

    // 7. Strictly Native WebGL2 and GLSL - No Three.js imports
    expect(canvasContent).not.toContain('three');
    expect(canvasContent).not.toContain('@react-three');
  });

  it('should verify neutral archival metadata without copied reference coordinates', () => {
    const showcasePath = path.resolve(process.cwd(), 'src/app/showcase/page.tsx');
    const showcaseContent = fs.readFileSync(showcasePath, 'utf8');
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    // Verify hardcoded coordinates from reference posters are absent
    expect(showcaseContent).not.toContain('12.2267');
    expect(showcaseContent).not.toContain('79.0747');
    expect(showcaseContent).not.toContain('34.9949');
    expect(showcaseContent).not.toContain('135.7850');
    expect(homeContent).not.toContain('12.2267');
    expect(homeContent).not.toContain('34.9949');

    // Verify no physical place names copied from posters
    expect(showcaseContent).not.toContain('TIRUVANNAMALAI');
    expect(showcaseContent).not.toContain('Arunachala');

    // Verify neutral Echoes archival metadata is present
    expect(showcaseContent).toContain('TEMPORAL INDEX · ARCHIVE № 01');
    expect(showcaseContent).toContain('CHRONICLE PLATE · ARCHIVE № 08');
    expect(homeContent).toContain('VAULT INDEX № 01 · CHRONICLE OF TIME');
  });

  it('should verify production asset library, WebP conversion, AVIF formats, and transparent cutouts', () => {
    const imagesDir = path.resolve(process.cwd(), 'public/images');
    expect(fs.existsSync(imagesDir)).toBe(true);

    // Verify optimized WebP files exist and are non-empty
    const webpFiles = [
      'architecture/arch_sunlight_interior.webp',
      'landscapes/landscape_misty_mountain.webp',
      'landscapes/landscape_golden_lake.webp',
      'photography/photo_hands_letter.webp',
      'photography/photo_vintage_camera.webp',
      'objects/object_brass_capsule.webp',
      'backgrounds/bg_parchment_wash.webp',
      'cutouts/cutout_botanical_fern.webp',
      'cutouts/cutout_wax_seal.webp',
      'cutouts/cutout_postal_stamp.webp',
    ];

    for (const rel of webpFiles) {
      const fullPath = path.join(imagesDir, rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(1000);
    }

    // Verify AVIF files exist and are non-empty
    const avifFiles = [
      'architecture/arch_sunlight_interior.avif',
      'backgrounds/bg_parchment_wash.avif',
      'landscapes/landscape_golden_lake.avif',
    ];

    for (const rel of avifFiles) {
      const fullPath = path.join(imagesDir, rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(1000);
    }

    // Verify Transparent PNG cutouts exist
    const pngCutouts = [
      'cutouts/cutout_botanical_fern.png',
      'cutouts/cutout_wax_seal.png',
      'cutouts/cutout_postal_stamp.png',
    ];

    for (const rel of pngCutouts) {
      const fullPath = path.join(imagesDir, rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(1000);
    }

    // Verify vector SVGs exist
    const svgFiles = [
      'illustrations/illustration_celestial_sun.svg',
      'illustrations/illustration_archival_seal.svg',
      'decorative/decorative_postal_stripes.svg',
      'textures/texture_torn_edge.svg',
    ];

    for (const rel of svgFiles) {
      const fullPath = path.join(imagesDir, rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(100);
    }
  });
});
