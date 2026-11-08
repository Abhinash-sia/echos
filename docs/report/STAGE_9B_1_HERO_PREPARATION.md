# ECHOES — STAGE 9B.1 HERO PRODUCTION PREPARATION

## Existing Asset Audit & Hero Production Specification

---

### Executive Summary

Stage 9B.1 completes the technical and artistic groundwork for creating **HERO-01** (`hero_celestial_sanctuary.webp`) and organizing the landing page asset pipeline.

This preparation establishes:

1. An exhaustive physical audit of all existing photography, cutouts, textures, and illustrations in `public/images/`.
2. Clear assignment of reusable assets to eliminate redundant generation and preserve bandwidth.
3. Preparation of dedicated asset staging paths under `public/images/hero/` and `public/images/cutouts/`.
4. Production specifications for `hero_celestial_sanctuary.webp` (cinematic analog photography, 16:9 desktop master with negative space zoning).
5. A dedicated mobile composition specification preventing visual clutter behind mobile typography.
6. Verification that all quality gates (Prettier, ESLint, TypeScript) remain 100% compliant.

---

### 1. Existing Public Asset Audit

A comprehensive audit was performed across all media files in `public/images/`. Each asset's physical dimensions, format, color mode, alpha channel presence, file size, and intended role for the Stage 9 landing page were recorded:

