const OX = 400, OY = 80, TW = 32, TH = 16;
const P = (x, y, z = 0) => [OX + (x - y) * TW, OY + (x + y) * TH - z];
const pts = a => a.map(p => p.join(',')).join(' ');

function tree(x, y) {
  const [cx, cy] = P(x, y), c = (cx % 2 > 1) ? 215 : 245;
  return `<g><rect x="${cx - 3}" y="${cy - 8}" width="6" height="9" rx="2" fill="#b9a7ee"/>` +
    `<polygon points="${cx - 17},${cy - 6} ${cx},${cy - 36} ${cx + 17},${cy - 6}" fill="hsl(${c} 75% 80%)"/>` +
    `<polygon points="${cx - 13},${cy - 22} ${cx},${cy - 48} ${cx + 13},${cy - 22}" fill="hsl(${c} 70% 72%)"/></g>`;
}

function house(h) {
  const { gx: x, gy: y, id } = h, a = .7, e = .95, H = 34, R = 26;
  const wh = 200 + (id % 3) * 15, rh = 255 + (id % 4) * 10;
  const L = (p, z) => P(p[0], p[1], z);
  const B = [x + a, y - a], C = [x + a, y + a], D = [x - a, y + a];
  const wall = (p0, p1, t0, t1, z0, z1) => {
    const q = t => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
    return pts([L(q(t0), z0), L(q(t1), z0), L(q(t1), z1), L(q(t0), z1)]);
  };
  const D2 = [x - e, y + e], C2 = [x + e, y + e], B2 = [x + e, y - e], top = L([x, y], H + R);
  const ring = pts([P(x - 1.05, y - 1.05), P(x + 1.05, y - 1.05), P(x + 1.05, y + 1.05), P(x - 1.05, y + 1.05)]);
  const [bx, by] = L([x, y], H + R + 22);
  return `<g class="house" data-id="${id}" role="button" tabindex="0">` +
    `<polygon class="ring" points="${ring}"/>` +
    `<polygon points="${pts([L(D, 0), L(C, 0), L(C, H), L(D, H)])}" fill="hsl(${wh} 85% 96%)"/>` +
    `<polygon points="${pts([L(C, 0), L(B, 0), L(B, H), L(C, H)])}" fill="hsl(${wh} 75% 86%)"/>` +
    `<polygon points="${wall(D, C, .4, .64, 0, 20)}" fill="hsl(${rh} 55% 42%)"/>` +
    `<polygon class="win" points="${wall(C, B, .28, .72, 12, 27)}" fill="#e6f5ff" stroke="hsl(${rh} 60% 60%)" stroke-width="1.5"/>` +
    `<polygon points="${pts([L(D2, H - 3), L(C2, H - 3), top])}" fill="hsl(${rh} 80% 72%)"/>` +
    `<polygon points="${pts([L(C2, H - 3), L(B2, H - 3), top])}" fill="hsl(${rh} 70% 60%)"/>` +
    `<circle class="bd" cx="${bx}" cy="${by}" r="17"/><text class="bt" x="${bx}" y="${by + 5}" text-anchor="middle"></text></g>`;
}

export function drawMap(el, houses, pick) {
  const trees = [[.8, .9], [9.2, 4.1], [.7, 9.2], [4.6, 9.3], [8.8, 9.3], [7.2, 4], [9.3, .8]].map(([x, y]) => ({ k: x + y, s: tree(x, y) }));
  const hs = houses.map(h => ({ k: h.gx + h.gy, s: house(h) }));
  const items = [...trees, ...hs].sort((p, q) => p.k - q.k).map(i => i.s).join('');
  el.innerHTML = `<svg viewBox="0 0 800 460" role="group" aria-label="Изометрическая схема посёлка">` +
    `<defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9e8ff"/></linearGradient></defs>` +
    `<g class="ground"><polygon points="${pts([P(0, 10), P(10, 10), P(10, 10, -22), P(0, 10, -22)])}" fill="#c3d6fb"/>` +
    `<polygon points="${pts([P(10, 10), P(10, 0), P(10, 0, -22), P(10, 10, -22)])}" fill="#a9b8f0"/>` +
    `<g transform="matrix(32,16,-32,16,${OX},${OY})"><rect width="10" height="10" rx=".4" fill="url(#gr)"/>` +
    `<rect y="4.6" width="10" height=".9" fill="#e3dcff"/><line x1=".2" y1="5.05" x2="9.8" y2="5.05" stroke="#fff" stroke-width=".07" stroke-dasharray=".4 .3"/>` +
    `<ellipse cx="8.4" cy="1.6" rx="1.7" ry="1.1" fill="#8cc4ff"/><ellipse cx="8.4" cy="1.6" rx="1.2" ry=".7" fill="#bfe0ff"/></g></g>` +
    items + `</svg>`;
  const out = {};
  el.querySelectorAll('.house').forEach(g => {
    const id = +g.dataset.id; out[id] = g;
    g.addEventListener('click', () => pick(id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id); } });
  });
  return out;
}
