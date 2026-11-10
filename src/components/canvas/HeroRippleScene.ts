import { ScenePointer, SceneRenderer } from './types';

const MAX_RIPPLES = 10;

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform float uTextureReady;
uniform vec2 uResolution;
uniform float uImageAspect;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScrollVelocity;
uniform float uReducedMotion;
uniform float uIsDark;
uniform vec4 uRipples[${MAX_RIPPLES}]; // xy = uv origin, z = startTime, w = strength

varying vec2 vUv;

void main() {
  // Flip Y for HTML image texture orientation
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);

  // Compute CSS object-cover UV mapping
  float canvasAspect = max(0.001, uResolution.x / max(1.0, uResolution.y));
  vec2 coverUv = screenUv;
  if (canvasAspect > uImageAspect) {
    float scale = uImageAspect / canvasAspect;
    coverUv.y = (screenUv.y - 0.5) * scale + 0.5;
  } else {
    float scale = canvasAspect / uImageAspect;
    coverUv.x = (screenUv.x - 0.5) * scale + 0.5;
  }

  vec2 totalDisplacement = vec2(0.0);
  float waveHighlight = 0.0;

  if (uReducedMotion < 0.5) {
    // Gentle ambient horizon drift + scroll momentum sway
    float ambient = sin(coverUv.y * 10.0 + uTime * 0.85) * 0.0012;
    totalDisplacement.x += ambient;
    totalDisplacement.y += cos(coverUv.x * 8.0 + uTime * 0.7) * 0.001 + clamp(uScrollVelocity, -1.5, 1.5) * 0.0035;

    // Interactive concentric water/light ripples from pointer + click + scroll
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 rip = uRipples[i];
      if (rip.w > 0.001) {
        float age = uTime - rip.z;
        if (age >= 0.0 && age < 2.6) {
          vec2 delta = screenUv - rip.xy;
          delta.x *= canvasAspect;
          float dist = length(delta);

          float radius = age * 0.42;
          float band = dist - radius;
          float envelope = exp(-abs(band) * 14.0) * exp(-age * 1.15) * rip.w;
          float crest = sin(band * 44.0) * envelope;

          vec2 dir = dist > 0.0001 ? normalize(delta) : vec2(0.0);
          totalDisplacement += dir * crest * 0.018;
          waveHighlight += max(0.0, crest) * 0.35;
        }
      }
    }
  }

  vec2 displacedUv = clamp(coverUv + totalDisplacement, vec2(0.002), vec2(0.998));

  // Subtle chromatic dispersion along ripple crests
  vec2 chromaShift = totalDisplacement * 0.45;
  vec3 texColor;
  if (uTextureReady > 0.5) {
    float r = texture2D(uTexture, clamp(displacedUv + chromaShift, 0.002, 0.998)).r;
    float g = texture2D(uTexture, displacedUv).g;
    float b = texture2D(uTexture, clamp(displacedUv - chromaShift, 0.002, 0.998)).b;
    texColor = vec3(r, g, b);
  } else {
    texColor = uIsDark > 0.5 ? vec3(0.05, 0.055, 0.09) : vec3(0.93, 0.90, 0.82);
  }

  // Editorial halftone dot modulation over ripple highlights & atmosphere
  vec2 dotCell = fract(gl_FragCoord.xy / 10.0) - 0.5;
  float dotMask = smoothstep(0.32, 0.14, length(dotCell));
  float luma = dot(texColor, vec3(0.299, 0.587, 0.114));
  vec3 warmTint = uIsDark > 0.5 ? vec3(0.95, 0.62, 0.28) : vec3(0.84, 0.54, 0.18);

  // Brighten ripple crests with warm nostalgic sunlight
  texColor += warmTint * waveHighlight * (0.45 + 0.35 * dotMask);
  texColor = mix(texColor, texColor * (0.94 + 0.08 * luma), dotMask * 0.25);

  gl_FragColor = vec4(texColor, uTextureReady);
}
`;

export class HeroRippleScene implements SceneRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private textureReady = false;
  private imageAspect = 1672 / 941;
  private reducedMotion = false;
  private isDark = false;
  private scrollVelocity = 0;
  private currentTime = 0;
  private rippleIndex = 0;
  private ripples = new Float32Array(MAX_RIPPLES * 4);
  private loadedImageSrc: string | null = null;

  private uTextureLoc: WebGLUniformLocation | null = null;
  private uTextureReadyLoc: WebGLUniformLocation | null = null;
  private uResolutionLoc: WebGLUniformLocation | null = null;
  private uImageAspectLoc: WebGLUniformLocation | null = null;
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uPointerLoc: WebGLUniformLocation | null = null;
  private uScrollVelocityLoc: WebGLUniformLocation | null = null;
  private uReducedMotionLoc: WebGLUniformLocation | null = null;
  private uIsDarkLoc: WebGLUniformLocation | null = null;
  private uRipplesLoc: WebGLUniformLocation | null = null;

  public setTheme(isDark: boolean): void {
    this.isDark = isDark;
  }

  public setScrollVelocity(velocity: number): void {
    this.scrollVelocity = velocity;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /**
   * Spawns a new concentric ripple at normalized screen UV coordinates ([0, 1] top-left origin).
   */
  public spawnRipple(uvX: number, uvY: number, strength = 0.85): void {
    if (this.reducedMotion) return;
    const base = this.rippleIndex * 4;
    this.ripples[base] = uvX;
    this.ripples[base + 1] = uvY;
    this.ripples[base + 2] = this.currentTime;
    this.ripples[base + 3] = strength;
    this.rippleIndex = (this.rippleIndex + 1) % MAX_RIPPLES;
  }

  public loadImage(src: string): void {
    if (!this.gl || this.loadedImageSrc === src) return;
    this.loadedImageSrc = src;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const gl = this.gl;
      if (!gl || !this.texture) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        this.imageAspect = img.naturalWidth / img.naturalHeight;
      }
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      this.textureReady = true;
      this.spawnRipple(0.68, 0.44, 0.9);
    };
    img.src = src;
  }

  public init(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.gl = gl;

    const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create HeroRippleScene program');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`HeroRippleScene link error: ${info}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // 1x1 warm placeholder pixel until image loads
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([237, 229, 208, 0])
    );

    this.uTextureLoc = gl.getUniformLocation(program, 'uTexture');
    this.uTextureReadyLoc = gl.getUniformLocation(program, 'uTextureReady');
    this.uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    this.uImageAspectLoc = gl.getUniformLocation(program, 'uImageAspect');
    this.uTimeLoc = gl.getUniformLocation(program, 'uTime');
    this.uPointerLoc = gl.getUniformLocation(program, 'uPointer');
    this.uScrollVelocityLoc = gl.getUniformLocation(program, 'uScrollVelocity');
    this.uReducedMotionLoc = gl.getUniformLocation(program, 'uReducedMotion');
    this.uIsDarkLoc = gl.getUniformLocation(program, 'uIsDark');
    this.uRipplesLoc = gl.getUniformLocation(program, 'uRipples[0]');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public resize(width: number, height: number): void {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  public render(time: number, pointer: ScenePointer): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    this.currentTime = time;
    this.scrollVelocity *= 0.9;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uTextureLoc, 0);
    gl.uniform1f(this.uTextureReadyLoc, this.textureReady ? 1.0 : 0.0);
    gl.uniform2f(this.uResolutionLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.uImageAspectLoc, this.imageAspect);
    gl.uniform1f(this.uTimeLoc, time);
    gl.uniform2f(this.uPointerLoc, pointer.x, pointer.y);
    gl.uniform1f(this.uScrollVelocityLoc, this.scrollVelocity);
    gl.uniform1f(this.uReducedMotionLoc, this.reducedMotion ? 1.0 : 0.0);
    gl.uniform1f(this.uIsDarkLoc, this.isDark ? 1.0 : 0.0);
    gl.uniform4fv(this.uRipplesLoc, this.ripples);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    this.gl = null;
  }

  private compileShader(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`HeroRippleScene shader error: ${info}`);
    }
    return shader;
  }
}
