/* ---------- verificação de consistência das notas ---------- */
// Avisos antes de exportar a pauta: nível acima das competências assinaladas, nota final muito diferente da do período
// anterior, descidas grandes de nível, níveis sem aulas da matéria e dispensas totais com níveis lançados.
const LVI = l => LV.indexOf(l);
function consist(t, p) {
  const v = avalOf(t.id, p), out = [], ms = matsOf(t, p), aulas = aulasOf(t.id).filter(a => periodOf(a.data) === p);
  const dadas = m => aulas.filter(a => (a.materias || []).includes(m)).length;
  alunosOf(t).forEach(al => {
    const R = REG[regAt(al, p)] || REG.Normal, nm = nome2(al.nome), r = calc(t, p, al);
    ms.forEach(m => {
      const x = lvOf(v, al.id, m); if (!x) return; const l = x.l;
      if (R.af === 0) { out.push({al, k:'info', txt:`${nm} tem dispensa total da prática mas tem nível ${l} em ${m}.`}); return; }
      const tk = tksOf(v, al.id, m);
      if (tk && Object.values(tk).some(Boolean) && !x.auto) {
        const lt = lvFromTicks(t.ciclo, m, tk);
        if (LVI(l) > LVI(lt)) { const k = {I:'I', PE:'E', E:'E', PA:'A', A:'A', PI:'I', NI:'I'}[l], cs = compsOf(t.ciclo, m).filter(c => c.k === k), n = cs.filter(c => tk[c.id]).length;
          out.push({al, m, k:'warn', txt:`${nm}: nível ${l} em ${m}, mas só ${n} das ${cs.length} competências do ${LVN[k]} estão assinaladas (as competências apontam para ${lt}).`}); }
      }
      if (!dadas(m)) out.push({al, m, k:'info', txt:`${nm}: nível ${l} em ${m}, sem aulas de ${m} registadas neste período.`});
      if (p > 1) { const y = lvOf(avalOf(t.id, p - 1), al.id, m); if (y && LVI(y.l) - LVI(l) >= 3) out.push({al, m, k:'warn', txt:`${nm}: ${m} desceu de ${y.l} (${perLabel(p - 1)}) para ${l}.`}); }
      const ai = t.ai && aiLv(t, al.id, m); if (ai && p === 1 && AIL.indexOf(ai) >= 2 && LVI(l) <= LVI('PI')) out.push({al, m, k:'warn', txt:`${nm}: ${m} com ${l}, mas na avaliação inicial estava em ${LVN[ai]}.`});
    });
    if (p > 1 && r.FIN != null) { const q = calc(t, p - 1, al).FIN; if (q != null && Math.abs(r.FIN - q) >= 4) out.push({al, k:'warn', txt:`${nm}: nota final ${r.FIN} muito diferente da do ${perLabel(p - 1, true)} (${q}, ${r.FIN > q ? '+' : ''}${r.FIN - q}).`}); }
  });
  const inc = alunosOf(t).filter(al => calc(t, p, al).EST === 'Incompleto').length;
  if (inc) out.unshift({k:'info', txt:`${inc} ${inc === 1 ? 'aluno tem' : 'alunos têm'} a avaliação incompleta.`});
  return out;
}
function consHtml(xs, max) {
  const ic = {warn:'!', info:'i', bad:'!'};
  return xs.slice(0, max || 999).map(x => `<button class="alrt ${x.k}" ${x.al ? `data-a="aluno-edit" data-id="${esc(x.al.id)}"` : 'data-a="cons-todo"'}><span class="ai" aria-hidden="true">${ic[x.k]}</span><span>${esc(x.txt)}</span></button>`).join('');
}
function vConsist(t) {
  const xs = consist(t, UI.p), w = xs.filter(x => x.k === 'warn').length;
  if (!xs.length) return `<div class="note ok">Verificação de consistência: sem avisos neste período.</div>`;
  return `<details class="card alerts cons"${w ? ' open' : ''}><summary><span class="eyebrow">Verificação de consistência</span> <span class="small muted">${w} ${w === 1 ? 'aviso' : 'avisos'}${xs.length - w ? ' · ' + (xs.length - w) + ' notas' : ''}</span></summary>${consHtml(xs)}</details>`;
}
// Antes de exportar: se houver avisos, mostra-os e deixa rever ou exportar assim mesmo.
const _xlsx = A.xlsx;
A.xlsx = () => {
  const t = turma(), xs = consist(t, UI.p).filter(x => x.k === 'warn');
  if (!xs.length) return _xlsx();
  openSheet('Antes de exportar a pauta', `<p>Há ${xs.length} ${xs.length === 1 ? 'situação' : 'situações'} a confirmar no ${perLabel(UI.p, true)}:</p><div class="card alerts">${consHtml(xs)}</div><p class="hint">Toque num aviso para abrir o aluno. Se estiver tudo certo, exporte assim mesmo.</p>`,
    `<button class="btn" data-a="sh-close">Rever</button><button class="btn primary" data-a="xlsx-go">Exportar assim mesmo</button>`);
};
A['xlsx-go'] = () => { closeSheet(); _xlsx(); };
A['cons-todo'] = () => { closeSheet(); UI.tab = 'avaliar'; UI.avMode = 'grelha'; FOCUS = null; UI.todo = true; render(); };
