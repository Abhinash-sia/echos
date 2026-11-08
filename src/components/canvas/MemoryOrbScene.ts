import { SceneRenderer, ScenePointer } from './types';

/**
 * GLSL Shaders for the Celestial Memory Orb
 * An ethereal floating artifact representing preserved memories in digital spacetime.
 */

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
uniform float uReducedMotion;
uniform int uIsDark;

varying vec2 vUv;

// Rotation matrix
mat2 rot2D(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Simple 3D noise / hash
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Ray-sphere intersection
float sphereIntersect(vec3 ro, vec3 rd, vec3 ce, float ra) {
  vec3 oc = ro - ce;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - ra * ra;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  
  float t = uReducedMotion > 0.5 ? 2.5 : uTime * 0.4;
  
  // Camera setup
  vec3 ro = vec3(0.0, 0.0, 2.5);
  vec3 rd = normalize(vec3(uv, -1.5));
  
  // Subtle interactive parallax tilt
  vec2 pointerTilt = uPointer * 0.35;
  ro.yz = rot2D(pointerTilt.y) * ro.yz;
  rd.yz = rot2D(pointerTilt.y) * rd.yz;
  ro.xz = rot2D(pointerTilt.x) * ro.xz;
  rd.xz = rot2D(pointerTilt.x) * rd.xz;
  
  // Center of the memory sphere
  vec3 sphereCenter = vec3(0.0, sin(t * 0.8) * 0.04, 0.0);
  float sphereRadius = 0.62 + sin(t * 1.5) * 0.015;
  
  // Palette definitions: Cinematic Editorial Nostalgia
  vec3 colTerracotta = vec3(0.76, 0.33, 0.17); // #C3532B Burnt orange
  vec3 colOchre = vec3(0.85, 0.53, 0.23);      // #D9883B Warm morning sun
  vec3 colIvory = vec3(0.96, 0.94, 0.91);      // #F6F1EA Archival paper
  vec3 colObsidian = vec3(0.06, 0.06, 0.07);   // #0E0F12 Slate obsidian
  
  vec3 baseBg = uIsDark == 1 ? colObsidian : colIvory;
  vec3 color = baseBg;
  
  // Architectural raking window sunlight & shadow bands
  float sunRays = smoothstep(0.1, 0.6, sin((uv.x * 2.2 + uv.y * 1.4) + pointerTilt.x * 0.8) * 0.5 + 0.5);
  vec3 sunLightColor = mix(colOchre, colTerracotta, uv.y * 0.5 + 0.5);
  color = mix(color, sunLightColor, sunRays * (uIsDark == 1 ? 0.18 : 0.09));
  
  // Ambient background vignette and atmospheric solar halo
  float distFromCenter = length(uv);
  float halo = exp(-distFromCenter * 2.6) * 0.5;
  vec3 haloColor = mix(colTerracotta, colOchre, sin(t * 0.8) * 0.5 + 0.5);
  color = mix(color, haloColor, halo * (uIsDark == 1 ? 0.65 : 0.28));
  
  // Evaluate sphere intersection
  float dist = sphereIntersect(ro, rd, sphereCenter, sphereRadius);
  
  if (dist > 0.0) {
    vec3 hitPos = ro + rd * dist;
    vec3 normal = normalize(hitPos - sphereCenter);
    
    // Internal rotating artifact coordinates
    vec3 localPos = hitPos - sphereCenter;
    localPos.xz = rot2D(t * 0.5) * localPos.xz;
    localPos.xy = rot2D(t * 0.25) * localPos.xy;
    
    // Procedural mineral vein pattern
    float pattern = hash(floor(localPos * 4.0)) * 0.2 + sin(localPos.y * 10.0 + t) * 0.1;
    
    // Low raking architectural sunlight
    vec3 lightDir = normalize(vec3(0.7 + pointerTilt.x * 0.4, 0.5 + pointerTilt.y * 0.3, 0.9));
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Fresnel rim glow
    float fresnel = pow(1.0 - max(dot(-rd, normal), 0.0), 2.8);
    
    // Specular highlight
    vec3 halfVec = normalize(lightDir - rd);
    float spec = pow(max(dot(normal, halfVec), 0.0), 28.0);
    
    // Composite solar mineral material
    vec3 sphereColor = mix(colOchre, colTerracotta, normal.y * 0.5 + 0.5 + pattern);
    sphereColor *= (diff * 0.85 + 0.25);
    sphereColor += fresnel * mix(colIvory, colOchre, 0.7) * 1.3;
    sphereColor += spec * 0.9;
    
    color = sphereColor;
  }
  
  // Orbiting celestial particles (stardust memories)
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float orbitAngle = t * 0.8 + fi * (6.28318 / 16.0);
    float orbitRadius = 0.95 + sin(fi * 1.5 + t) * 0.18;
    vec3 particlePos = sphereCenter + vec3(
      cos(orbitAngle) * orbitRadius,
      sin(orbitAngle * 1.5) * 0.35,
      sin(orbitAngle) * orbitRadius
    );
    
    // Project particle to screen
    vec3 toP = particlePos - ro;
    float pDist = length(toP);
    vec3 pDir = toP / pDist;
    
    // Only draw particles if they are in front of camera
    if (dot(pDir, rd) > 0.998) {
      float pIntensity = pow((dot(pDir, rd) - 0.998) / 0.002, 2.0);
      vec3 pColor = mix(colOchre, colIvory, sin(fi) * 0.5 + 0.5);
      color += pColor * pIntensity * 1.2;
    }
  }
  
  gl_FragColor = vec4(color, 1.0);
}
`;

export class MemoryOrbScene implements SceneRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private reducedMotion = false;

  private uResolutionLocation: WebGLUniformLocation | null = null;
  private uTimeLocation: WebGLUniformLocation | null = null;
  private uPointerLocation: WebGLUniformLocation | null = null;
  private uReducedMotionLocation: WebGLUniformLocation | null = null;
  private uIsDarkLocation: WebGLUniformLocation | null = null;

  init(gl: WebGLRenderingContext | WebGL2RenderingContext, _canvas: HTMLCanvasElement): void {
    void _canvas;
    this.gl = gl;

    // Compile vertex shader
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) throw new Error('Failed to create vertex shader');
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(vs);
      gl.deleteShader(vs);
      throw new Error(`Vertex shader error: ${err}`);
    }

    // Compile fragment shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) throw new Error('Failed to create fragment shader');
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(fs);
      gl.deleteShader(fs);
      throw new Error(`Fragment shader error: ${err}`);
    }

    // Link program
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(program);
      throw new Error(`Program link error: ${err}`);
    }

    this.program = program;

    // Setup full-screen quad positions [-1, -1] to [1, 1]
    const positions = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Uniform locations
    this.uResolutionLocation = gl.getUniformLocation(program, 'uResolution');
    this.uTimeLocation = gl.getUniformLocation(program, 'uTime');
    this.uPointerLocation = gl.getUniformLocation(program, 'uPointer');
    this.uReducedMotionLocation = gl.getUniformLocation(program, 'uReducedMotion');
    this.uIsDarkLocation = gl.getUniformLocation(program, 'uIsDark');
  }

  resize(width: number, height: number, _dpr: number): void {
    void _dpr;
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  render(time: number, pointer: ScenePointer): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.useProgram(this.program);

    // Bind full screen geometry
    const positionAttr = gl.getAttribLocation(this.program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    if (this.uResolutionLocation) {
      gl.uniform2f(this.uResolutionLocation, gl.canvas.width, gl.canvas.height);
    }
    if (this.uTimeLocation) {
      gl.uniform1f(this.uTimeLocation, time);
    }
    if (this.uPointerLocation) {
      gl.uniform2f(this.uPointerLocation, pointer.x, pointer.y);
    }
    if (this.uReducedMotionLocation) {
      gl.uniform1f(this.uReducedMotionLocation, this.reducedMotion ? 1.0 : 0.0);
    }
    if (this.uIsDarkLocation) {
      const isDark = document.documentElement.classList.contains('dark') ? 1 : 0;
      gl.uniform1i(this.uIsDarkLocation, isDark);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  destroy(): void {
    if (!this.gl) return;
    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    this.gl = null;
  }
}
