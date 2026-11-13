/* ---------- painel inicial ---------- */
function slotsAgora() {
  const now = new Date(), hm = pad(now.getHours()) + ':' + pad(now.getMinutes()), sl = hojeSlots();
  const mins = h => +h.slice(0, 2) * 60 + +h.slice(3, 5), m = mins(hm);
  return {cur:sl.filter(x => m >= mins(x.h) && m < mins(x.h) + 90).pop(), next:sl.find(x => mins(x.h) > m), all:sl};
}
function vInicio() {
  const ts = Object.values(S.turmas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', {numeric:true})), p = UI.p, hr = new Date().getHours();
  let h = `<div class="stack"><div class="hello"><div class="eyebrow">${esc(fmtDate(today(), {weekday:'long', day:'numeric', month:'long'}))} · ${esc(perLabel(p, true))}</div><h1>${hr < 13 ? 'Bom dia' : hr < 20 ? 'Boa tarde' : 'Boa noite'}${CFG.prof ? ', ' + esc(CFG.prof.split(' ')[0]) : ''}</h1></div>`;
  h += vWizHorario();
  // Agora e a seguir
  const {cur, next, all} = slotsAgora(), slot = (x, lbl) => { const feita = aulasOf(x.t.id).find(a => a.data === today()); return `<div class="now"><span class="eyebrow">${lbl}</span><div class="now-h"><b>${esc(x.h)}</b><span>${esc(x.t.nome)}</span></div><div class="btn-row"><button class="btn primary" data-a="hoje-go" data-id="${esc(x.t.id)}">${feita ? 'Abrir a aula' : 'Registar a aula'}</button><button class="btn" data-a="ini-aval" data-id="${esc(x.t.id)}">Avaliar</button></div></div>`; };
  if (cur || next) h += `<div class="card nowc">${cur ? slot(cur, 'Agora') : ''}${next ? slot(next, cur ? 'A seguir' : 'Próxima aula') : ''}${all.length > (cur ? 1 : 0) + (next ? 1 : 0) ? `<p class="hint" style="margin:0">Hoje: ${all.map(x => esc(x.h + ' ' + x.t.nome)).join(' · ')}</p>` : ''}</div>`;
  else h += `<div class="card"><p style="margin:0">${all.length ? 'Já não há mais aulas hoje.' : 'Não há aulas de Educação Física no horário de hoje.'}</p>${Object.values(S.turmas).some(x => (x.horario || []).length) ? '' : '<p class="hint" style="margin:6px 0 0">Defina o horário de cada turma (Mais → turma) para ver aqui a aula de agora e a seguinte.</p>'}</div>`;
  // Turmas: avaliação e assiduidade
  h += `<div class="sec-h"><h2>Turmas · ${esc(perLabel(p))}</h2></div><div class="tgrid2">`;
  ts.forEach(tm => {
    const als = alunosOf(tm), rs = als.map(al => calc(tm, p, al)), comp = rs.filter(r => r.EST !== 'Incompleto').length, pct = als.length ? Math.round(comp / als.length * 100) : 0;
    const aul = aulasOf(tm.id).filter(a => periodOf(a.data) === p).length, prev = planOf(tm, p).reduce((s, u) => s + u.n, 0), F = rs.reduce((s, r) => s + r.c.F, 0), np = rs.filter(r => r.EST === 'Não apto').length;
    h += `<button class="card tcard" data-a="ini-turma" data-id="${esc(tm.id)}"><div class="tc-h"><b>${esc(tm.nome)}</b><span class="muted small">${als.length} alunos</span></div>
      <div class="tc-l"><span>Avaliação completa</span><b class="num-t">${comp}/${als.length}</b></div><span class="pl-b" role="img" aria-label="${pct} % avaliados"><i style="width:${pct}%"></i></span>
      <div class="tc-s"><span>${aul}${prev ? '/' + prev : ''} aulas</span><span>${F} faltas</span>${np ? `<span class="low">${np} não ${np === 1 ? 'apto' : 'aptos'}</span>` : ''}</div></button>`;
  });
  h += '</div>';
  // Atenção (todas as turmas)
  const al = [...dispAlerts(ts), ...ts.flatMap(tm => (tm.alunos || []).length ? alertsOf(tm, p).map(x => Object.assign(x, {tid:tm.id, txt:tm.nome + ': ' + x.txt})) : [])];
  if (al.length) h += `<div class="card alerts"><span class="eyebrow">Atenção</span>${al.slice(0, UI.allAlerts ? 99 : 5).map(x => `<button class="alrt ${x.k}" data-a="ini-alert" data-id="${esc(x.tid)}" data-k="${x.a || ''}" data-aid="${esc(x.aid || '')}"><span class="ai" aria-hidden="true">${x.k === 'bad' ? '!' : x.k === 'warn' ? '•' : 'i'}</span><span>${esc(x.txt)}</span></button>`).join('')}${al.length > 5 && !UI.allAlerts ? `<button class="link" style="align-self:flex-start" data-a="alerts-all">Ver mais ${al.length - 5}</button>` : ''}</div>`;
  // Dispensas em curso
  const ds = ts.flatMap(tm => (tm.alunos || []).map(a => ({tm, al:a, d:dispOn(a, today())})).filter(x => x.d && x.d.tipo !== 'Apenas registo'));
  if (ds.length) h += `<div class="sec-h"><h2>Dispensas em curso</h2></div><div class="list">${ds.map(({tm, al, d}) => `<button class="li" data-a="ini-aluno" data-id="${esc(tm.id)}" data-aid="${esc(al.id)}">${avatar(al)}<span class="who"><div class="nm">${esc(al.nome)}</div><div class="meta">${esc(tm.nome)} · ${esc(d.tipo)}${d.motivo ? ' · ' + esc(d.motivo) : ''}</div></span><span class="end muted small">${d.fim ? 'até ' + esc(fmtDate(d.fim, {day:'numeric', month:'short'})) : 'sem data de fim'}</span></button>`).join('')}</div>`;
  // Últimas aulas
  const ult = Object.values(S.aulas).sort((a, b) => b.data.localeCompare(a.data) || (b.c || 0) - (a.c || 0)).slice(0, 5);
  if (ult.length) h += `<div class="sec-h"><h2>Últimas aulas</h2></div><div class="list">${ult.map(a => { const tm = S.turmas[a.turmaId]; if (!tm) return ''; const f = Object.values(a.presencas || {}).filter(s => s === 'F').length; return `<button class="li" data-a="ini-aula" data-id="${esc(tm.id)}" data-aula="${esc(a.id)}"><span class="who"><div class="nm">${esc(tm.nome)} · ${esc(fmtDate(a.data))}</div><div class="meta">${esc((a.materias || []).join(', ') || 'Sem matérias')}${a.sumario ? ' · ' + esc(a.sumario.slice(0, 70)) : ''}</div></span><span class="end">${f ? `<span class="tag F">${f}F</span>` : ''}</span></button>`; }).join('')}</div>`;
  return h + '</div>';
}

