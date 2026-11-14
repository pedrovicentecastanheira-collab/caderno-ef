/* ---------- diferenciação pedagógica: estações por grupo de nível no plano de aula ---------- */
// Os grupos saem dos níveis atuais da matéria (ou, sem eles, da avaliação inicial) e mudam quando os níveis mudam.
const DG = {NI:'I', PI:'I', I:'I', PE:'E', E:'E', PA:'A', A:'A'}, DGN = {I:'Grupo Introdução', E:'Grupo Elementar', A:'Grupo Avançado'};
function difGrupos(t, a, m) {
  const p = periodOf(a.data), v = avalOf(t.id, p), g = {I:[], E:[], A:[]}, sem = [];
  alunosOf(t).forEach(al => {
    const ps = (a.presencas || {})[al.id]; if (ps === 'F' || ps === 'D' || (REG[regAt(al, p)] || REG.Normal).af === 0) return;
    const l = (lvOf(v, al.id, m) || {}).l || aiLv(t, al.id, m); if (l) g[DG[l]].push(al); else sem.push(al);
  });
  return {g, sem};
}
function difHtml(t, a) {
  const P = paOf(a); if (!P.dif) return `<div class="pa-p"><div class="pa-ph"><b>Diferenciação por grupos de nível</b></div><button class="btn sm" data-a="dif-on">Organizar a parte fundamental em estações por nível</button></div>`;
  const ms = a.materias.length ? a.materias : [P.dif.m].filter(Boolean); if (!ms.includes(P.dif.m)) P.dif.m = ms[0] || '';
  const m = P.dif.m; if (!m) return `<div class="pa-p"><b>Diferenciação por grupos de nível</b><p class="hint">Escolha primeiro a matéria da aula.</p></div>`;
  const {g, sem} = difGrupos(t, a, m), exs = exAll().filter(x => x.m === m);
  return `<div class="pa-p"><div class="pa-ph"><b>Estações por grupo de nível</b><button class="link" data-a="dif-off">Retirar</button></div>
    ${ms.length > 1 ? `<div class="chips">${ms.map(x => `<button class="chip ${x === m ? 'on' : ''}" data-a="dif-m" data-m="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    <div class="dif">${['I', 'E', 'A'].filter(k => g[k].length).map(k => { const cur = (P.dif.g || {})[k] || '', ex = exById(cur);
      return `<div class="dif-g ${AIG[k]}"><b>${DGN[k]} <span class="num-t">(${g[k].length})</span></b><div class="dif-n">${g[k].map(al => `<span>${esc(nome2(al.nome))}</span>`).join('')}</div>
        <select data-in="dif-ex" data-k="${k}" aria-label="Tarefa do ${DGN[k]}"><option value="">Escolher a tarefa…</option>${exs.filter(x => x.lv === k).concat(exs.filter(x => x.lv !== k)).map(x => `<option value="${esc(x.id)}"${x.id === cur ? ' selected' : ''}>${esc(x.lv + ' · ' + x.nome)}</option>`).join('')}</select>
        ${ex ? `<p class="small" style="margin:4px 0 0">${esc(ex.desc || '')}</p>${ex.crit ? `<p class="small muted" style="margin:2px 0 0">Critérios: ${esc(ex.crit)}</p>` : ''}` : ''}</div>`; }).join('')}</div>
    ${sem.length ? `<p class="hint">Sem nível em ${esc(m)} (fazem a tarefa do grupo Introdução até serem observados): ${esc(sem.map(al => nome2(al.nome)).join(', '))}.</p>` : ''}</div>`;
}
Object.assign(A, {
  'dif-on': () => { const P = paOf(UI.draft); P.dif = {m:UI.draft.materias[0] || '', g:{}}; paRefresh(); },
  'dif-off': () => { delete paOf(UI.draft).dif; paRefresh(); },
  'dif-m': el => { paOf(UI.draft).dif = {m:el.dataset.m, g:{}}; paRefresh(); }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'dif-ex' && UI.draft) { const P = paOf(UI.draft); P.dif.g = P.dif.g || {}; P.dif.g[el.dataset.k] = el.value; paRefresh(); } });
