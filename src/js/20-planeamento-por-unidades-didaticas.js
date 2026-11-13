/* ---------- planeamento por unidades didáticas ---------- */
const planOf = (t, p) => ((t.plano || {})[p] || []);
const dadasOf = (t, p, m) => aulasOf(t.id).filter(a => periodOf(a.data) === p && (a.materias || []).includes(m)).length;
function udAtual(t, p) { const u = planOf(t, p).find(u => dadasOf(t, p, u.m) < u.n); return u ? u.m : null; }
function vPlano(t) {
  const pl = planOf(t, UI.p);
  if (!pl.length) return `<button class="card" data-a="plano-edit" style="text-align:left"><b>Planear o ${esc(perLabel(UI.p, true))}</b><p class="hint" style="margin:4px 0 0">Indique as unidades didáticas e o número de aulas de cada uma: as aulas novas já vêm com a matéria certa e vê aqui o que falta dar.</p></button>`;
  const rows = pl.map(u => { const d = dadasOf(t, UI.p, u.m); return {u, d}; });
  const tot = rows.reduce((s, x) => s + Math.min(x.d, x.u.n), 0), prev = rows.reduce((s, x) => s + x.u.n, 0);
  return `<div class="card"><div class="sec-h" style="margin:0 0 8px"><h2 style="font-size:18px">Plano do ${esc(perLabel(UI.p, true))}</h2><span><button class="link" data-a="doc-plan">Imprimir</button> · <button class="link" data-a="plano-edit">Editar</button></span></div>
    <div class="plan">${rows.map(({u, d}) => `<div class="pl-r"><span class="pl-n">${esc(u.m)}</span><span class="pl-b" role="img" aria-label="${esc(u.m)}: ${d} de ${u.n} aulas"><i style="width:${Math.min(100, d / u.n * 100)}%"></i></span><span class="pl-v num-t">${d}/${u.n}</span></div>`).join('')}</div>
    <p class="hint" style="margin:8px 0 0">${tot} de ${prev} aulas previstas dadas${udAtual(t, UI.p) ? ' · em curso: <b>' + esc(udAtual(t, UI.p)) + '</b>' : ' · plano cumprido'}.</p></div>`;
}
function sheetPlano() {
  const t = turma(); UI.draft = clone(planOf(t, UI.p));
  planoRender(true);
}
function planoRender(open) {
  const t = turma(), d = UI.draft, ms = MATS[t.ciclo] || GR;
  const body = `<div class="form"><p class="hint">Pela ordem em que vai dar as matérias. Uma matéria pode repetir-se (ex.: duas unidades de Voleibol).</p>
    ${d.map((u, i) => `<div class="pl-ed"><select data-in="pl" data-i="${i}" data-k="m" aria-label="Matéria">${ms.map(m => `<option${u.m === m ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select><input type="number" min="1" max="60" inputmode="numeric" data-in="pl" data-i="${i}" data-k="n" value="${u.n}" aria-label="Aulas previstas"><button class="icon-btn" data-a="pl-del" data-i="${i}" aria-label="Remover">×</button></div>`).join('') || '<p class="muted">Ainda sem unidades.</p>'}
    <button class="btn" data-a="pl-add">+ Unidade didática</button></div>`;
  const foot = `<button class="btn primary" data-a="pl-save">Guardar plano</button>`;
  if (open) openSheet('Plano do ' + perLabel(UI.p, true), body, foot); else updSheet(body, foot);
}

