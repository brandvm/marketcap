// Growth (Home): a script-drawn chart of sales across the family's
// businesses since 1980. It's a shape for the story, not a dataset: steady,
// accelerating growth reaches the $60M gridline exactly as the year turns
// 2025, then jumps towards ~$100M by 2027 with no point or number at the end.
// Amounts appear only inside the chart (gridline labels $10M–$60M, a pinned
// dot per $10M crossed, and the X / Y read-out, which stops on 2025 / $60M+).
// Drawn by story-sequence.ts as the last step of the About scroll (on the
// Ironstone ground the mask reveals); the scroll position sets its progress.
// Markup: [data-growth-chart] (an empty div; its Designer class sets the size
// and the ink colour, which the SVG uses as currentColor).
const NS = 'http://www.w3.org/2000/svg';
const Y0 = 1980;
const Y1 = 2027;
const YEARS = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i);
const GRIDLINES = 10; // one per $10M, to $100M
const LABELLED = 6; // labels and pinned dots: $10M–$60M only
const JUMP = 2025;
const AT_JUMP = LABELLED / GRIDLINES;
const END = 0.97;
const E_JUMP = (JUMP - Y0) / (Y1 - Y0);
const trend = (year: number) => {
  if (year <= JUMP) return AT_JUMP * (0.03 + 0.97 * Math.pow((year - Y0) / (JUMP - Y0), 1.65));
  const u = Math.min(1, (year - JUMP) / (Y1 - JUMP));
  return AT_JUMP + (END - AT_JUMP) * Math.pow(u, 1.8);
};
// Bars sit a little under the line, with some texture so they read as years
// (none from 2020, so the last years only rise).
const value = (year: number) => {
  const t = (year - Y0) / (Y1 - Y0);
  const ripple = year >= 2020 ? 0 : 0.016 * Math.sin(year * 1.7) + 0.009 * Math.sin(year * 0.63);
  return Math.max(0.02, Math.min(1, trend(year) * 0.9 + ripple * (0.4 + t)));
};

