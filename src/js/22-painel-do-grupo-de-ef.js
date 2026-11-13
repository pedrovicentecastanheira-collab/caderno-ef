/* ---------- painel do grupo de EF (todas as turmas) ---------- */
function grupoRows() {
  return Object.values(S.turmas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', {numeric:true})).map(t => {
    const rs = alunosOf(t).map(al => calc(t, UI.p, al)), fins = rs.map(r => r.FIN).filter(x => x != null);
    const vz = rs.map(r => r.zones.vaivem).filter(z => z != null);
    return {t, n:rs.length, aulas:aulasOf(t.id).filter(a => periodOf(a.data) === UI.p).length, media:fins.length ? fins.reduce((s, x) => s + x, 0) / fins.length : null,
      st:{'Apto':rs.filter(r => r.EST === 'Apto').length, 'Não apto':rs.filter(r => r.EST === 'Não apto').length, 'Incompleto':rs.filter(r => r.EST === 'Incompleto').length},
      zs:vz.length ? Math.round(vz.filter(z => z >= 1).length / vz.length * 100) : null, F:rs.reduce((s, r) => s + r.c.F, 0)};
  });
}
function sheetGrupo() {
  const g = grupoRows();
  if (!g.length) { toast('Ainda não há turmas.'); return; }
  const b = fig('Média final por turma', perLabel(UI.p, true) + ' · escala 0–20', chBars(g.map(x => ({label:x.t.nome, v:x.media})), {label:'Média final por turma'})) +
    fig('Situação por turma', 'Aptos, não aptos e avaliações incompletas', chStack(g.map(x => ({label:x.t.nome, c:x.st})), STK, {id:'gr'}) + legend(STK)) +
    `<div class="tbl-wrap"><table><thead><tr><th class="l">Turma</th><th>Alunos</th><th>Aulas</th><th>Média</th><th>Aptos</th><th>Não aptos</th><th>Vaivém ZS+</th><th>Faltas</th></tr></thead><tbody>${g.map(x => `<tr><td class="l"><b>${esc(x.t.nome)}</b></td><td>${x.n}</td><td>${x.aulas}</td><td>${x.media == null ? '—' : nf(x.media)}</td><td>${x.st['Apto']}</td><td class="${x.st['Não apto'] ? 'low' : ''}">${x.st['Não apto']}</td><td>${x.zs == null ? '—' : x.zs + ' %'}</td><td>${x.F}</td></tr>`).join('')}</tbody></table></div>`;
  openSheet('Painel de todas as turmas · ' + perLabel(UI.p), `<div class="stack">${b}</div>`, `<button class="btn primary" data-a="grupo-xlsx">Exportar para Excel</button>`);
}

