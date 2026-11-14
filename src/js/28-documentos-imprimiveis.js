/* ---------- documentos imprimíveis ---------- */
function docHead(title, sub) { return `<header class="rel-h"><div><div class="rel-k">${esc(title)}</div><div class="rel-s">${esc(CFG.escola || 'Escola')} · Ano letivo ${esc(CFG.ano)}${sub ? ' · ' + esc(sub) : ''}</div></div><div class="rel-s">${esc(fmtDate(today(), {day:'numeric', month:'long', year:'numeric'}))}</div></header>`; }
function printDoc(label, html) {
  $('#print').innerHTML = `<div class="pbar noprint"><b>${esc(label)}</b><span class="sp"></span><button class="btn primary" data-a="print-go">${Store.mode === 'cloud' ? 'Descarregar para imprimir' : 'Imprimir / Guardar PDF'}</button><button class="btn" data-a="print-close">Fechar</button></div>` + html;
  document.body.classList.add('printing'); $('#print').scrollTop = 0;
}
// Critérios de avaliação de Educação Física (para alunos e encarregados de educação).
function criteriosHtml(t) {
  const ano = t ? anoOf(t) : null, A = AE[ano];
  let h = `<section class="rel">${docHead('Educação Física · Critérios de avaliação', t ? 'Turma ' + t.nome + (ano ? ' · ' + ano + '.º ano' : '') : '')}`;
  h += `<p>A avaliação em Educação Física tem como referência as <b>Aprendizagens Essenciais</b> (DGE) e os <b>Programas Nacionais de Educação Física</b>, e contribui para as áreas de competência do <b>Perfil dos Alunos à Saída da Escolaridade Obrigatória</b>. É contínua: a classificação de cada período tem em conta todo o trabalho realizado até esse momento.</p>`;
  h += `<h2>Domínios e ponderações</h2><table class="rel-t"><thead><tr><th class="l">Regime</th><th>Atividades físicas</th><th>Aptidão física</th><th>Conhecimentos</th><th>Atitudes e valores</th></tr></thead><tbody>${Object.entries(REG).map(([k, r]) => `<tr><td class="l"><b>${esc(k)}</b></td>${['af', 'apf', 'con', 'av'].map(x => `<td>${r[x] ? Math.round(r[x] * 100) + ' %' : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="rel-s">Áreas de competência do Perfil dos Alunos mobilizadas: Atividades físicas ${paTags('af')} · Aptidão física ${paTags('apf')} · Conhecimentos ${paTags('con')} · Atitudes ${paTags('resp')}${paTags('emp')}.</p>
    <p class="rel-s">Se a classificação de algum domínio aplicável for inferior a 10 valores, a classificação final do período não pode ser superior a 9 (não apto).</p>`;
  if (A) {
    h += `<h2>Aprendizagens Essenciais · ${ano}.º ano</h2><table class="rel-t"><thead><tr><th class="l">Domínio</th><th class="l">Proficiente</th><th class="l">${esc(aeTop(A))}</th></tr></thead><tbody>
      <tr><td class="l"><b>Atividades físicas</b></td><td class="l">Demonstra as competências de ${esc(afTxt(A.af.p))}.</td><td class="l">Demonstra as competências de ${esc(afTxt(A.af.e))}.</td></tr>
      <tr><td class="l"><b>Aptidão física</b></td><td class="l">Alcança a Zona Saudável do FITescola® em 1 teste de aptidão aeróbia e 2 testes de aptidão neuromuscular.</td><td class="l">Alcança a Zona Saudável do FITescola® em 1 teste de aptidão aeróbia e 4 testes de aptidão neuromuscular.</td></tr>
      <tr><td class="l"><b>Conhecimentos</b></td><td class="l">${AE_CON_P}</td><td class="l">${AE_CON_E}</td></tr></tbody></table>
      <p class="rel-s"><b>Matérias consideradas</b> (melhores níveis de cada aluno): ${esc(A.sel.txt)}</p>
      <p class="rel-s"><b>Conhecimentos do ${ano}.º ano:</b> ${A.con.map(esc).join(' ')}</p><p class="rel-s"><b>Aptidão física:</b> ${esc(AE_APF)}</p>`;
  }
  h += `<h2>Atividades físicas: níveis por matéria</h2><table class="rel-t"><thead><tr>${LV.map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody><tr>${LV.map(l => `<td>${LVP[l]}</td>`).join('')}</tr><tr>${LV.map(l => `<td class="small">${esc(LVN[l])}</td>`).join('')}</tr></tbody></table><p class="rel-s">A classificação das atividades físicas é a média dos níveis das matérias avaliadas no período. Os níveis Introdução (I), Elementar (E) e Avançado (A) seguem os descritivos dos programas; "parte do nível" (PI, PE, PA) significa cumprir pelo menos metade dos conteúdos desse nível. Quando a matéria é avaliada por indicadores, o nível resulta da média dos indicadores.</p>`;
  h += `<h2>Aptidão física (FITescola®)</h2><p class="rel-s">Cada teste é situado na Zona Saudável ou na Zona Atlética de acordo com a idade e o sexo (tabelas FITescola®). Pontos: ${FIT.map(f => `${esc(f.n)} ${f.pts.join('/')}`).join(' · ')} (fora da ZS / ZS / ZA). Classificação: soma dos pontos + 5, até 20.</p>`;
  h += `<h2>Atitudes e valores</h2><table class="rel-t"><thead><tr><th class="l">Critério (peso)</th>${[1, 2, 3, 4].map(n => `<th class="l">${n}</th>`).join('')}</tr></thead><tbody>${Object.keys(AVW).map(k => `<tr><td class="l"><b>${esc(AVN[k])}</b> (${AVW[k] * 100} %) ${paTags(k)}</td>${AVD[k].map(d => `<td class="l small">${esc(d)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="rel-s">Níveis 1 a 4 correspondem a ${AVS.map(x => String(x).replace('.', ',')).join(', ')} valores. A pontualidade e o material resultam dos registos das aulas.</p>`;
  const nv = CFG.niv || [4, 10, 14, 18];
  h += `<h2>Classificação final</h2><table class="rel-t"><thead><tr><th class="l">0–20 valores</th><th>0–${nv[0] - 1 < 0 ? 0 : String(nv[0]).replace('.', ',')}</th><th>${String(nv[0]).replace('.', ',')}–${String(nv[1]).replace('.', ',')}</th><th>${String(nv[1]).replace('.', ',')}–${String(nv[2]).replace('.', ',')}</th><th>${String(nv[2]).replace('.', ',')}–${String(nv[3]).replace('.', ',')}</th><th>${String(nv[3]).replace('.', ',')}–20</th></tr></thead><tbody><tr><td class="l">Nível (2.º e 3.º ciclos)</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr><tr><td class="l">Menção (1.º ciclo)</td><td colspan="2">Insuficiente</td><td>Suficiente</td><td>Bom</td><td>Muito Bom</td></tr></tbody></table><p class="rel-s">No ensino secundário a classificação é expressa de 0 a 20 valores. Os limites indicados são os aprovados pelo grupo de Educação Física.</p>`;
  h += `<h2>Perfil dos Alunos: áreas de competência</h2><p class="rel-s">${Object.entries(PA).map(([k, n]) => `<b>${k}</b> ${esc(n)}`).join(' · ')}</p>`;
  return h + `<div class="rel-sig"><div><span>O(A) professor(a)${CFG.prof ? ': ' + esc(CFG.prof) : ''}</span></div><div><span>Tomei conhecimento (Encarregado de Educação)</span></div></div></section>`;
}
// Síntese para o conselho de turma.
const MEDB = ['Diferenciação pedagógica em aula (tarefas ajustadas ao nível).', 'Tutoria entre pares em grupos heterogéneos.', 'Plano individual de melhoria da aptidão física.', 'Reforço da comunicação com o encarregado de educação.', 'Acompanhamento da assiduidade e da pontualidade.', 'Atividades de enriquecimento (Desporto Escolar).', 'Medidas universais de suporte à aprendizagem e à inclusão (Decreto-Lei n.º 54/2018).'];
function flagsOf(t, p, al) {
  const r = calc(t, p, al), ae = aeOf(t, al, p), out = [];
  if (r.c.F >= 3) out.push(r.c.F + ' faltas');
  if (r.EST === 'Não apto') out.push('Não apto');
  if (ae && ae.af === 0) out.push('AE: não atinge nas atividades físicas');
  if (ae && ae.apf === 0) out.push('AE: não atinge na aptidão física');
  if (p > 1) { const a = calc(t, p - 1, al).zones.vaivem, b = r.zones.vaivem; if (a != null && b != null && b < a) out.push('desceu de zona no vaivém'); }
  if (regAt(al, p) !== 'Normal') out.push(regAt(al, p));
  return out;
}
function conselhoHtml(t, p) {
  const als = alunosOf(t), rows = als.map(al => ({al, r:calc(t, p, al), ae:aeOf(t, al, p), fl:flagsOf(t, p, al)})), v = avalOf(t.id, p);
  const fins = rows.map(x => x.r.FIN).filter(x => x != null), media = fins.length ? fins.reduce((s, x) => s + x, 0) / fins.length : null;
  let h = `<section class="rel">${docHead('Educação Física · Síntese para o conselho de turma', 'Turma ' + t.nome + ' · ' + perLabel(p, true))}
    <div class="rel-as">${[['Alunos', rows.length], ['Aptos', rows.filter(x => x.r.EST === 'Apto').length], ['Não aptos', rows.filter(x => x.r.EST === 'Não apto').length], ['Média final', media == null ? '—' : nf(media)], ['Faltas', rows.reduce((s, x) => s + x.r.c.F, 0)]].map(([n, x]) => `<div><b>${x}</b><span>${n}</span></div>`).join('')}</div>`;
  if (rows[0] && rows[0].ae) { const A = rows[0].ae; h += `<h2>Aprendizagens Essenciais · ${A.ano}.º ano</h2><table class="rel-t"><thead><tr><th class="l">Domínio</th><th>Não atinge</th><th>Proficiente</th><th>${esc(aeTop(A.A))}</th><th>Sem dados</th></tr></thead><tbody>${[['Atividades físicas', 'af'], ['Aptidão física', 'apf'], ['Conhecimentos', 'con']].map(([n, k]) => `<tr><td class="l">${n}</td>${[0, 1, 2, null].map(x => `<td>${rows.filter(r => r.ae && r.ae[k] === x).length}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
  h += `<h2>Alunos</h2><table class="rel-t cons"><thead><tr><th>N.º</th><th class="l">Nome</th><th>F/A/M</th><th>Final</th>${t.ciclo !== 'S' ? `<th>${nivelLbl(t)}</th>` : ''}<th>AE (AF/Apt/Con)</th><th class="l">Situações a sinalizar</th><th class="l">Medidas propostas</th></tr></thead><tbody>${rows.map(({al, r, ae, fl}) => `<tr><td>${esc(al.num ?? '')}</td><td class="l">${esc(al.nome)}</td><td>${r.c.F}/${r.c.A}/${r.c.M}</td><td><b>${r.FIN ?? '—'}</b></td>${t.ciclo !== 'S' ? `<td>${esc(nivel(t, r.FIN) ?? '—')}</td>` : ''}<td>${ae ? [ae.af, ae.apf, ae.con].map(x => aeShort(ae, x)).join(' / ') : '—'}</td><td class="l small">${esc(fl.join('; '))}</td><td class="l small">${esc((v.med || {})[al.id] || '')}</td></tr>`).join('')}</tbody></table>
    <p class="rel-s">AE: P = Proficiente, ${rows[0] && rows[0].ae ? esc(aeTop(rows[0].ae.A)[0] + ' = ' + aeTop(rows[0].ae.A)) : 'E = Elevado'}, NA = não atinge, — = sem dados. F/A/M = faltas, atrasos e aulas sem material no período.</p>`;
  return h + `<div class="rel-sig"><div><span>O(A) professor(a)${CFG.prof ? ': ' + esc(CFG.prof) : ''}</span></div><div><span>Data</span></div></div></section>`;
}
function sheetConselho() {
  const t = turma(), p = UI.p, v = avalOf(t.id, p), als = alunosOf(t), fl = als.map(al => ({al, f:flagsOf(t, p, al)})), sh = UI.consAll ? fl : fl.filter(x => x.f.length);
  openSheet('Conselho de turma · ' + perLabel(p), `<div class="form"><p class="hint">Situações detetadas automaticamente e medidas propostas para cada aluno. Toque numa sugestão para a acrescentar.</p>
    <label class="pin"><input type="checkbox" data-in="cons-all"${UI.consAll ? ' checked' : ''}> Mostrar todos os alunos (${als.length}); sinalizados: ${fl.filter(x => x.f.length).length}</label>
    ${sh.map(({al, f}) => `<div class="card cons-a"><div class="ev-h">${avatar(al, 'sm')}<span class="nm"><b>${esc(al.nome)}</b></span></div>${f.length ? `<p class="small" style="margin:6px 0;color:var(--bad)">${esc(f.join(' · '))}</p>` : ''}<textarea data-in="med" data-aid="${esc(al.id)}" placeholder="Medidas propostas" style="min-height:64px">${esc((v.med || {})[al.id] || '')}</textarea><div class="chips">${MEDB.map((m, i) => `<button class="chip" data-a="med-add" data-aid="${esc(al.id)}" data-i="${i}">${esc(m.replace(/\s*\(.*\)\.?$/, '').replace(/\.$/, ''))}</button>`).join('')}</div></div>`).join('') || '<p class="muted">Nenhum aluno sinalizado neste período.</p>'}</div>`,
    `<button class="btn primary" data-a="doc-cons">Imprimir síntese</button>`);
}
// Planificação anual da turma, com verificação das matérias mínimas das AE.
function planHtml(t) {
  const ano = anoOf(t), A = AE[ano], ps = CFG.per.slice(0, CFG.nper).map((_, i) => i + 1);
  let h = `<section class="rel">${docHead('Educação Física · Planificação anual', 'Turma ' + t.nome + (ano ? ' · ' + ano + '.º ano' : ''))}`;
  h += `<table class="rel-t"><thead><tr><th class="l">Período</th><th class="l">Unidade didática (matéria)</th><th class="l">Subdomínio</th><th>Aulas previstas</th><th>Aulas dadas</th></tr></thead><tbody>${ps.map(p => { const pl = planOf(t, p); return pl.length ? pl.map((u, i) => `<tr>${i ? '' : `<td class="l" rowspan="${pl.length}"><b>${esc(perLabel(p, true))}</b><br><span class="rel-s">${esc(fmtDate(CFG.per[p - 1].ini, {day:'numeric', month:'short'}))} – ${esc(fmtDate(CFG.per[p - 1].fim, {day:'numeric', month:'short'}))}</span></td>`}<td class="l">${esc(u.m)}</td><td class="l">${esc(SUBN[subOf(u.m, ano || 7, true)])}</td><td>${u.n}</td><td>${dadasOf(t, p, u.m)}</td></tr>`).join('') : `<tr><td class="l"><b>${esc(perLabel(p, true))}</b></td><td class="l rel-s" colspan="4">Sem unidades planeadas.</td></tr>`; }).join('')}</tbody></table>`;
  const prev = ps.reduce((s, p) => s + planOf(t, p).reduce((a, u) => a + u.n, 0), 0); h += `<p class="rel-s">Total: ${prev} aulas previstas.</p>`;
  if (A && A.lec) {
    const ms = [...new Set(ps.flatMap(p => planOf(t, p).map(u => u.m)))], cnt = {}; ms.forEach(m => { const s = subOf(m, ano, true); cnt[s] = (cnt[s] || 0) + 1; });
    h += `<h2>Matérias mínimas a lecionar no ${ano}.º ano (Aprendizagens Essenciais)</h2><table class="rel-t"><thead><tr><th class="l">Subdomínio</th><th>Mínimo</th><th>Planeado</th><th>Situação</th></tr></thead><tbody>${Object.entries(A.lec).map(([s, n]) => `<tr><td class="l">${esc(SUBN[s])}</td><td>${n}</td><td>${cnt[s] || 0}</td><td>${(cnt[s] || 0) >= n ? '✓ Cumpre' : '⚠ Em falta ' + (n - (cnt[s] || 0))}</td></tr>`).join('')}</tbody></table><p class="rel-s">Quando não for possível lecionar algum subdomínio, as AE preveem mais uma matéria da Ginástica ou de Outras. Deve ser garantida a lecionação de todas as matérias nucleares ao longo do ciclo.</p>`;
  }
  if (A) h += `<h2>Metas do ${ano}.º ano</h2><p class="rel-s"><b>Atividades físicas:</b> proficiente com ${esc(afTxt(A.af.p))}; ${esc(aeTop(A).toLowerCase())} com ${esc(afTxt(A.af.e))}.</p><p class="rel-s"><b>Aptidão física:</b> ${esc(AE_APF)}</p><p class="rel-s"><b>Conhecimentos:</b> ${A.con.map(esc).join(' ')}</p>`;
  return h + `<div class="rel-sig"><div><span>O(A) professor(a)${CFG.prof ? ': ' + esc(CFG.prof) : ''}</span></div><div><span>Data</span></div></div></section>`;
}
function vDocs(t) {
  const als = alunosOf(t);
  return `<div class="docs">${[
    ['doc-rel-all', 'Relatórios individuais', `Um por aluno: classificação, o que domina e onde melhorar, Aprendizagens Essenciais, FITescola, atitudes, assiduidade, evolução, autoavaliação e observações (${als.length} alunos).`],
    ['doc-crit', 'Critérios de avaliação', 'Para entregar a alunos e encarregados de educação: domínios, ponderações, Aprendizagens Essenciais do ano, níveis, atitudes e conversão em níveis 1–5.'],
    ['cons-open', 'Conselho de turma', 'Síntese da turma com situações sinalizadas automaticamente e as medidas propostas para cada aluno.'],
    ['doc-des', 'Cartões de desafio', 'Um cartão por aluno com o próximo desafio em cada matéria, escrito para o aluno: a competência que lhe falta.'],
    ['doc-plan', 'Planificação anual', 'Unidades didáticas por período e verificação das matérias mínimas das Aprendizagens Essenciais.'],
    ['modo-aluno', 'Modo aluno', 'Autoavaliação e coavaliação por competência e questionários de conhecimentos: passa o telemóvel ou o tablet aos alunos, sem mostrar notas.'],
    ['auto-first', 'Autoavaliação dos alunos', 'Cada aluno avalia-se no telemóvel do professor, aluno a aluno; a comparação com a avaliação do professor entra no relatório.']
  ].map(([a, n, d]) => `<button class="card doc" data-a="${a}"><b>${n}</b><span class="hint">${d}</span></button>`).join('')}</div>${CFG.escola ? '' : '<p class="hint">Indique o nome da escola e do professor em Mais → Escola e relatórios: aparecem no cabeçalho dos documentos.</p>'}
  <div class="sec-h"><h2>Relatório de um aluno</h2></div><div class="list">${als.map(al => { const r = calc(t, UI.p, al), au = (avalOf(t.id, UI.p).auto || {})[al.id]; return `<button class="li" data-a="rel-one" data-id="${esc(al.id)}"><span class="n">${esc(al.num ?? '')}</span>${avatar(al)}<span class="who"><div class="nm">${esc(al.nome)}</div><div class="meta">Final ${r.FIN ?? '—'} · ${esc(r.EST)}${(avalOf(t.id, UI.p).obs || {})[al.id] ? ' · observação' : ''}${au ? ' · autoavaliação' : ''}</div></span><span class="end muted">Relatório ›</span></button>`; }).join('')}</div>`;
}

