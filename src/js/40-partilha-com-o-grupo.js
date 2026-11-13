/* ---------- partilha de critérios com o grupo de EF ---------- */
// Um pacote JSON com o que o grupo combina: regras de cálculo, tabelas FITescola, indicadores por matéria e ano,
// planificações por ano, matérias da avaliação inicial, espaços e exercícios. Não leva alunos nem notas.
const PKG_TIPO = 'caderno-ef/criterios';
const PKG_PARTES = [['regras', 'Regras de cálculo e tabelas FITescola'], ['ind', 'Indicadores de desempenho por matéria'], ['planos', 'Planificações por ano'], ['ai', 'Matérias da avaliação inicial'], ['esp', 'Espaços e matérias possíveis'], ['exs', 'Exercícios do banco']];
function pkgBuild() {
  const ind = {}, planos = {}, ai = {};
  Object.values(S.turmas).forEach(t => {
    const ano = anoOf(t); if (!ano) return;
    [1, 2, 3].forEach(p => {
      Object.entries(avalOf(t.id, p).ind || {}).forEach(([m, xs]) => { const o = (ind[ano] = ind[ano] || {}), l = o[m] = o[m] || []; xs.forEach(i => { if (!l.includes(i.n)) l.push(i.n); }); });
      const pl = planOf(t, p); if (pl.length) { const o = planos[ano] = planos[ano] || {}; if (!o[p]) o[p] = clone(pl); }
    });
    if (t.ai && t.ai.mats && t.ai.mats.length && !ai[ano]) ai[ano] = t.ai.mats.slice();
  });
  return {tipo:PKG_TIPO, v:1, data:today(), escola:CFG.escola || '', autor:CFG.prof || '', ano:CFG.ano || '',
    regras:{niv:CFG.niv || null, aeCon:CFG.aeCon || null, fit:CFG.fit}, ind, planos, ai, esp:CFG.esp || null, exs:CFG.exs || []};
}
function pkgResumo(k, P) {
  if (k === 'regras') return P.regras ? 'níveis, conhecimentos e FITescola' : null;
  if (k === 'ind') { const n = Object.values(P.ind || {}).reduce((s, o) => s + Object.values(o).reduce((a, l) => a + l.length, 0), 0); return n ? `${n} indicadores (${Object.keys(P.ind).map(a => a + '.º').join(', ')})` : null; }
  if (k === 'planos') { const a = Object.keys(P.planos || {}); return a.length ? a.map(x => x + '.º ano').join(', ') : null; }
  if (k === 'ai') { const a = Object.keys(P.ai || {}); return a.length ? a.map(x => x + '.º ano').join(', ') : null; }
  if (k === 'esp') return P.esp ? P.esp.lista.join(', ') : null;
  if (k === 'exs') return (P.exs || []).length ? P.exs.length + ' exercícios' : null;
}
function vPartilha() {
  const P = pkgBuild();
  return `<div class="sec-h"><h2>Partilha com o grupo de EF</h2></div><div class="card form">
    <p class="hint" style="margin:0">Exporte os critérios combinados no grupo para um ficheiro e envie-o aos colegas (email, Teams, Drive). Quem o importar escolhe o que aplica. O pacote não leva alunos, fotografias nem notas.</p>
    <div class="list">${PKG_PARTES.map(([k, n]) => { const r = pkgResumo(k, P); return `<div class="li"><span class="who"><b>${n}</b><span class="small muted">${r ? esc(r) : 'nada para partilhar'}</span></span></div>`; }).join('')}</div>
    <div class="btn-row"><button class="btn primary" data-a="pkg-exp">Exportar pacote</button><button class="btn" data-a="pkg-imp">Importar pacote de um colega</button></div></div>`;
}
let PKG = null;
function sheetPkg() {
  const P = PKG.P, sel = PKG.sel;
  const body = `<div class="form"><p>Pacote de <b>${esc(P.autor || 'um colega')}</b>${P.escola ? ' · ' + esc(P.escola) : ''} · ${esc(fmtDate(P.data, {day:'numeric', month:'long', year:'numeric'}))}</p>
    ${PKG_PARTES.map(([k, n]) => { const r = pkgResumo(k, P); return r ? `<label class="cli"><input type="checkbox" data-in="pkg-p" data-k="${k}"${sel[k] ? ' checked' : ''}> <span><b>${n}</b><br><span class="hint">${esc(r)}</span></span></label>` : ''; }).join('')}
    <p class="hint">Indicadores, planificações e matérias da avaliação inicial aplicam-se às suas turmas do mesmo ano: juntam-se aos que já existem, sem apagar nada. Planos de período só entram onde ainda não há plano. As regras de cálculo substituem as atuais.</p></div>`;
  openSheet('Importar critérios do grupo', body, `<button class="btn primary" data-a="pkg-go">Aplicar</button>`);
}
function pkgApply(P, sel) {
  const n = {t:0};
  if (sel.regras && P.regras) { if (P.regras.niv) CFG.niv = P.regras.niv; if (P.regras.aeCon) CFG.aeCon = P.regras.aeCon; if (P.regras.fit) CFG.fit = Object.assign(clone(FITREF), P.regras.fit); }
  if (sel.esp && P.esp) { const E = espCfg(); P.esp.lista.forEach(x => { if (!E.lista.includes(x)) E.lista.push(x); E.mats[x] = [...new Set([...(E.mats[x] || []), ...((P.esp.mats || {})[x] || [])])]; }); }
  if (sel.exs && P.exs) { const ex = CFG.exs = CFG.exs || []; P.exs.forEach(x => { if (!ex.some(e => e.id === x.id || (e.m === x.m && e.nome === x.nome))) ex.push(Object.assign({}, x)); }); }
  Object.values(S.turmas).forEach(t => {
    const ano = String(anoOf(t)); let ch = false;
    if (sel.ind && P.ind && P.ind[ano]) { const v = avalOf(t.id, UI.p); v.ind = v.ind || {}; let vc = false;
      Object.entries(P.ind[ano]).forEach(([m, ns]) => { const l = v.ind[m] = v.ind[m] || []; ns.forEach(nm => { if (!l.some(i => i.n === nm)) { l.push({id:uid(), n:nm}); vc = true; } }); });
      if (vc) { v.materias = v.materias || []; Object.keys(P.ind[ano]).forEach(m => { if (!v.materias.includes(m)) v.materias.push(m); }); touchAval(v); n.t++; } }
    if (sel.planos && P.planos && P.planos[ano]) { t.plano = t.plano || {}; Object.entries(P.planos[ano]).forEach(([p, us]) => { if (!(t.plano[p] || []).length) { t.plano[p] = clone(us); ch = true; } }); }
    if (sel.ai && P.ai && P.ai[ano]) { const ai = aiOf(t); P.ai[ano].forEach(m => { if (!ai.mats.includes(m)) { ai.mats.push(m); ch = true; } }); }
    if (ch) { Store.save('turmas', t); n.t++; }
  });
  Store.save('cfg', CFG);
  return n.t;
}
Object.assign(A, {
  'pkg-exp': () => { const P = pkgBuild(), nm = 'criterios-ef-' + (CFG.escola || 'grupo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + today() + '.json';
    saveFile(nm, new Blob([JSON.stringify(P, null, 1)], {type:'application/json'})); },
  'pkg-imp': () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { pkgOpen(JSON.parse(await f.text())); } catch (e) { toast('Este ficheiro não é um pacote de critérios do Caderno EF.', 'bad'); } };
    inp.click(); },
  'pkg-go': () => { const n = pkgApply(PKG.P, PKG.sel); closeSheet(); render(); toast(n ? `Critérios aplicados (${n} ${n === 1 ? 'turma atualizada' : 'turmas atualizadas'}).` : 'Critérios aplicados.'); }
});
function pkgOpen(P) {
  if (!P || P.tipo !== PKG_TIPO) { toast('Este ficheiro não é um pacote de critérios do Caderno EF.', 'bad'); return; }
  PKG = {P, sel:Object.fromEntries(PKG_PARTES.map(([k]) => [k, !!pkgResumo(k, P) && k !== 'regras']))}; sheetPkg();
}
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'pkg-p' && PKG) PKG.sel[el.dataset.k] = el.checked; });
