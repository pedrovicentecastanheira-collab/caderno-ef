/* ---------- alertas ---------- */
function alertsOf(t, p) {
  const out = [], als = alunosOf(t), v = avalOf(t.id, p), rows = als.map(al => ({al, r:calc(t, p, al)}));
  const fal = rows.filter(x => x.r.c.F >= 3);
  if (fal.length) out.push({k:'bad', txt:`${fal.length} ${fal.length === 1 ? 'aluno tem' : 'alunos têm'} 3 ou mais faltas: ${fal.map(x => x.al.nome.split(' ')[0] + ' (' + x.r.c.F + ')').join(', ')}.`, a:'alunos'});
  const fim = CFG.per[p - 1].fim, dias = fim ? Math.round((new Date(fim + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 864e5) : 99, inc = rows.filter(x => x.r.EST === 'Incompleto').length;
  if (dias >= 0 && dias <= 21 && inc) out.push({k:'warn', txt:`Faltam ${dias} dias para o fim do ${perLabel(p, true)} e ${inc} ${inc === 1 ? 'aluno tem' : 'alunos têm'} a avaliação incompleta.`, a:'todo'});
  matsOf(t, p).forEach(m => { const n = als.filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0 && !lvOf(v, al.id, m)).length; const dadas = aulasOf(t.id).filter(a => periodOf(a.data) === p && (a.materias || []).includes(m)).length; if (n && dadas >= 4) out.push({k:'warn', txt:`${m}: ${dadas} aulas dadas e ${n} ${n === 1 ? 'aluno ainda sem nível' : 'alunos ainda sem nível'}.`, a:'todo'}); });
  if (p === 1 && t.ciclo !== '1' && als.length) { const pr = aiProg(t), d = diasAte(aiPrazo()); if (d >= -7 && d <= 45 && (!pr.tot || pr.done < pr.tot)) out.push({k:d <= 10 ? 'bad' : 'warn', txt:pr.tot ? `Avaliação inicial: ${pr.done} de ${pr.tot} registos; ${d >= 0 ? 'faltam ' + d + ' dias para ' + fmtDate(aiPrazo(), {day:'numeric', month:'long'}) : 'o prazo de ' + fmtDate(aiPrazo(), {day:'numeric', month:'long'}) + ' passou'}.` : `Avaliação inicial por fazer (até ${fmtDate(aiPrazo(), {day:'numeric', month:'long'})}): escolha as matérias e registe os níveis.`, a:'ai'}); }
  equidade(t, p).filter(x => Math.abs(x.d) >= 3).forEach(x => out.push({k:'info', txt:`Equidade em ${x.m}: ${x.d < 0 ? 'as raparigas' : 'os rapazes'} estão em média ${lvNear(Math.min(x.mf, x.mm))}, ${x.d < 0 ? 'os rapazes' : 'as raparigas'} ${lvNear(Math.max(x.mf, x.mm))}.`, a:'graf'}));
  const np = rows.filter(x => x.r.EST === 'Não apto'); if (np.length) out.push({k:'bad', txt:`Previsão de Não apto: ${np.map(x => x.al.nome.split(' ')[0]).join(', ')}.`, a:'pauta'});
  if (p > 1) { const dn = als.filter(al => { const a = calc(t, p - 1, al).zones.vaivem, b = calc(t, p, al).zones.vaivem; return a != null && b != null && b < a; }); if (dn.length) out.push({k:'warn', txt:`Vaivém: ${dn.length} ${dn.length === 1 ? 'aluno desceu' : 'alunos desceram'} de zona face ao período anterior (${dn.map(a => a.nome.split(' ')[0]).join(', ')}).`, a:'fit'}); }
  const sd = als.filter(al => !al.sexo || !al.nasc).length; if (sd) out.push({k:'info', txt:`${sd} ${sd === 1 ? 'aluno sem' : 'alunos sem'} sexo ou data de nascimento: necessários para as zonas do FITescola.`, a:'alunos'});
  return out;
}

