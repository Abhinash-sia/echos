import { ScenePointer, SceneRenderer } from './types';

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

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScrollProgress;
uniform float uScrollVelocity;
uniform float uReducedMotion;
uniform float uIsDark;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    value += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 aspectUv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  float t = uReducedMotion > 0.5 ? 1.5 : uTime * 0.18;
  float scrollPhase = uScrollProgress * 3.14159;
  float vel = clamp(abs(uScrollVelocity) * 0.45, 0.0, 1.0);

  // Domain-warped organic caustic wave driven by pointer + scroll
  vec2 pointerOffset = uPointer * 0.35;
  vec2 q = vec2(
    fbm(aspectUv * 1.45 + vec2(t * 0.4, scrollPhase * 0.35) + pointerOffset * 0.4),
    fbm(aspectUv * 1.45 + vec2(5.2, 1.3) - vec2(t * 0.3, scrollPhase * 0.25))
  );

  // Scroll velocity subtly stretches vertical wave flow like film shutter drag
  vec2 dragUv = aspectUv + vec2(0.0, uScrollVelocity * 0.06);
  float field = fbm(dragUv * 1.65 + 1.4 * q + vec2(0.0, scrollPhase * 0.5));

  // Interactive cursor warm optical lens glow
  vec2 pointerAspect = vec2(
    uPointer.x * (uResolution.x / min(uResolution.x, uResolution.y)) * 0.5,
    uPointer.y * (uResolution.y / min(uResolution.x, uResolution.y)) * 0.5
  );
  float cursorDist = length(aspectUv - pointerAspect);
  float cursorHalo = exp(-cursorDist * 2.4) * (0.45 + vel * 0.35);

  // Scroll-responsive solar caustic ribbons
  float ribbon = smoothstep(0.38, 0.78, field);
  float secondaryRibbon = smoothstep(0.52, 0.88, q.x * 0.6 + q.y * 0.4);

  // Nostalgic warm palette (Light: golden amber + burnt coral; Dark: candlelit ember + antique gold)
  vec3 lightAmber = vec3(0.84, 0.58, 0.22);
  vec3 lightCoral = vec3(0.88, 0.36, 0.22);
  vec3 darkCoral = vec3(0.92, 0.42, 0.24);
  vec3 darkAmber = vec3(0.85, 0.62, 0.24);

  vec3 primaryCol = mix(lightAmber, darkCoral, uIsDark);
  vec3 secondaryCol = mix(lightCoral, darkAmber, uIsDark);

  vec3 color = mix(primaryCol, secondaryCol, secondaryRibbon);
  color = mix(color, primaryCol * 1.15, cursorHalo * 0.65);

  // Soft film grain in shader
  float grain = (hash21(gl_FragCoord.xy + fract(t * 60.0)) - 0.5) * 0.04;
  color += grain;

  // Gentle edge vignette fading out cleanly
  float edgeFade = smoothstep(1.35, 0.2, length(aspectUv));
  float baseAlpha = mix(0.08, 0.14, uIsDark);
  float alpha = (ribbon * baseAlpha + cursorHalo * (0.08 + uIsDark * 0.06) + vel * 0.03) * edgeFade;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.28));
}
`;

/**
 * Interactive WebGL shader backdrop responding to scroll progress, scroll velocity, and cursor.
 */
export class LandingAtmosphereScene implements SceneRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private reducedMotion = false;
  private scrollProgress = 0;
  private scrollVelocity = 0;
  private isDark = false;

  private uResolution: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uPointer: WebGLUniformLocation | null = null;
  private uScrollProgress: WebGLUniformLocation | null = null;
  private uScrollVelocity: WebGLUniformLocation | null = null;
  private uReducedMotion: WebGLUniformLocation | null = null;
  private uIsDark: WebGLUniformLocation | null = null;

  public setScrollState(progress: number, velocity: number): void {
    this.scrollProgress = progress;
    this.scrollVelocity = velocity;
  }

  public setTheme(isDark: boolean): void {
    this.isDark = isDark;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public init(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.gl = gl;

    const vert = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create WebGL program for LandingAtmosphereScene');
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`LandingAtmosphereScene shader link error: ${info}`);
    }

    gl.deleteShader(vert);
    gl.deleteShader(frag);

    this.program = program;

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.uResolution = gl.getUniformLocation(program, 'uResolution');
    this.uTime = gl.getUniformLocation(program, 'uTime');
    this.uPointer = gl.getUniformLocation(program, 'uPointer');
    this.uScrollProgress = gl.getUniformLocation(program, 'uScrollProgress');
    this.uScrollVelocity = gl.getUniformLocation(program, 'uScrollVelocity');
    this.uReducedMotion = gl.getUniformLocation(program, 'uReducedMotion');
    this.uIsDark = gl.getUniformLocation(program, 'uIsDark');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public resize(width: number, height: number): void {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  public render(time: number, pointer: ScenePointer): void {
    if (!this.gl || !this.program) return;
    const gl = this.gl;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Smoothly decay velocity toward zero every frame
    this.scrollVelocity *= 0.92;

    gl.uniform2f(this.uResolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.uTime, time);
    gl.uniform2f(this.uPointer, pointer.x, pointer.y);
    gl.uniform1f(this.uScrollProgress, this.scrollProgress);
    gl.uniform1f(this.uScrollVelocity, this.scrollVelocity);
    gl.uniform1f(this.uReducedMotion, this.reducedMotion ? 1.0 : 0.0);
    gl.uniform1f(this.uIsDark, this.isDark ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy(): void {
    if (!this.gl) return;
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    this.gl = null;
  }

  private compileShader(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create WebGL shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }
}

