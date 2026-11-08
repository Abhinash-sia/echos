# ECHOES — STAGE 9B VISUAL ASSET MANIFEST & PRODUCTION BLUEPRINT

## Asset Planning, Prioritized Production Schedule & Visual Briefs

---

### Executive Summary

In Stage 9A, the creative reinvention blueprint ([`docs/report/STAGE_9A_ART_DIRECTION.md`](file:///home/abhi/Projects/echos/docs/report/STAGE_9A_ART_DIRECTION.md)) established an 8-moment emotional journey combining **Playful Surrealism** and **Experimental Editorial** aesthetics.

Stage 9B operationalizes this art direction into an exact, production-ready **Visual Asset Manifest**. It categorizes every graphic, photographic, vector, and procedural asset required to assemble the landing page; identifies opportunities to reuse existing high-resolution assets; specifies which elements should be procedurally implemented in CSS/WebGL; and provides rigorous, individual production briefs for the highest-priority hero assets.

In accordance with Stage 9B directives, **no assets are generated or downloaded in this stage**. This document prepares the exact specifications, prompts, dimensions, and composition criteria so that asset production in Stage 9C proceeds with complete visual consistency and zero trial-and-error waste.

---

### 1. Comprehensive Asset Inventory & Manifest Matrix

The table below catalogs every visual asset required across all 8 narrative moments of the landing page:

| Asset ID    | Filename                         | Narrative Moment            | Visual Description & Subject Placement                                                                                                                                | Aspect Ratio & Target Resolution                | Target Format        | Alpha Channel             | Creation Method                                     | Mobile/Desktop Variants                              | Status                               |
| ----------- | -------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------- | ------------------------- | --------------------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| **HERO-01** | `hero_celestial_sanctuary.webp`  | Moment 1 (Hero)             | Archival sanctuary interior with raking morning sunlight, wooden drafting table, dust motes, and generous left negative space for editorial typography.               | 16:9 (1672×941 desktop), 4:5 (1080×1350 mobile) | WebP & AVIF          | No (Full Bleed)           | Photographic / Model Generation                     | Separate responsive crops (Desktop & Mobile)         | **Completed (282 KB & 112 KB)**      |
| **HERO-02** | `cutout_fountain_pen_nib.webp`   | Moment 1 (Hero)             | Vintage brass and dark lacquer fountain pen with gold-plated nib angled at 35°, suspended weightlessly, specular glint on nib.                                        | 1:1 (800×800)                                   | WebP & PNG           | **Yes (Clean Alpha)**     | Transparent Studio Cutout                           | Scaled via CSS (80px–180px)                          | **Completed (79 KB, RGBA)**          |
| **HERO-03** | `cutout_hourglass_dust.webp`     | Moment 1 (Hero)             | Hand-blown glass hourglass with aged brass end caps, golden glowing sand flowing weightlessly in zero gravity.                                                        | ~3:4 (610×800)                                  | WebP & PNG           | **Yes (Clean Alpha)**     | Transparent Studio Cutout                           | Scaled via CSS (90px–220px)                          | **Completed (143 KB, RGBA)**         |
| **HERO-04** | `illustration_celestial_sun.svg` | Moment 1 (Hero)             | Radiating celestial sun disk motif with concentric geometric aura in Solar Yellow (`#F7D84B`) and Electric Coral (`#FF684D`).                                         | Vector (512×512)                                | SVG                  | Yes (Vector)              | Vector Reused / Refined                             | Fluid SVG scaling                                    | **Ready (Reused)**                   |
| **HERO-05** | `canvas_ambient_dust`            | Moment 1 (Hero)             | Procedural shimmering archival dust particles drifting softly in Brownian motion, reacting to mouse pointer.                                                          | Viewport Fill                                   | Procedural Canvas 2D | Yes (Canvas Overlay)      | Procedural Canvas (0 KB asset)                      | Scaled automatically                                 | **Completed (Canvas 2D Component)**  |
| **MAN-01**  | `bg_parchment_wash.webp`         | Moment 2 (Manifesto)        | Subtle warm cream archival cotton rag paper wash texture with organic grain and fiber tooth.                                                                          | 16:9 (1920×1080)                                | WebP & AVIF          | No                        | **Reused Existing** (`public/images/backgrounds/`)  | Unified responsive asset                             | **Ready (Reused)**                   |
| **MAN-02**  | `texture_torn_edge.svg`          | Moment 2 (Manifesto)        | Organic torn deckle-edge paper divider separating light and dark sections.                                                                                            | 1200×32 (Repeat-X)                              | SVG                  | Yes (Vector)              | **Reused Existing** (`public/images/textures/`)     | Repeat-X on all viewports                            | **Ready (Reused)**                   |
| **MAN-03**  | `cutout_botanical_fern.webp`     | Moment 2 (Manifesto)        | Dried pressed botanical fern specimen (_Adiantum_), delicate leaf venation, archival herbarium mount.                                                                 | 1:1 (800×800)                                   | WebP & PNG           | **Yes (Clean Alpha)**     | **Reused Existing** (`public/images/cutouts/`)      | Scaled via CSS                                       | **Ready (Reused)**                   |
| **CS-01**   | `texture_film_sprockets.svg`     | Moment 3 (35mm Contact)     | Authentic 35mm negative film border overlay with rectangular sprocket perforations, frame codes `01A`, `02A`, `03A`, and `KODAK SAFETY FILM 400` markings.            | 16:9 Vector (1600×900)                          | SVG                  | Yes (Transparent cutouts) | Vector Generation                                   | Desktop full strip, mobile 2-frame strip             | **Completed (5.1 KB, Scalable SVG)** |
| **CS-02**   | `photo_vintage_camera.webp`      | Moment 3 (35mm Contact)     | Mechanical 35mm rangefinder camera with brass wear, optical glass reflection, and spare film canister on cedar table.                                                 | 4:3 (1200×900)                                  | WebP & AVIF          | No                        | **Reused Existing** (`public/images/photography/`)  | Responsive Next.js `<Image>`                         | **Ready (Reused)**                   |
| **CS-03**   | `photo_hands_letter.webp`        | Moment 3 (35mm Contact)     | Intimate close-up of hands writing a letter with fountain pen on deckle-edged paper, sepia ink drying.                                                                | 4:3 (1200×900)                                  | WebP & AVIF          | No                        | **Reused Existing** (`public/images/photography/`)  | Responsive Next.js `<Image>`                         | **Ready (Reused)**                   |
| **CS-04**   | `arch_sunlight_interior.webp`    | Moment 3 (35mm Contact)     | Architectural room with geometric cedar wood mullions casting raking morning sunlight across warm plaster.                                                            | 4:3 (1200×900)                                  | WebP & AVIF          | No                        | **Reused Existing** (`public/images/architecture/`) | Responsive Next.js `<Image>`                         | **Ready (Reused)**                   |
| **CS-05**   | `overlay_grease_pencil.svg`      | Moment 3 (35mm Contact)     | Hand-marked red archival grease-pencil cropping corners, circled frame numbers, and editor checkmarks.                                                                | Vector (800×600)                                | SVG                  | Yes (Vector)              | Vector Generation                                   | Overlay on top of film frames                        | **Completed (2.9 KB, Scalable SVG)** |
| **MEM-01**  | `ui_memory_card_interactive`     | Moment 4 (Memory Archive)   | Live interactive memory card component with tags `#solitude`, `#analog`, `#autumn-2026`, date badge, signed Cloudinary thumbnail, and flip-to-reflection interaction. | CSS/React Component                             | React / Tailwind     | DOM Element               | Procedural UI Component                             | Responsive grid/card                                 | **Pending Wave 3**                   |
| **MEM-02**  | `cutout_postal_stamp.webp`       | Moment 4 (Memory Archive)   | Vintage perforated airmail postal stamp with Cobalt Blue ink postmark and canceled wavy lines.                                                                        | 1:1 (400×400)                                   | WebP & PNG           | **Yes (Clean Alpha)**     | **Reused Existing** (`public/images/cutouts/`)      | Scaled via CSS                                       | **Ready (Reused)**                   |
| **CAP-01**  | `object_brass_capsule.webp`      | Moment 5 (Sealing Chamber)  | Cylindrical machined brass time capsule artifact with knurled mechanical lock rings, engraved graduation markings, and warm ambient highlight.                        | 4:3 (1200×900)                                  | WebP & AVIF          | No                        | **Reused Existing** (`public/images/objects/`)      | Focal image in chamber                               | **Ready (Reused)**                   |
| **CAP-02**  | `dial_temporal_astrolabe.svg`    | Moment 5 (Sealing Chamber)  | Multi-ring circular brass astrolabe dial with calibrated year markings (`2026`, `2027`, `2030`, `2035`, `2040`), gear teeth, and interactive rotation index.          | Vector (600×600)                                | SVG                  | Yes (Vector)              | Vector Graphic & CSS Rotation                       | Interactive dial on desktop, step selector on mobile | **Completed (16 KB, Scalable SVG)**  |
| **CAP-03**  | `cutout_wax_seal_hot.webp`       | Moment 5 (Sealing Chamber)  | Freshly stamped vermilion/coral wax seal with glossy molten rim puddle, fine crackle texture, and debossed Echoes hourglass monogram.                                 | 1:1 (800×800)                                   | WebP & PNG           | **Yes (Clean Alpha)**     | Transparent Studio Cutout                           | Scaled via CSS                                       | **Completed (135 KB, RGBA)**         |
| **TIM-01**  | `spine_chronology_connector.svg` | Moment 6 (Timeline Spine)   | Continuous serpentine connecting archival spine with dashed measurement ticks, glow filter, and node anchors.                                                         | Vector (400×1200)                               | SVG                  | Yes (Vector)              | Vector Procedural                                   | Vertical on mobile, serpentine on desktop            | **Completed (5.2 KB, Scalable SVG)** |
| **PRD-01**  | `product_memory_journal.webp`    | Moment 7 (Product Showcase) | High-resolution crisp screenshot of Echoes Memory Journal with photo grid, search bar, and active tags.                                                               | 16:10 (2400×1500 retina)                        | WebP & PNG           | No                        | Captured Genuine UI Asset                           | High-DPI responsive preview                          | **Completed (133 KB, WebP)**         |
| **PRD-02**  | `product_sealed_capsule.webp`    | Moment 7 (Product Showcase) | High-resolution crisp screenshot of Time Capsule locked view with live countdown timer and wax seal stamp.                                                            | 16:10 (2400×1500 retina)                        | WebP & PNG           | No                        | Captured Genuine UI Asset                           | High-DPI responsive preview                          | **Completed (75.4 KB, WebP)**        |
| **PRD-03**  | `product_timeline.webp`          | Moment 7 (Product Showcase) | High-resolution crisp screenshot of Unified Chronology stream with cursor pagination and type filters.                                                                | 16:10 (2400×1500 retina)                        | WebP & PNG           | No                        | Captured Genuine UI Asset                           | High-DPI responsive preview                          | **Completed (95.1 KB, WebP)**        |
| **EPI-01**  | `cutout_wax_seal_large.webp`     | Moment 8 (Epilogue)         | Large, high-resolution embossed wax seal emblem acting as the primary interactive tactile sign-up trigger.                                                            | 1:1 (800×800)                                   | WebP & PNG           | **Yes (Clean Alpha)**     | Transparent Studio Cutout                           | Centerpiece button on all screens                    | **Pending Wave 2**                   |

---

### 2. Prioritized Asset Production Schedule

To maintain absolute visual consistency and avoid generating mismatched styles, assets are partitioned into four phased delivery waves:

```
Production Waves:
Wave 1 (Tier 1 Hero & Interactive Centerpieces)
  ├── HERO-01 (Hero Master Photography)
  ├── HERO-02 (Cutout Fountain Pen Nib)
  ├── HERO-03 (Cutout Hourglass)
  ├── CAP-02 (Vector Astrolabe Dial)
  ├── CAP-03 (Cutout Molten Wax Seal)
  └── CS-01 (35mm Sprocket Border)
        │
Wave 2 (Tier 2 Vector Overlays & Textures)
  ├── CS-05 (Red Grease-Pencil Annotations)
  ├── TIM-01 (Timeline Connecting Spine)
  ├── HERO-05 (Canvas 2D Dust Particle Script)
  └── Refinements to HERO-04 (Celestial Sun SVG)
        │
Wave 3 (Product Screens & Frames)
  ├── PRD-01 (Memory Journal Screen)
  ├── PRD-02 (Sealed Capsule Screen)
  └── PRD-03 (Timeline Stream Screen)
        │
Wave 4 (Optimization & Multi-Format Encoding)
  ├── Lanczos downsampling to mobile breakpoints
  ├── WebP quality=85 & AVIF quality=78 compression
  └── Alpha channel edge matte decontamination (zero black/white fringes)
```

---

### 3. Detailed Production Briefs for Tier-1 Hero Assets

The following briefs provide the comprehensive aesthetic, technical, and compositional criteria for creating the Tier-1 hero assets.

---

#### PRODUCTION BRIEF: HERO-01 (`hero_celestial_sanctuary.webp`)

- **Asset ID**: `HERO-01`
- **Role**: Primary cinematic background plate for Moment 1 (Hero Masthead).
- **Subject Matter**: An atmospheric, tranquil archival sanctuary study. A solid cedar drafting desk in the right-center foreground with open cotton rag journal books, vintage optical glass lenses, and soft shadow fall-off. On the left two-thirds, generous negative space across a warm plaster wall bathed in raking morning dawn sunlight.
- **Atmosphere & Mood**: Contemplative, nostalgic, serene, tactile. Golden hour dawn light (warm amber `#FFB93F` and cream `#F7F3EC`) cutting through geometric wooden window frames with soft haze and illuminated atmospheric dust motes.
- **Composition & Layout**:
  - **Left 60%**: Intentionally restrained, uncluttered, soft gradient light on textured wall. Designed specifically to host the large display typography ("Where moments rest, until their hour arrives.") without visual fighting or contrast loss.
  - **Right 40%**: Rich textural detail with the wooden desk, architectural lines, and depth.
  - **Color Palette Alignment**: Foundation in Warm Cream (`#F7F3EC`), deep shadow accents in Midnight (`#191A2B`), and warm sunlight in Tangerine (`#FFB93F`) and Solar Yellow (`#F7D84B`).
- **Technical Specifications**:
  - Dimensions: 3840×2160 source (downsampled to 1920×1080 for desktop WebP/AVIF, and cropped to 1080×1350 for mobile).
  - Format: Master PNG -> Compressed WebP (quality 85) & AVIF (quality 78).
  - Target file size: <= 180 KB (WebP), <= 130 KB (AVIF).

---

#### PRODUCTION BRIEF: HERO-02 (`cutout_fountain_pen_nib.webp`)

- **Asset ID**: `HERO-02`
- **Role**: Floating surrealist cutout hovering in the hero masthead parallax plane.
- **Subject Matter**: Close-up studio shot of a classic fountain pen with a precision-engraved 14k gold and rhodium-plated nib, dark obsidian/ebonite barrel, and gold filigree clip.
- **Angle & Perspective**: Angled dynamically at approximately 35° diagonally, pointing downward-left as if suspended mid-sentence while writing on air.
- **Lighting & Materiality**: Crisp directional studio rim lighting emphasizing the metallic gleam of the split gold tines and the polished barrel. A tiny glint of reflected cyan/teal light on the nib breather hole.
- **Transparency & Alpha Quality**:
  - Must be shot or rendered against a pure `#FFFFFF` or alpha background.
  - Clean alpha extraction with 0% halo or fringe artifacts around the gold nib tines and clip.
  - 8-bit alpha channel with smooth edge anti-aliasing.
- **Technical Specifications**:
  - Dimensions: 1200×1200 source (downsampled to 800×800).
  - Format: Transparent RGBA PNG & WebP (lossless alpha).
  - Target file size: <= 75 KB (WebP).

---

#### PRODUCTION BRIEF: HERO-03 (`cutout_hourglass_dust.webp`)

- **Asset ID**: `HERO-03`
- **Role**: Surrealist floating temporal artifact in the hero masthead.
- **Subject Matter**: A hand-blown hourglass with dual glass globes joined by a narrow waist. Encased in minimalist antique brass pillars and circular end plates with fine knurled bevels. Inside, glowing golden sand motes are captured floating in zero gravity rather than falling, symbolizing suspended time.
- **Lighting**: Soft backlighting illuminating the translucent glass curvatures and internal reflections. Warm highlights in Solar Yellow (`#F7D84B`) with soft shadows.
- **Transparency & Alpha Quality**:
  - Semi-translucent glass bulb surfaces must preserve subtle opacity (30%–60% alpha) to allow the warm background of the page to show through realistically.
  - Opaque brass caps and sand particles.
- **Technical Specifications**:
  - Dimensions: 1200×1200 source (downsampled to 800×800).
  - Format: Transparent RGBA PNG & WebP.
  - Target file size: <= 85 KB (WebP).

---

#### PRODUCTION BRIEF: CAP-02 (`dial_temporal_astrolabe.svg`)

- **Asset ID**: `CAP-02`
- **Role**: Interactive mechanical dial centerpiece for Moment 5 (The Time Capsule Sealing Chamber).
- **Design & Construction**:
  - Pure SVG vector graphic consisting of concentric rings inspired by antique maritime astrolabes and German astronomical clocks.
  - **Outer Ring**: Outer knurled gear teeth with radial tick marks at 5-degree increments.
  - **Middle Ring**: Calibrated date milestone indicators: `NOW (2026)`, `+1 YR (2027)`, `+3 YRS (2029)`, `+5 YRS (2031)`, `+10 YRS (2036)`, `VAULT 2040`.
  - **Inner Ring**: Roman numeral constellation markers with fine geometric engravings.
  - **Center Hub**: An embossed brass pivot cap with a subtle radial gradient.
- **Styling & Color**:
  - Midnight background context: Dial lines rendered in Acid Lime (`#B7DB50`), Electric Coral (`#FF684D`), and polished brass tones (`#FFB93F`).
  - Subtle drop shadow filter for Neumorphic depth on the dark canvas.
- **Technical Specifications**:
  - Dimensions: 600×600 viewBox (`0 0 600 600`).
  - Format: Optimized clean SVG with organized `<g id="outer-gear">`, `<g id="year-ticks">`, `<g id="indicator-needle">` groups for independent CSS/JS rotation.
  - Target file size: <= 18 KB.

---

#### PRODUCTION BRIEF: CAP-03 (`cutout_wax_seal_hot.webp`)

- **Asset ID**: `CAP-03`
- **Role**: Visual climax of the Time Capsule Sealing demonstration.
- **Subject Matter**: A freshly stamped wax seal in vivid Electric Coral (`#FF684D`) with an irregular, organic molten rim. The central disc is deeply stamped with the stylized Echoes hourglass insignia.
- **Texture**: Glossy, slightly translucent paraffin-carnauba wax with microscopic air bubbles, micro-cracks along the stamped perimeter, and soft specular light reflections.
- **Transparency**: Clean transparent background with soft, natural contact shadow included in the alpha channel for instant drag-and-drop realistic placement.
- **Technical Specifications**:
  - Dimensions: 1000×1000 source (downsampled to 800×800).
  - Format: Transparent RGBA PNG & WebP.
  - Target file size: <= 65 KB (WebP).

---

#### PRODUCTION BRIEF: CS-01 (`texture_film_sprockets.svg`)

- **Asset ID**: `CS-01`
- **Role**: 35mm contact sheet overlay frame for Moment 3.
- **Design & Construction**:
  - Horizontal negative film strip banner with authentic rectangular sprocket perforations along both top and bottom margins.
  - Frame divider lines with vintage edge text printed in glowing amber monospace: `KODAK SAFETY FILM 400`, `FRAME 01A`, `FRAME 02A`, `FRAME 03A`, `FRAME 04A`, ISO indicator, and frame counter dots.
  - Center frames feature completely transparent viewports allowing underlying photographic assets (`CS-02`, `CS-03`, `CS-04`) to display cleanly underneath the film mask.
- **Technical Specifications**:
  - Dimensions: 1600×900 viewBox.
  - Format: Clean SVG with transparent frame windows.
  - Target file size: <= 12 KB.

---

### 4. Existing Asset Reuse Strategy

To avoid redundant asset creation and preserve loading performance, the following high-quality assets already optimized in `public/images/` are explicitly integrated into the design:

| Existing File Path                                       | Assigned Landing Page Role                     | Reused Without Modification?                                                |
| -------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `public/images/objects/object_brass_capsule.webp`        | Moment 5 (Sealing Chamber Focal Artifact)      | **Yes** — Exceptional quality brushed brass cylinder with mechanical dials. |
| `public/images/photography/photo_hands_letter.webp`      | Moment 3 (35mm Contact Sheet Frame 02)         | **Yes** — Authentic fountain pen writing on deckle paper.                   |
| `public/images/photography/photo_vintage_camera.webp`    | Moment 3 (35mm Contact Sheet Frame 01)         | **Yes** — Mechanical camera with 35mm film rolls.                           |
| `public/images/architecture/arch_sunlight_interior.webp` | Moment 3 (35mm Contact Sheet Frame 03)         | **Yes** — Morning raking shadows through wooden frame.                      |
| `public/images/landscapes/landscape_golden_lake.webp`    | Moment 6 (Chronology Atmospheric Backdrop)     | **Yes** — Still dusk water reflection.                                      |
| `public/images/cutouts/cutout_botanical_fern.webp`       | Moment 2 (Manifesto Archival Herbarium Cutout) | **Yes** — Flawless transparent pressed fern.                                |
| `public/images/cutouts/cutout_postal_stamp.webp`         | Moment 4 (Memory Journal Stamp Accent)         | **Yes** — Perforated airmail stamp.                                         |
| `public/images/textures/texture_torn_edge.svg`           | Section Transitions (Deckle Paper Divider)     | **Yes** — Repeatable torn rag paper edge.                                   |
| `public/images/backgrounds/bg_parchment_wash.webp`       | Global Subtle Paper Texture Wash               | **Yes** — Fiber tooth background layer.                                     |

---

### 5. Technical Validation & Performance Budget

```
Asset Weight & Delivery Budget:
┌──────────────────────────────┬──────────────────┬─────────────────┐
│ Section / Moment             │ Asset Target Max │ Formats Used    │
├──────────────────────────────┼──────────────────┼─────────────────┤
│ Hero (Moment 1)              │ < 300 KB total   │ WebP/AVIF + SVG │
│ Manifesto & Quote (Moment 2) │ < 60 KB total    │ WebP + SVG      │
│ 35mm Contact Sheet (Moment 3)│ < 240 KB total   │ WebP + SVG      │
│ Memory Demo (Moment 4)       │ < 80 KB total    │ CSS DOM + WebP  │
│ Sealing Chamber (Moment 5)   │ < 180 KB total   │ WebP + SVG      │
│ Timeline Spine (Moment 6)    │ < 40 KB total    │ SVG             │
│ Product Showcase (Moment 7)  │ < 220 KB total   │ WebP            │
│ Epilogue (Moment 8)          │ < 60 KB total    │ WebP + SVG      │
├──────────────────────────────┼──────────────────┼─────────────────┤
│ **Total Page Weight**        │ **< 1.18 MB**    │ (LCP < 1.4s)    │
└──────────────────────────────┴──────────────────┴─────────────────┘
```

1. **Responsive Image Delivery**:
   - Every photograph will be rendered via Next.js `<Image>` with explicit `sizes` parameters and `priority` on `HERO-01`.
2. **Zero-Halo Alpha Quality**:
   - All transparent cutouts must pass edge inspection at 400% zoom against both light (`#F7F3EC`) and dark (`#191A2B`) backgrounds to prevent white/black matting fringes.
3. **Reduced-Motion Integration**:
   - Vector assets like `CAP-02` (Astrolabe Dial) and `TIM-01` (Spine) are designed with clean static resting states that look visually complete and balanced when rotational and translation animations are disabled.

---

### 6. Deliverable Sign-Off & Next Steps

Stage 9B planning is complete.

- **Manifest Authored**: [`docs/report/STAGE_9B_ASSET_MANIFEST.md`](file:///home/abhi/Projects/echos/docs/report/STAGE_9B_ASSET_MANIFEST.md)
- **Production Schedule Established**: 4 organized waves prioritizing Tier-1 hero centerpieces.
- **Individual Production Briefs Prepared**: Explicit instructions for `HERO-01`, `HERO-02`, `HERO-03`, `CAP-02`, `CAP-03`, and `CS-01`.

_In accordance with instructions, asset generation and page implementation are paused. Standing by for your approval of the Asset Manifest and Production Briefs before beginning production._
