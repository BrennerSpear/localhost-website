// Thermal camera field: drifting bodies, cursor heat, row-sort glitch, ironbow palette.
// Renders at 1/block of CSS resolution and lets the browser upscale with pixelated sampling.

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;
uniform vec2 u_mouse;
uniform float u_mheat;
uniform vec2 u_grid;
uniform float u_hot;
uniform float u_dead[9];
uniform float u_bodies;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= .5; }
  return v;
}
// a person seen from the front: head over torso
float body(vec2 d, float s){
  vec2 h = d - vec2(0., .13 * s);
  float head = exp(-dot(h, h) / (.0011 * s * s));
  vec2 t = (d + vec2(0., .06 * s)) / vec2(.06 * s, .13 * s);
  float torso = exp(-dot(t, t) * 1.7);
  return max(head, torso * .82);
}
float heat(vec2 q, float aspect, float seed){
  float h = fbm(q * 3.2 + vec2(seed * 7.3, u_t * .05)) * .34;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    if (fi >= u_bodies) break;
    float k = fi + seed * 13.;
    float dir = mod(k, 2.) * 2. - 1.;
    float speed = .012 + .02 * hash(vec2(k, 1.));
    float x = fract(hash(vec2(k, 2.)) + dir * speed * u_t) * (aspect + .4) - .2;
    float y = .32 + .18 * hash(vec2(k, 4.)) + .015 * sin(u_t * 1.3 + k);
    float s = .75 + .55 * hash(vec2(k, 3.));
    h += .66 * body(q - vec2(x, y), s) * (.9 + .1 * sin(u_t * 2.1 + k));
  }
  return h;
}
vec3 iron(float t){
  t = clamp(t, 0., 1.);
  vec3 c0 = vec3(.015, .01, .035), c1 = vec3(.14, .03, .33), c2 = vec3(.52, .04, .56);
  vec3 c3 = vec3(.94, .22, .17), c4 = vec3(1., .7, .08), c5 = vec3(1., .98, .86);
  if (t < .2) return mix(c0, c1, t / .2);
  if (t < .42) return mix(c1, c2, (t - .2) / .22);
  if (t < .64) return mix(c2, c3, (t - .42) / .22);
  if (t < .84) return mix(c3, c4, (t - .64) / .2);
  return mix(c4, c5, (t - .84) / .16);
}
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 cellSize = u_res / u_grid;
  vec2 cell = floor(fc / cellSize);
  float idx = cell.x + (u_grid.y - 1. - cell.y) * u_grid.x;
  vec2 lp = mod(fc, cellSize);
  float aspect = cellSize.x / cellSize.y;
  // gutters between feeds
  if (u_grid.x * u_grid.y > 1.5 && (lp.x < 1. || lp.y < 1.)) { gl_FragColor = vec4(0., 0., 0., 1.); return; }
  float dead = 0.;
  for (int i = 0; i < 9; i++) { if (abs(float(i) - idx) < .5) dead = u_dead[i]; }
  if (dead > .5) {
    float st = hash(vec2(floor(fc.x / 2.), floor(fc.y / 2.)) + floor(u_t * 12.));
    gl_FragColor = vec4(vec3(.02, .025, .035) + st * .035, 1.);
    return;
  }
  vec2 q = lp / cellSize.y;
  float seed = idx * 1.618;
  float row = floor(fc.y);
  float g = hash(vec2(row, floor(u_t * 2.5) + idx));
  // block shift
  if (g > .985) q.x += (hash(vec2(row, u_t)) - .5) * .25;
  float h = heat(q, aspect, seed);
  // row sort: hot pixels drag their heat along the row
  if (g > .955) {
    for (int k = 1; k < 14; k++) {
      float hk = heat(q - vec2(float(k) * .018, 0.), aspect, seed);
      h = max(h, hk * (1. - float(k) * .045));
    }
  }
  vec2 m = (u_mouse - cell * cellSize) / cellSize.y;
  vec2 dm = q - m;
  h += u_mheat * exp(-dot(dm, dm) / .006);
  if (abs(idx - u_hot) < .5) h += .18;
  h = floor(h * 22.) / 22.;
  vec3 col = iron(h);
  col *= .93 + .07 * step(.5, fract(fc.y * .5));
  gl_FragColor = vec4(col, 1.);
}`;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export function thermal(canvas, opts = {}) {
  const block = opts.block ?? 5;
  const grid = opts.grid ?? [1, 1];
  const state = { mouse: [-9999, -9999], target: [-9999, -9999], mheat: 0, hot: -1, dead: new Float32Array(9), bodies: opts.bodies ?? 7 };
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) { canvas.style.background = "radial-gradient(circle at 50% 60%, #f03a2b, #84098e 40%, #23084f 70%, #050309)"; return state; }

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const U = { res: u("u_res"), t: u("u_t"), mouse: u("u_mouse"), mheat: u("u_mheat"), grid: u("u_grid"), hot: u("u_hot"), dead: u("u_dead"), bodies: u("u_bodies") };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width / block));
    canvas.height = Math.max(1, Math.round(r.height / block));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);

  const point = (x, y) => {
    const r = canvas.getBoundingClientRect();
    state.target = [(x - r.left) / block, (r.bottom - y) / block];
    if (state.mouse[0] < -999) state.mouse = state.target.slice();
    state.mheat = Math.min(1.1, state.mheat + 0.08);
  };
  addEventListener("pointermove", (e) => point(e.clientX, e.clientY));

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const frame = (now) => {
    if (visible) {
      state.mouse[0] += (state.target[0] - state.mouse[0]) * 0.12;
      state.mouse[1] += (state.target[1] - state.mouse[1]) * 0.12;
      state.mheat *= opts.mheatDecay ?? 0.985;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.t, still ? 12 : (now - t0) / 1000);
      gl.uniform2f(U.mouse, state.mouse[0], state.mouse[1]);
      gl.uniform1f(U.mheat, state.mheat * (opts.mouseGain ?? 0.9));
      gl.uniform2f(U.grid, grid[0], grid[1]);
      gl.uniform1f(U.hot, state.hot);
      gl.uniform1fv(U.dead, state.dead);
      gl.uniform1f(U.bodies, state.bodies);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!still) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return state;
}

// shared palette for 2D canvases (same stops as the shader)
const STOPS = [[0, [4, 3, 9]], [.2, [36, 8, 84]], [.42, [133, 10, 143]], [.64, [240, 56, 43]], [.84, [255, 179, 20]], [1, [255, 250, 219]]];
export function iron(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], f = (t - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
    }
  }
  return STOPS[STOPS.length - 1][1];
}
