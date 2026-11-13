/* ---------- histórico de alterações e desfazer ---------- */
// Cada avaliação gravada é comparada com a versão anterior; as diferenças ficam registadas por turma (quem, o quê, de, para, quando).
const SHADOW = {}, UNDOS = [];
const HLAB = {af:'Nível', iv:'Indicador', fit:'FITescola', con:'Conhecimentos', av:'Atitudes', comp:'Competências', obs:'Observação', med:'Medidas', auto:'Autoavaliação'};
const hval = x => x == null || x === '' ? '—' : typeof x === 'object' ? (Object.values(x).every(v => v === true) ? Object.keys(x).length + ' assinaladas' : 'alterado') : String(x).replace('.', ',');
function histDiff(a, b) {
  const ev = [];
  Object.keys(HLAB).forEach(f => {
    const A = (a || {})[f] || {}, B = (b || {})[f] || {};
    new Set([...Object.keys(A), ...Object.keys(B)]).forEach(aid => {
      const x = A[aid], y = B[aid]; if (JSON.stringify(x ?? null) === JSON.stringify(y ?? null)) return;
      if (f === 'obs' || f === 'med' || f === 'con' || f === 'auto' || typeof x !== 'object' && typeof y !== 'object') { ev.push({aid, f, k:'', de:f === 'auto' ? (x ? 'feita' : '—') : hval(x), para:f === 'auto' ? (y ? 'feita' : '—') : hval(y)}); return; }
      new Set([...Object.keys(x || {}), ...Object.keys(y || {})]).forEach(k => {
        const u = (x || {})[k], w = (y || {})[k]; if (JSON.stringify(u ?? null) === JSON.stringify(w ?? null)) return;
        const lab = f === 'iv' ? (Object.values(b.ind || {}).flat().find(i => i.id === k) || {}).n || k : f === 'av' ? AVN[k] || k : f === 'fit' ? ((FIT.find(z => z.k === k.replace(/_z$/, '')) || {}).n || k) + (/_z$/.test(k) ? ' (zona)' : '') : k;
        ev.push({aid, f, k:lab, de:f === 'av' && u != null ? u + 1 : hval(u), para:f === 'av' && w != null ? w + 1 : hval(w)});
      });
    });
  });
  return ev;
}
function histRecord(v) {
  const evs = histDiff(SHADOW[v.id], v); SHADOW[v.id] = clone(v); if (!evs.length || !v.turmaId) return;
  const h = S.hist[v.turmaId] = S.hist[v.turmaId] || {id:v.turmaId, ev:[]}, now = Date.now();
  evs.forEach(e => {
    const last = [...h.ev].reverse().find(x => x.aid === e.aid && x.f === e.f && x.k === e.k && x.p === v.p);
    if (last && now - last.ts < 8000) { last.para = e.para; last.ts = now; if (last.de === last.para) h.ev.splice(h.ev.indexOf(last), 1); }
    else h.ev.push(Object.assign({ts:now, p:v.p}, e));
  });
  if (h.ev.length > 1500) h.ev.splice(0, h.ev.length - 1500); // cada registo guardado tem de caber em 256 KB
  Store.save('hist', h);
}
function histHtml(t, aid, n = 40) {
  const ev = ((S.hist[t.id] || {}).ev || []).filter(e => !aid || e.aid === aid).slice(-n).reverse();
  if (!ev.length) return '<p class="hint" style="margin:0">Ainda sem alterações registadas.</p>';
  const nm = id => ((t.alunos || []).find(a => a.id === id) || {}).nome || '';
  return `<div class="hist">${ev.map(e => `<div class="hi"><span class="muted small">${esc(new Date(e.ts).toLocaleString('pt-PT', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}))} · ${esc(perLabel(e.p))}</span><span>${aid ? '' : `<b>${esc(nm(e.aid))}</b> · `}${esc(HLAB[e.f])}${e.k ? ' · ' + esc(e.k) : ''}: <span class="muted">${esc(e.de)}</span> → <b>${esc(e.para)}</b></span></div>`).join('')}</div>`;
}