const svgEl = <K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) => {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
};
const div = (cls: string, text = '') => {
  const d = document.createElement('div');
  d.className = cls;
  if (text) d.textContent = text;
  return d;
};
// Monotone cubic through the points (Fritsch–Carlson): no dip or overshoot.
function smooth(points: Array<[number, number]>) {
  const n = points.length;
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const s = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const m = points.map((_, i) => (i === 0 ? s[0] : i === n - 1 ? s[n - 2] : s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / s[i];
    const b = m[i + 1] / s[i];
    const h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * s[i]; m[i + 1] = k * b * s[i]; }
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x1 + h},${y1 + m[i] * h} ${x2 - h},${y2 - m[i + 1] * h} ${x2},${y2}`;
  }
  return d;
}

export function buildGrowthChart(host: HTMLElement) {
  host.classList.add('gc');
  host.replaceChildren();
  const svg = svgEl('svg', { class: 'gc-svg', 'aria-hidden': 'true' });
  const labels = div('gc-labels');
  labels.setAttribute('aria-hidden', 'true');
  const head = div('gc-head');
  head.setAttribute('aria-hidden', 'true');
  const readX = div('guides-label gc-read gc-read-x', 'X: 1980');
  const readY = div('guides-label gc-read gc-read-y', 'Y: $1M');
  head.append(div('guides-v'), div('guides-h'), div('guides-marker'), readX, readY);
  host.append(svg, labels, head);

  let progress = 0;
  let set: (e: number) => void = () => {};

  const build = () => {
    const W = host.clientWidth;
    const H = host.clientHeight;
    if (!W || !H) return;
    const small = W < 600;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    labels.replaceChildren();
    // Room on the right for the X read-out, which sits right of the point.
    const box = { x0: 0, x1: W - (small ? 58 : 80), base: H - (small ? 26 : 36), top: small ? 34 : 44 };
    const xOf = (year: number) => box.x0 + ((year - Y0 + 0.5) / (Y1 - Y0 + 1)) * (box.x1 - box.x0);
    const xEdge = (year: number) => box.x0 + ((year - Y0) / (Y1 - Y0 + 1)) * (box.x1 - box.x0);
    const yOf = (v: number) => box.base - v * (box.base - box.top);
    const step = (box.x1 - box.x0) / YEARS.length;
    const uid = 'gc' + Math.random().toString(36).slice(2, 7);

    const defs = svgEl('defs');
    const grad = svgEl('linearGradient', { id: `${uid}-f`, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svgEl('stop', { offset: 0, class: 'gc-fill-top' }), svgEl('stop', { offset: 1, class: 'gc-fill-bottom' }));
    const clip = svgEl('clipPath', { id: `${uid}-c` });
    const clipRect = svgEl('rect', { x: -2, y: -10, width: 0, height: H + 20 });
    clip.append(clipRect);
    defs.append(grad, clip);
    svg.append(defs);

    // Decade gridlines and labels; value gridlines, labelled to $60M.
    const grid = svgEl('g', { class: 'gc-grid' });
    for (let y = 1980; y <= 2020; y += 10) {
      const x = xEdge(y);
      grid.append(svgEl('line', { x1: x, x2: x, y1: box.top - 10, y2: box.base }));
      const l = div('gc-decade', `${y}s`);
      l.style.left = `${x}px`;
      l.style.top = `${box.base + (small ? 9 : 14)}px`;
      labels.append(l);
    }
    for (let k = 1; k <= GRIDLINES; k++) {
      const y = box.base - (k / GRIDLINES) * (box.base - box.top);
      grid.append(svgEl('line', { class: k > LABELLED ? 'gc-fine is-faint' : 'gc-fine', x1: box.x0, x2: box.x1, y1: y, y2: y }));
      if (k > LABELLED) continue;
      const amount = div('gc-amount', `$${k * 10}M`);
      amount.style.left = `${box.x0}px`;
      amount.style.top = `${y}px`;
      labels.append(amount);
    }
    const axis = div('label-text gc-axis', "[ Sales across the family's businesses ]");
    axis.style.left = `${box.x0}px`;
    axis.style.top = `${box.top - (small ? 30 : 40)}px`;
    labels.append(axis);
    grid.append(svgEl('line', { class: 'gc-baseline', x1: box.x0, x2: box.x1, y1: box.base, y2: box.base }));
    svg.append(grid);

    // Bars, area and line, revealed left to right by the clip.
    const drawn = svgEl('g', { 'clip-path': `url(#${uid}-c)` });
    const bars = svgEl('g');
    YEARS.forEach((y) => {
      const v = value(y);
      const bw = Math.max(2, step * 0.44);
      bars.append(svgEl('rect', { class: 'gc-bar', x: xOf(y) - bw / 2, y: yOf(v), width: bw, height: box.base - yOf(v) }));
    });
    drawn.append(bars);
    const tp = YEARS.map((y) => [xOf(y), yOf(trend(y))] as [number, number]);
    const lineD = smooth(tp);
    drawn.append(svgEl('path', { d: `${lineD} V${box.base} H${tp[0][0]} Z`, fill: `url(#${uid}-f)` }));
    drawn.append(svgEl('path', { class: 'gc-line', d: lineD }));
    svg.append(svgEl('path', { class: 'gc-ghost', d: lineD }), drawn);
    const tipAt = (e: number): [number, number] => {
      const year = Y0 + e * (Y1 - Y0);
      return [xOf(year), yOf(trend(year))];
    };

    // A dot pinned where the line crosses each labelled $10M gridline, left
    // behind as the head passes, with the year it was reached. The $60M dot
    // sits exactly on 2025.
    const pins = Array.from({ length: LABELLED }, (_, i) => {
      const k = i + 1;
      const level = k / GRIDLINES;
      let e = E_JUMP;
      if (k < LABELLED) {
        for (let s = 0; s <= 2000; s++) {
          if (trend(Y0 + (s / 2000) * (Y1 - Y0)) >= level) { e = s / 2000; break; }
        }
      }
      const p = div('gc-pin');
      p.style.left = `${xOf(Y0 + e * (Y1 - Y0))}px`;
      p.style.top = `${yOf(level)}px`;
      p.append(div('gc-pin-dot'), div('guides-label gc-pin-year', String(Math.floor(Y0 + e * (Y1 - Y0) + 1e-6))));
      labels.append(p);
      return { e, p };
    });

    set = (e: number) => {
      progress = e;
      const t = Math.max(0, Math.min(1, e));
      pins.forEach(({ e: at, p }) => {
        p.classList.toggle('is-shown', t >= at);
        // The read-out says the year while the head sits on a dot.
        p.classList.toggle('is-at', t >= at && t - at < 0.06);
      });
      // The line draws to t; the head (crosshair, read-outs) stops at the
      // $60M dot and the jump after it carries no point or number.
      const [lx] = tipAt(Math.max(0.0001, t));
      const th = Math.min(t, E_JUMP);
      const [hx, hy] = tipAt(Math.max(0.0001, th));
      clipRect.setAttribute('width', String(lx + 2));
      host.style.setProperty('--hx', `${hx}px`);
      host.style.setProperty('--hy', `${hy}px`);
      const year = Math.floor(Y0 + th * (Y1 - Y0) + 1e-6);
      const millions = Math.max(1, Math.floor(((box.base - hy) / (box.base - box.top)) * GRIDLINES * 10));
      readX.textContent = `X: ${year}`;
      readY.textContent = th >= E_JUMP - 0.0005 || millions >= 60 ? 'Y: $60M+' : `Y: $${millions}M`;
    };
    set(progress);
  };
  return { build, set: (e: number) => set(e), get progress() { return progress; } };
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