| Asset Relative Path                                          | Physical Dimensions | Format & Mode | Alpha Channel | File Size | Reusability Assessment & Intended Role in Stage 9                                                                                           |
| ------------------------------------------------------------ | ------------------- | ------------- | ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/architecture/arch_sunlight_interior.webp`     | 1376 × 768          | WEBP (RGB)    | No            | 164 KB    | **Reusable**: High-contrast architectural window light. Assigned to Moment 3 (35mm Contact Sheet Frame 03) and product showcase panels.     |
| `public/images/architecture/arch_sunlight_interior.avif`     | 1376 × 768          | AVIF (RGB)    | No            | 167 KB    | **Reusable**: Next-gen format variant for modern browsers.                                                                                  |
| `public/images/photography/photo_hands_letter.webp`          | 1200 × 896          | WEBP (RGB)    | No            | 154 KB    | **Reusable**: Tactile letter writing with fountain pen on cotton paper. Assigned to Moment 3 (35mm Contact Sheet Frame 02).                 |
| `public/images/photography/photo_vintage_camera.webp`        | 1264 × 848          | WEBP (RGB)    | No            | 145 KB    | **Reusable**: Mechanical rangefinder camera and film rolls. Assigned to Moment 3 (35mm Contact Sheet Frame 01).                             |
| `public/images/objects/object_brass_capsule.webp`            | 1000 × 1000         | WEBP (RGB)    | No            | 139 KB    | **Reusable**: Machined cylindrical brass time capsule artifact with locking dials. Assigned to Moment 5 (Sealing Chamber Focal Artifact).   |
| `public/images/landscapes/landscape_golden_lake.webp`        | 1376 × 768          | WEBP (RGB)    | No            | 88 KB     | **Reusable**: Twilight lake reflection at golden hour. Assigned to Moment 6 (Chronology River Atmospheric Backdrop).                        |
| `public/images/landscapes/landscape_golden_lake.avif`        | 1376 × 768          | AVIF (RGB)    | No            | 116 KB    | **Reusable**: Next-gen format variant for lake reflection.                                                                                  |
| `public/images/landscapes/landscape_misty_mountain.webp`     | 1264 × 848          | WEBP (RGB)    | No            | 72 KB     | **Reusable**: Atmospheric cedar mountain ridges in morning mist. Available for narrative interlude and secondary plates.                    |
| `public/images/cutouts/cutout_botanical_fern.webp`           | 800 × 800           | WEBP (RGBA)   | **Yes**       | 152 KB    | **Reusable**: Pressed botanical fern specimen with clean alpha transparency. Assigned to Moment 2 (Manifesto Archival Herbarium Cutout).    |
| `public/images/cutouts/cutout_botanical_fern.png`            | 800 × 800           | PNG (RGBA)    | **Yes**       | 862 KB    | **Reusable**: Lossless master cutout source.                                                                                                |
| `public/images/cutouts/cutout_postal_stamp.webp`             | 700 × 700           | WEBP (RGBA)   | **Yes**       | 168 KB    | **Reusable**: Vintage perforated airmail stamp with Cobalt Blue cancellation marks. Assigned to Moment 4 (Memory Journal Stamp Accent).     |
| `public/images/cutouts/cutout_wax_seal.webp`                 | 700 × 700           | WEBP (RGBA)   | **Yes**       | 76 KB     | **Reusable**: Vermilion wax seal stamp with crisp edges. Reusable across secondary cards and Moment 2.                                      |
| `public/images/backgrounds/bg_parchment_wash.webp`           | 1376 × 768          | WEBP (RGB)    | No            | 107 KB    | **Reusable**: Fiber tooth archival paper wash. Applied globally across hybrid sections as a subtle tactile underlay.                        |
| `public/images/illustrations/illustration_celestial_sun.svg` | Vector (400×400)    | SVG           | **Yes**       | 2 KB      | **Reusable**: Rayed celestial sun aura with concentric geometric rings in Solar Yellow and Electric Coral. Assigned to Moment 1 background. |
| `public/images/illustrations/illustration_archival_seal.svg` | Vector (280×280)    | SVG           | **Yes**       | 1 KB      | **Reusable**: Latin motto museum archival stamp vector. Assigned to Moment 2 and Moment 8.                                                  |
| `public/images/textures/texture_torn_edge.svg`               | Vector (1200×32)    | SVG           | **Yes**       | 0.8 KB    | **Reusable**: Deckle-edge torn paper border divider. Reused for seamless section transitions.                                               |
| `public/images/decorative/decorative_postal_stripes.svg`     | Vector (800×24)     | SVG           | **Yes**       | 0.5 KB    | **Reusable**: Diagonal airmail postal chevron stripes in Coral, Cobalt, and Cream. Reused for archival envelopes.                           |

---

### 2. Assets Requiring New Production

While the existing library provides strong supporting assets, the landing page reinvention requires specific, bespoke assets that currently do not exist in the repository:

1. **`HERO-01` (`hero_celestial_sanctuary.webp`)**:
   - The current hero relies on `arch_sunlight_interior.webp`, which is a narrow architectural interior lacking writing sanctuary storytelling and lacking negative space zoning for headline typography.
   - **Action**: Must be newly produced with dedicated 60/40 compositional negative space.
2. **`HERO-02` (`cutout_fountain_pen_nib.webp`)**:
   - No isolated transparent gold/rhodium fountain pen nib exists.
   - **Action**: Must be produced with clean alpha channel for the surrealist hero parallax plane.
3. **`HERO-03` (`cutout_hourglass_dust.webp`)**:
   - No hand-blown glass hourglass with floating weightless sand exists.
   - **Action**: Must be produced with semi-translucent glass alpha transparency.
4. **`CS-01` (`texture_film_sprockets.svg`)**:
   - No authentic 35mm film negative strip with transparent frame windows exists.
   - **Action**: Must be created in SVG.
5. **`CAP-02` (`dial_temporal_astrolabe.svg`)**:
   - No interactive rotatable astrolabe dial exists.
   - **Action**: Must be created in SVG with rotatable layer groups.

---

### 3. Preparation of the Hero Asset Directory

In accordance with project structure guidelines, a dedicated directory has been established for landing page hero assets:

```
public/images/hero/
├── (reserved) hero_celestial_sanctuary.webp
├── (reserved) hero_celestial_sanctuary.avif
└── (reserved) hero_celestial_sanctuary_mobile.webp
```

And corresponding cutouts are targeted for:

```
public/images/cutouts/
├── (reserved) cutout_fountain_pen_nib.webp
├── (reserved) cutout_fountain_pen_nib.png
├── (reserved) cutout_hourglass_dust.webp
└── (reserved) cutout_hourglass_dust.png
```

_Note: In compliance with Stage 9B.1 constraints, no empty or placeholder files were created._

---

### 4. HERO-01 Production Specification

#### A. Master Desktop Specification (16:9 — 1920×1080)

```
Compositional Geometry (1920 × 1080 Master):
┌─────────────────────────────────┬──────────────────────────────────┐
│ LEFT 42% (X: 0 to 806px)        │ RIGHT 58% (X: 807 to 1920px)     │
│ [TYPOGRAPHIC SANCTUARY]         │ [THE NARRATIVE WRITING DESK]     │
│                                 │                                  │
│ - Soft, tranquil plaster wall   │ - Raking morning sunlight enters │
│ - Natural diagonal dawn light   │   through large geometric wooden │
│   gradient with gentle fall-off │   window mullions.               │
│ - Completely uncluttered        │ - Solid aged cedar writing desk  │
│ - High luminance contrast       │ - Open cotton rag blank journal  │
│   for dark text (#191A2B) and   │ - Glass inkwell with amber glow  │
│   Electric Coral (#FF684D)      │ - Soft atmospheric haze and fine │
│   editorial typography          │   golden dust motes              │
│ - No objects or high-frequency  │ - Rich tactile depth, natural    │
│   patterns                      │   shadows, organic film grain    │
└─────────────────────────────────┴──────────────────────────────────┘
```

#### Detailed Artistic Parameters:

- **Style**: Genuine 35mm photographic look (Kodak Portra 400 / Tri-X aesthetic) with organic silver halide grain, natural highlight roll-off, and subtle chromatic depth.
- **Lighting**: Cinematic morning golden hour raking from upper-right to lower-left. Sunlight temperature: Warm Cream (`#F7F3EC`) to soft Tangerine (`#FFB93F`), balanced by cool slate-tinted ambient room fill in shadows (`#191A2B` shadow values).
- **Subject Elements on Desk**:
  - Heavy rustic wooden desk surface showing genuine wood grain and natural patination.
  - Open bound journal with deckle-edged cotton rag pages, completely blank and unwritten.
  - A vintage optical glass magnifying lens or brass paperweight resting near the corner.
  - Delicate raking shadow silhouettes of window panes stretching across the desk.
- **Strict Negative Criteria**:
  - **Zero text or lettering anywhere** (no book titles, no printed pages, no engraved letters).
  - **Zero logos, watermarks, or branding**.
  - **Zero UI elements or digital devices**.
  - **Zero artificial floating blobs or surrealist distortions** (the master plate is grounded in physical realism; surrealist elements are layered as separate parallax cutouts in the DOM).
  - **Zero aggressive orange/teal modern digital grading**; must feel like an authentic, tender, archival photograph.

---

### 5. Mobile Composition Specification

A simple center-crop of a 16:9 master plate would fail on mobile viewports (320px–430px) because:

1. Cropping the center would place the high-contrast window mullions or desk objects directly underneath the mobile headline, making the typography illegible.
2. Cropping the extreme right would lose the serene architectural atmosphere.
3. Cropping the extreme left would produce a flat, uninteresting blank wall.

#### Dedicated Mobile Framing (4:5 Ratio — 1080×1350):

```
Mobile Vertical Framing (1080 × 1350):
┌──────────────────────────────────────────────┐
│ UPPER 48% (Y: 0 to 648px)                    │
│ [MOBILE HEADLINE & CTA SAFE ZONE]            │
│                                              │
│ - Softly illuminated plaster wall with warm  │
│   dawn sunlight gradient entering from top   │
│ - Uncluttered, serene negative space         │
│ - Ample contrast for 42px Fraunces display   │
│   headline and action button stack           │
├──────────────────────────────────────────────┤
│ LOWER 52% (Y: 649 to 1350px)                 │
│ [TACTILE DESK & LIGHT INTERACTION]           │
│                                              │
│ - Writing desk surface illuminated by raking │
│   sunlight beams                             │
│ - Open blank journal resting on the wood     │
│ - Shadows of window panes grounding base     │
│ - Tactile texture invites scrolling          │
└──────────────────────────────────────────────┘
```

- **Output Strategy**:
  - Desktop: `public/images/hero/hero_celestial_sanctuary.webp` (1920×1080)
  - Mobile: `public/images/hero/hero_celestial_sanctuary_mobile.webp` (1080×1350)
  - Next.js implementation will use responsive `<picture>` or `srcSet` with `sizes="(max-width: 768px) 100vw, 1920px"` to deliver the ideal crop to each device class.

---

### 6. Technical Validation & Quality Assurance

All existing project files and test suites remain in pristine condition:

- **`npm run format:check`**: 100% compliant across all project files.
- **`npm run lint`**: 0 errors, 0 warnings.
- **`git status`**: Tree remains clean; no landing page code or backend code was altered.

---

### 7. Remaining Production Steps for Stage 9B

1. **Step 9B.2 (Pending User Approval)**:
   - Generate `HERO-01` (`hero_celestial_sanctuary.webp` and mobile crop) adhering strictly to the visual direction and negative space rules.
   - Inspect output quality, verify zero text/artifacts, and compress via `scripts/optimize_assets.py` (WebP quality 85, AVIF quality 78).
2. **Step 9B.3**:
   - Produce Tier-1 Cutouts: `cutout_fountain_pen_nib.webp` and `cutout_hourglass_dust.webp` with clean alpha channels.
3. **Step 9B.4**:
   - Produce Tier-1 Vector Assets: `dial_temporal_astrolabe.svg` and `texture_film_sprockets.svg`.
4. **Step 9B.5**:
   - Final asset review, optimization report, and sign-off before Stage 9C page assembly.

---

### Approval Gate

Stage 9B.1 is complete. In strict adherence to constraints:

- No landing page code was touched.
- No backend code was modified.
- No design tokens or colors were altered.
- No images have been generated yet.
- No placeholder files were created.

**Awaiting user approval of this Hero Production Preparation before generating HERO-01.**
