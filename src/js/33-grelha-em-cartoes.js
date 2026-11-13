/* ---------- grelha em cartões: arrastar o aluno para o nível ---------- */
function vCartoes(c, cols, als) {
  const ok = cols.filter(x => x.type === 'lvl' || x.type === 'q4' || x.type === 'bool');
  if (!ok.length) return '<div class="card empty"><p>Não há colunas com níveis para mostrar em cartões.</p></div>';
  const col = ok.find(x => x.k === UI.gcol) || ok[0]; UI.gcol = col.k;
  const ch = [{v:null, label:'Sem valor', cls:''}, ...gChoices(col)], buck = {}, off = [];
  als.forEach(al => {
    if (gOff(col, al)) { off.push(al); return; }
    let v = gGet(c, col, al), auto = false;
    if (v == null && col.m && !col.ind) { const d = lvOf(c.v, al.id, col.m); if (d) { v = d.l; auto = true; } }
    if (v == null && col.type === 'q4' && (col.ak === 'pont' || col.ak === 'mat')) { const ct = counts(c.t, c.p, al.id); v = idxFromCount(col.ak === 'pont' ? ct.F + ct.A : ct.M); auto = true; }
    const k = String(v); (buck[k] = buck[k] || []).push({al, auto});
  });
  let h = `<div class="gcnav"><button class="btn" data-a="g-colstep" data-d="-1" aria-label="Anterior">‹</button><select data-in="gcol" aria-label="Coluna">${ok.map(x => `<option value="${esc(x.k)}"${x.k === col.k ? ' selected' : ''}>${x.sub ? '↳ ' : ''}${esc(x.title)}</option>`).join('')}</select><button class="btn" data-a="g-colstep" data-d="1" aria-label="Seguinte">›</button></div>
    <p class="hint">Arraste o cartão para outra coluna (no telemóvel, mantenha o dedo um instante antes de arrastar). Um toque abre a barra de valores.</p><div class="kb" id="kb">`;
  ch.forEach(x => {
    const xs = buck[String(x.v)] || [];
    h += `<div class="kc" data-v="${x.v == null ? '' : esc(String(x.v))}"><div class="kc-h ${x.cls || ''}"><b>${esc(x.label)}</b><span>${xs.length}</span></div><div class="kc-b">${xs.map(({al, auto}) => `<div class="kcard${SEL && SEL.aid === al.id && SEL.k === col.k ? ' sel' : ''}${auto ? ' auto' : ''}" data-aid="${esc(al.id)}" data-k="${esc(col.k)}" tabindex="0">${avatar(al, 'sm')}<span>${esc(al.nome)}</span></div>`).join('')}</div></div>`;
  });
  if (off.length) h += `<div class="kc offc"><div class="kc-h"><b>Não se aplica</b><span>${off.length}</span></div><div class="kc-b">${off.map(al => `<div class="kcard off">${avatar(al, 'sm')}<span>${esc(al.nome)}</span></div>`).join('')}</div></div>`;
  return h + '</div>';
}
// Arrastar com rato (logo) ou toque (após um toque longo), com deslocamento automático junto às margens.
let DRAG = null;
document.addEventListener('pointerdown', e => {
  const card = e.target.closest && e.target.closest('.kcard[data-aid]'); if (!card) return;
  DRAG = {card, x:e.clientX, y:e.clientY, on:false, id:e.pointerId, touch:e.pointerType !== 'mouse'};
  if (DRAG.touch) DRAG.timer = setTimeout(() => { if (DRAG && !DRAG.moved) dragStart(e.clientX, e.clientY); }, 260);
});
function dragStart(x, y) {
  const D = DRAG; D.on = true; const r = D.card.getBoundingClientRect(), g = D.card.cloneNode(true);
  g.className = 'kcard ghost'; g.style.width = r.width + 'px'; g.style.left = (x - r.width / 2) + 'px'; g.style.top = (y - 20) + 'px'; document.body.appendChild(g); D.g = g; D.card.classList.add('dragging');
  try { navigator.vibrate && navigator.vibrate(15); } catch (er) {}
}
document.addEventListener('pointermove', e => {
  const D = DRAG; if (!D) return;
  if (!D.on) { if (Math.abs(e.clientX - D.x) + Math.abs(e.clientY - D.y) > 8) { if (D.touch) { clearTimeout(D.timer); DRAG = null; return; } dragStart(e.clientX, e.clientY); } else return; }
  D.g.style.left = (e.clientX - D.g.offsetWidth / 2) + 'px'; D.g.style.top = (e.clientY - 20) + 'px';
  document.querySelectorAll('.kc.over').forEach(k => k.classList.remove('over'));
  const under = document.elementFromPoint(e.clientX, e.clientY), kc = under && under.closest('.kc[data-v]'); if (kc) kc.classList.add('over');
  const kb = $('#kb'); if (kb) { const r = kb.getBoundingClientRect(); clearInterval(D.as); if (e.clientX > r.right - 40) D.as = setInterval(() => kb.scrollLeft += 12, 16); else if (e.clientX < r.left + 40) D.as = setInterval(() => kb.scrollLeft -= 12, 16); }
});
document.addEventListener('touchmove', e => { if (DRAG && DRAG.on) e.preventDefault(); }, {passive:false});
document.addEventListener('pointerup', e => {
  const D = DRAG; if (!D) return; DRAG = null; clearTimeout(D.timer); clearInterval(D.as);
  if (D.g) D.g.remove(); D.card.classList.remove('dragging'); document.querySelectorAll('.kc.over').forEach(k => k.classList.remove('over'));
  const aid = D.card.dataset.aid, k = D.card.dataset.k;
  if (!D.on) { A.cell({dataset:{aid, k}}); return; }
  const under = document.elementFromPoint(e.clientX, e.clientY), kc = under && under.closest('.kc[data-v]'); if (!kc) return;
  const t = turma(), c = gCtx(t), col = gCols(t, c.v).find(x => x.k === k), al = (t.alunos || []).find(x => x.id === aid); if (!col || !al || !gEditable(col, al)) return;
  const raw = kc.dataset.v, val = raw === '' ? null : col.type === 'q4' ? +raw : raw;
  if (val === gGet(c, col, al)) return;
  gSnap(c, col); gSet(c, col, al, val); SEL = {aid, k}; gRefresh(); toast(al.nome.split(' ')[0] + ': ' + (val == null ? 'sem valor' : (gChoices(col).find(x => x.v === val) || {}).label));
});
document.addEventListener('pointercancel', () => { if (DRAG) { clearTimeout(DRAG.timer); clearInterval(DRAG.as); if (DRAG.g) DRAG.g.remove(); DRAG.card.classList.remove('dragging'); DRAG = null; } });

