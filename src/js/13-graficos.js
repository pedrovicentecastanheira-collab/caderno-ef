/* ---------- gráficos: SVG desenhado à mão, sem bibliotecas (funciona sem internet) ---------- */
// Níveis agrupados em 4 patamares ordinais (um só tom, do claro ao escuro), os mesmos da grelha.
const LVB = [{k:'b0', name:'Abaixo de I (NI, PI)', ls:['NI','PI']}, {k:'b1', name:'Introdução (I, PE)', ls:['I','PE']}, {k:'b2', name:'Elementar (E, PA)', ls:['E','PA']}, {k:'b3', name:'Avançado (A)', ls:['A']}];
const ZNK = [{k:0, name:'Fora da ZS', color:'var(--st-crit)'}, {k:1, name:'Zona Saudável', color:'var(--st-good)'}, {k:2, name:'Zona Atlética', color:'var(--v1)'}];
const STK = [{k:'Apto', name:'Apto', color:'var(--st-good)'}, {k:'Não apto', name:'Não apto', color:'var(--st-crit)'}, {k:'Incompleto', name:'Incompleto', color:'var(--v-none)'}];
let CHW = null; // largura fixa (relatório em A4)
const chartW = () => CHW || Math.max(280, Math.min(720, document.documentElement.clientWidth) - 62);
const nf = v => (Math.round(v * 10) / 10).toLocaleString('pt-PT');
function niceTicks(max) { const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 50) * 10; const out = []; for (let v = 0; v <= max + 1e-9; v += step) out.push(v); if (out[out.length - 1] < max) out.push(out[out.length - 1] + step); return out; }
const svg = (W, H, label, body) => `<svg class="viz" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const legend = keys => `<div class="vleg">${keys.map(k => `<span><i style="background:${k.color}"></i>${esc(k.name)}</span>`).join('')}</div>`;
const tableView = (head, rows) => `<details class="vtab"><summary>Ver em tabela</summary><div class="tbl-wrap"><table><thead><tr>${head.map((h, i) => `<th${i ? '' : ' class="l"'}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i ? '' : ' class="l"'}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
const fig = (title, sub, body) => `<figure class="card vfig"><figcaption><b>${esc(title)}</b>${sub ? `<span class="muted small">${esc(sub)}</span>` : ''}</figcaption>${body}</figure>`;
function topRound(x, y, w, h, r) { r = Math.min(r, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }
function rightRound(x, y, w, h, r) { r = Math.min(r, h / 2, w); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`; }

// Colunas verticais (uma série): contagens, percentagens.
function chColumns(data, o = {}) {
  const W = chartW(), H = o.h || 190, L = 34, B = 24, T = 12, iw = W - L - 6, ih = H - B - T;
  const max = o.max || Math.max(1, ...data.map(d => d.v || 0)), ticks = niceTicks(max), top = ticks[ticks.length - 1];
  const bw = iw / Math.max(1, data.length), w = Math.max(3, Math.min(44, bw - Math.max(2, bw * .28))), every = Math.ceil(data.length / Math.max(1, Math.floor(iw / 34)));
  const y = v => T + ih - v / top * ih;
  let b = ticks.map(t => `<line x1="${L}" x2="${W - 4}" y1="${y(t)}" y2="${y(t)}" class="vgrid"/><text x="${L - 6}" y="${y(t) + 4}" class="vax" text-anchor="end">${t}${o.unit || ''}</text>`).join('');
  data.forEach((d, i) => {
    const cx = L + bw * i + bw / 2, h = (d.v || 0) / top * ih;
    if (h > 0) b += `<path d="${topRound(cx - w / 2, y(d.v), w, h, 4)}" fill="var(--v1)"/>`;
    b += `<rect x="${L + bw * i}" y="${T}" width="${bw}" height="${ih}" fill="transparent" data-tip="${esc(d.tip || d.label + ': ' + d.v)}"/>`;
    if (i % every === 0) b += `<text x="${cx}" y="${H - 7}" class="vax" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return svg(W, H, o.label || '', b + `<line x1="${L}" x2="${W - 4}" y1="${T + ih}" y2="${T + ih}" class="vbase"/>`);
}
// Barras horizontais 0–20 com a linha dos 10 (positivo).
function chBars(rows, o = {}) {
  const W = chartW(), lw = Math.min(140, W * .34), max = o.max || 20, rh = 26, gap = 10, H = rows.length * (rh + gap) + 20, bw = W - lw - 44;
  const x = v => lw + v / max * bw;
  let b = '';
  [0, 5, 10, 15, 20].filter(v => v <= max).forEach(v => { b += `<line x1="${x(v)}" x2="${x(v)}" y1="0" y2="${H - 18}" class="${v === (o.ref ?? 10) ? 'vref' : 'vgrid'}"/><text x="${x(v)}" y="${H - 4}" class="vax" text-anchor="middle">${v}</text>`; });
  rows.forEach((r, i) => {
    const yy = i * (rh + gap) + 4;
    b += `<text x="${lw - 8}" y="${yy + rh / 2 + 4}" class="vlab" text-anchor="end">${esc(r.label)}</text>`;
    if (r.v != null) b += `<path d="${rightRound(x(0), yy, Math.max(1, x(r.v) - x(0)), rh, 4)}" fill="${r.color || 'var(--v1)'}"/><text x="${x(r.v) + 6}" y="${yy + rh / 2 + 4}" class="vval">${nf(r.v)}</text>`;
    else b += `<text x="${x(0) + 6}" y="${yy + rh / 2 + 4}" class="vax">sem dados</text>`;
    b += `<rect x="0" y="${yy - 4}" width="${W}" height="${rh + 8}" fill="transparent" data-tip="${esc(r.tip || r.label + ': ' + (r.v == null ? 'sem dados' : nf(r.v)))}"/>`;
  });
  return svg(W, H, o.label || '', b);
}
// Barras empilhadas a 100 % (composição): níveis, zonas, aptos.
function chStack(rows, keys, o = {}) {
  const W = chartW(), lw = Math.min(150, W * .36), bw = W - lw - 6, rh = 24, gap = 12, H = rows.length * (rh + gap);
  let b = '<defs>';
  rows.forEach((r, i) => { b += `<clipPath id="cp${o.id || 's'}${i}"><rect x="${lw}" y="${i * (rh + gap) + 2}" width="${bw}" height="${rh}" rx="4"/></clipPath>`; });
  b += '</defs>';
  rows.forEach((r, i) => {
    const yy = i * (rh + gap) + 2, tot = keys.reduce((s, k) => s + (r.c[k.k] || 0), 0);
    b += `<text x="${lw - 8}" y="${yy + rh / 2 + 4}" class="vlab" text-anchor="end">${esc(r.label)}</text>`;
    if (!tot) { b += `<rect x="${lw}" y="${yy}" width="${bw}" height="${rh}" rx="4" fill="var(--v-none)" data-tip="${esc(r.label)}: sem dados"/>`; return; }
    let xx = lw; const segs = keys.filter(k => r.c[k.k]);
    b += `<g clip-path="url(#cp${o.id || 's'}${i})">`;
    segs.forEach((k, j) => { const w = r.c[k.k] / tot * bw; b += `<rect x="${xx}" y="${yy}" width="${Math.max(0.5, w - (j < segs.length - 1 ? 2 : 0))}" height="${rh}" fill="${k.color}" data-tip="${esc(`${r.label} · ${k.name}: ${r.c[k.k]} (${Math.round(r.c[k.k] / tot * 100)} %)`)}"/>`; xx += w; });
    b += '</g>';
  });
  return svg(W, H, o.label || '', b);
}
// Linhas ao longo dos períodos, escala 0–20, linha dos 10.
function chLine(xl, series, o = {}) {
  const W = chartW(), H = o.h || 200, L = 30, R = series.length <= 4 ? 64 : 14, T = 12, B = 24, iw = W - L - R, ih = H - T - B, max = o.max || 20;
  const x = i => L + (xl.length === 1 ? iw / 2 : i / (xl.length - 1) * iw), y = v => T + ih - v / max * ih;
  let b = niceTicks(max).map(t => `<line x1="${L}" x2="${L + iw}" y1="${y(t)}" y2="${y(t)}" class="${t === (o.ref ?? 10) ? 'vref' : 'vgrid'}"/><text x="${L - 6}" y="${y(t) + 4}" class="vax" text-anchor="end">${t}</text>`).join('');
  xl.forEach((l, i) => { b += `<text x="${x(i)}" y="${H - 6}" class="vax" text-anchor="middle">${esc(l)}</text>`; });
  series.forEach(s => {
    const pts = s.vals.map((v, i) => v == null ? null : [x(i), y(v), v, i]);
    let d = '', pen = false; pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0] + ',' + p[1]; pen = true; });
    b += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach(p => { if (p) b += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/><circle cx="${p[0]}" cy="${p[1]}" r="14" fill="transparent" data-tip="${esc(`${s.name} · ${xl[p[3]]}: ${nf(p[2])}`)}"/>`; });
    const last = pts.filter(Boolean).pop(); if (last && series.length <= 4) b += `<text x="${last[0] + 9}" y="${last[1] + 4}" class="vlab">${esc(s.name)}</text>`;
  });
  return svg(W, H, o.label || '', b);
}
// Dica ao passar o rato ou ao tocar em qualquer marca com data-tip.
(function vizTips() {
  const tip = () => $('#vtip');
  const show = (el, x, y) => { const t = tip(); t.textContent = el.getAttribute('data-tip'); t.hidden = false; const w = t.offsetWidth, h = t.offsetHeight; t.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px'; t.style.top = Math.max(8, y - h - 14) + 'px'; };
  document.addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('svg.viz [data-tip]'); if (el && e.pointerType === 'mouse') show(el, e.clientX, e.clientY); else if (e.pointerType === 'mouse') tip().hidden = true; });
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('svg.viz [data-tip]'); if (el && e.pointerType !== 'mouse') { show(el, e.clientX, e.clientY); clearTimeout(vizTips.t); vizTips.t = setTimeout(() => tip().hidden = true, 2600); } else if (!el) tip().hidden = true; });
})();

