// Datamosh + pixel sort over a clean base frame. The canvas eases back to the base and gets corrupted
// again in proportion to `energy`; call kick() to add energy (load, pointer movement).
export function mosh(canvas, drawBase, { scale = 3, floor = .05, decay = .965, fps = 60, palette = null } = {}) {
  const cx = canvas.getContext("2d", { willReadFrequently: true });
  const base = document.createElement("canvas"), bx = base.getContext("2d");
  let W = 0, H = 0, energy = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width / scale)); H = Math.max(1, Math.floor(r.height / scale));
    for (const c of [canvas, base]) { c.width = W; c.height = H; }
    canvas.style.width = W * scale + "px"; canvas.style.height = H * scale + "px";
    drawBase(bx, W, H);
    if (palette) {
      const img = bx.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        let best = palette[0], bd = 1e9;
        for (const p of palette) { const dd = (d[i] - p[0]) ** 2 + (d[i + 1] - p[1]) ** 2 + (d[i + 2] - p[2]) ** 2; if (dd < bd) { bd = dd; best = p; } }
        d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
      }
      bx.putImageData(img, 0, 0);
    }
    cx.drawImage(base, 0, 0);
  };

  let last = performance.now();
  const frame = (now) => {
    if (now - last < 1000 / fps) { requestAnimationFrame(frame); return; }
    const k = Math.min(4, (now - last) / 16.7); last = now;
    cx.globalAlpha = .18 + (1 - Math.min(1, energy)) * .5;
    cx.drawImage(base, 0, 0);
    cx.globalAlpha = 1;
    const e = energy;
    // macroblocks keep the previous frame's pixels and slide
    for (let i = 0, n = Math.floor(e * 70); i < n; i++) {
      const bw = 8 * (1 + Math.floor(Math.random() * 4)), bh = 8 * (1 + Math.floor(Math.random() * 2));
      const x = Math.floor(Math.random() * W / 8) * 8, y = Math.floor(Math.random() * H / 8) * 8;
      cx.drawImage(canvas, x, y, bw, bh, x + Math.round((Math.random() - .5) * 24 * e), y + Math.round((Math.random() - .3) * 6 * e), bw, bh);
    }
    // a few rows get a run of pixels sorted by brightness
    for (let r = 0, rows = Math.floor(e * 26) + (Math.random() < .25 ? 1 : 0); r < rows; r++) {
      const y = Math.floor(Math.random() * H), h = Math.min(H - y, 1 + Math.floor(Math.random() * 4 * e + 1));
      const img = cx.getImageData(0, y, W, h), d = img.data;
      for (let row = 0; row < h; row++) {
        const a = Math.floor(Math.random() * W * .5), b = Math.min(W, a + Math.floor(W * (.2 + Math.random() * .6)));
        const seg = [];
        for (let x = a; x < b; x++) { const i = (row * W + x) * 4; seg.push([d[i], d[i + 1], d[i + 2]]); }
        seg.sort((p, q) => (q[0] * .3 + q[1] * .59 + q[2] * .11) - (p[0] * .3 + p[1] * .59 + p[2] * .11));
        seg.forEach((p, k) => { const i = (row * W + a + k) * 4; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; });
      }
      cx.putImageData(img, 0, y);
    }
    energy = Math.max(floor, energy * Math.pow(decay, k));
    requestAnimationFrame(frame);
  };

  resize();
  addEventListener("resize", resize);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still) requestAnimationFrame(frame);
  return {
    kick(amount) { if (!still) energy = Math.min(1.6, energy + amount); },
    corrupt() { if (still) return; cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H); energy = 1.6; },
    redraw: resize,
  };
}
