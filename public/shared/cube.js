// dmarz's mark: the wireframe cube from @dmarz/kit (brand/src/DmarzMark.tsx), drawn small on a canvas.
// Jewel-tone edges (cyan, cobalt, violet, magenta, ember) sweeping round the cube, white-hot front
// vertices, depth-dimmed back edges. One slow turn every 16 s; still under prefers-reduced-motion.
const SLICK = [[20, 214, 255], [48, 96, 255], [140, 58, 255], [255, 40, 150], [255, 122, 24]];
// ping-pong through the stops so ember never blends back into cyan through mud
const slick = (u, b = 1) => {
  const w = ((u % 1) + 1) % 1;
  const t = (w < 0.5 ? w * 2 : (1 - w) * 2) * (SLICK.length - 1);
  const i = Math.min(SLICK.length - 2, Math.floor(t)), f = t - i, e = f * f * (3 - 2 * f);
  const [A, B] = [SLICK[i], SLICK[i + 1]];
  return `rgb(${A.map((a, n) => Math.min(255, Math.round((a + (B[n] - a) * e) * b))).join(",")})`;
};
const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

export function cube(canvas, { cycle = 16 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(3, devicePixelRatio || 1);
  const css = canvas.clientWidth || 18;
  canvas.width = canvas.height = Math.round(css * dpr);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = (t) => {
    const s = canvas.width, a = (t / cycle) * Math.PI * 2, tilt = 0.55;
    const [ca, sa, ct, st] = [Math.cos(a), Math.sin(a), Math.cos(tilt), Math.sin(tilt)];
    const P = V.map(([x, y, z]) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const k = 3.2 / (3.2 + z2);
      return [s / 2 + x1 * k * s * 0.26, s / 2 + y1 * k * s * 0.26, z2];
    });
    ctx.clearRect(0, 0, s, s);
    ctx.lineCap = "round";
    E.map(([i, j], n) => ({ i, j, n, z: (P[i][2] + P[j][2]) / 2 }))
      .sort((p, q) => q.z - p.z)
      .forEach(({ i, j, n, z }) => {
        const front = (1.6 - z) / 3.2;
        ctx.strokeStyle = slick(n / E.length + t / cycle, 0.55 + 0.45 * front);
        ctx.lineWidth = s * (0.035 + 0.04 * front);
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
      });
    // every vertex, always: size and brightness ease with depth, so nothing pops as it turns
    P.slice().sort((p, q) => q[2] - p[2]).forEach(([x, y, z]) => {
      const front = Math.min(1, Math.max(0, (1.6 - z) / 3.2));
      const e = front * front * (3 - 2 * front);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.75 * e})`;
      ctx.beginPath(); ctx.arc(x, y, s * (0.025 + 0.025 * e), 0, Math.PI * 2); ctx.fill();
    });
  };
  if (still) return draw(cycle * 0.12);
  const t0 = performance.now();
  const loop = (now) => { draw((now - t0) / 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
