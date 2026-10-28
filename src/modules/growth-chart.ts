// Growth (Home): a script-drawn chart of growth across the family's
// businesses since 1980. It's a shape for the story, not a dataset, and it
// carries no amounts (client review, 2026-10-28: no asset values online):
// the line, bars and gridlines have no scale, and the read-out gives the
// year only. The three growth periods the client named are shaded bands
// that light up as the line reaches them; the line climbs steeply inside
// them and gently between. The head stops at 2025; the rise after it has
// no point or label.
// Drawn by story-sequence.ts as the last step of the About scroll (on the
// Ironstone ground the mask reveals); the scroll position sets its progress.
// Markup: [data-growth-chart] (an empty div; its Designer class sets the size
// and the ink colour, which the SVG uses as currentColor).
const NS = 'http://www.w3.org/2000/svg';
const Y0 = 1980;
const Y1 = 2027;
const YEARS = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i);
const GRIDLINES = 10; // texture only: no labels, no scale
const PERIODS = [
  { from: 1987, to: 1993, label: 'Late 1980s – early 1990s', short: 'Late ’80s – ’90s' },
  { from: 2007, to: 2016, label: '2007 – 2016', short: '2007–16' },
  { from: 2018, to: 2024, label: '2018 – 2024', short: '2018–24' },
];
const JUMP = 2025;
const AT_JUMP = 0.62;
const END = 0.97;
const E_JUMP = (JUMP - Y0) / (Y1 - Y0);
// Growth rate per year: steep inside a period (soft edges), gentle between.
const rate = (year: number) => {
  const inside = PERIODS.reduce((m, p) => {
    const edge = Math.min(year - (p.from - 1), p.to + 1 - year);
    return Math.max(m, Math.max(0, Math.min(1, edge / 1.5)));
  }, 0);
  return 0.08 + inside * (1 - 0.08);
};
// The trend integrates the rate (fine steps), scaled to reach AT_JUMP at 2025.
const TOTAL = (() => { let s = 0; for (let y = Y0; y < JUMP; y += 0.05) s += rate(y) * 0.05; return s; })();
const trend = (year: number) => {
  if (year <= JUMP) {
    let s = 0;
    for (let y = Y0; y < year; y += 0.05) s += rate(y) * Math.min(0.05, year - y);
    return AT_JUMP * (0.04 + 0.96 * (s / TOTAL));
  }
  const u = Math.min(1, (year - JUMP) / (Y1 - JUMP));
  return AT_JUMP + (END - AT_JUMP) * Math.pow(u, 1.8);
};
// Bars sit a little under the line, with some texture so they read as years
// (none from 2020, so the last years only rise).
const value = (year: number) => {
  const t = (year - Y0) / (Y1 - Y0);
  const ripple = year >= 2020 ? 0 : 0.014 * Math.sin(year * 1.7) + 0.008 * Math.sin(year * 0.63);
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
  head.append(div('guides-v'), div('guides-marker'), readX);
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

    // Growth periods: shaded bands behind everything, each labelled at its
    // top, where the line hasn't reached yet.
    const bandLayer = svgEl('g', { class: 'gc-bands' });
    const bands = PERIODS.map((p, i) => {
      const x = xEdge(p.from);
      const w = xEdge(p.to + 1) - x;
      const rect = svgEl('rect', { class: 'gc-band', x, y: box.top - 10, width: w, height: box.base - box.top + 10 });
      bandLayer.append(rect);
      const l = div('guides-label gc-period');
      l.append(div('gc-period-index', `[ 0${i + 1} ]`), div('', small ? p.short : p.label));
      l.style.left = `${x + w / 2}px`;
      l.style.top = `${box.top}px`;
      labels.append(l);
      return { at: (p.from - Y0) / (Y1 - Y0), end: (p.to + 1 - Y0) / (Y1 - Y0), rect, l };
    });
    svg.append(bandLayer);

    // Decade gridlines and labels; unlabelled level lines for texture.
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
      grid.append(svgEl('line', { class: 'gc-fine is-faint', x1: box.x0, x2: box.x1, y1: y, y2: y }));
    }
    const axis = div('label-text gc-axis', "[ Growth across the family's businesses ]");
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

    // A dot pinned on the line where each period ends, left behind as the
    // head passes.
    const pins = bands.map(({ end }) => {
      const [x, y] = tipAt(end);
      const p = div('gc-pin');
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.append(div('gc-pin-dot'));
      labels.append(p);
      return { e: end, p };
    });

    set = (e: number) => {
      progress = e;
      const t = Math.max(0, Math.min(1, e));
      pins.forEach(({ e: at, p }) => p.classList.toggle('is-shown', t >= at));
      // A band lights up when the line reaches it and stays lit; it's
      // strongest while the head is inside it.
      bands.forEach(({ at, end, rect, l }) => {
        const shown = t >= at;
        const active = shown && t < end;
        rect.classList.toggle('is-shown', shown);
        rect.classList.toggle('is-active', active);
        l.classList.toggle('is-shown', shown);
      });
      // The line draws to t; the head (crosshair, read-out) stops at 2025
      // and the rise after it carries no point or label.
      const [lx] = tipAt(Math.max(0.0001, t));
      const th = Math.min(t, E_JUMP);
      const [hx, hy] = tipAt(Math.max(0.0001, th));
      clipRect.setAttribute('width', String(lx + 2));
      host.style.setProperty('--hx', `${hx}px`);
      host.style.setProperty('--hy', `${hy}px`);
      readX.textContent = `X: ${Math.floor(Y0 + th * (Y1 - Y0) + 1e-6)}`;
    };
    set(progress);
  };
  return { build, set: (e: number) => set(e), get progress() { return progress; } };
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
