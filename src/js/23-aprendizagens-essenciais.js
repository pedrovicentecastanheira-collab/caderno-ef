/* ---------- Aprendizagens Essenciais de Educação Física (DGE, versão de março de 2026) ---------- */
// Fonte: documentos oficiais da DGE para o 5.º–9.º ano e 10.º–12.º ano. As tabelas de níveis de desempenho,
// as regras de seleção das matérias para a avaliação e as matérias mínimas a lecionar estão transcritas de lá.
const SUBN = {JOG:'Jogos', JDC:'Jogos Desportivos Coletivos', GIN:'Ginástica', ATL:'Atletismo', ARE:'Atividades Rítmicas Expressivas', PAT:'Patinagem', RAQ:'Raquetas', OUT:'Outras'};
const SUBD = {'Voleibol':'JDC', 'Basquetebol':'JDC', 'Andebol':'JDC', 'Futebol':'JDC', 'Softbol':'JDC', 'Ginástica de Solo':'GIN', 'Ginástica de Aparelhos (Trampolins)':'GIN', 'Ginástica Acrobática':'GIN', 'Atletismo':'ATL', 'Dança':'ARE', 'Danças Sociais':'ARE', 'Danças Tradicionais':'ARE', 'Patinagem':'PAT', 'Badminton':'RAQ', 'Ténis de Mesa':'RAQ', 'Judo/Luta':'OUT', 'Orientação':'OUT', 'Natação':'OUT', 'Jogos Tradicionais Populares':'OUT'};
// Subdomínio de uma matéria para a avaliação: até ao 9.º ano as Raquetas contam em "Outras"; no 5.º ano os Jogos Tradicionais contam em "Jogos".
function subOf(m, ano, lec) { let s = SUBD[m] || 'OUT'; if (s === 'RAQ' && ano < (lec ? 9 : 10)) s = 'OUT'; if (s === 'OUT' && m === 'Jogos Tradicionais Populares' && ano === 5) s = 'JOG'; return s; }
const AE_APF = 'Desenvolver capacidades motoras evidenciando aptidão aeróbia e aptidão neuromuscular, enquadradas na Zona Saudável de Aptidão Física do programa FITescola®, para a sua idade e sexo.';
const AE_CON_P = 'Identifica os conceitos em diferentes contextos.', AE_CON_E = 'Explica e aplica, com rigor e clareza, os conceitos em diferentes contextos.';
const SEL3 = {g:[[['JDC'], 2], [['GIN'], 1], [['ATL', 'ARE', 'PAT', 'OUT'], 3, true]], n:6, fb:['GIN', 'OUT'], txt:'2 matérias dos Jogos Desportivos Coletivos, 1 da Ginástica e 3 de subdomínios diferentes (Atletismo, ARE, Patinagem e Outras); na impossibilidade de avaliar algum subdomínio, mais uma da Ginástica ou de Outras.'};
const SELS = {g:[[['JDC'], 2], [['GIN'], 1], [['ARE'], 1], [['ATL', 'PAT', 'RAQ', 'OUT'], 2, true]], n:6, fb:['GIN', 'OUT'], txt:'2 matérias dos Jogos Desportivos Coletivos, 1 da Ginástica, 1 das ARE e 2 de subdomínios diferentes (Atletismo, Patinagem, Raquetas e Outras).'};
const SEL2 = n => ({distinct:true, n, fb:['GIN', 'OUT'], txt:`${n} matérias, todas de subdomínios diferentes; na impossibilidade de avaliar algum subdomínio, mais uma da Ginástica ou de Outras.`});
const AE = {
  5:{af:{p:[0, 3], e:[0, 5]}, sel:SEL2(5), lec:{JDC:2, JOG:1, GIN:1, ATL:1, ARE:1, PAT:1, OUT:1},
     con:['Identificar as capacidades físicas: resistência, força, velocidade, flexibilidade, agilidade e coordenação (geral), de acordo com as características do esforço realizado.']},
  6:{af:{p:[0, 4], e:[0, 6]}, sel:SEL2(6), lec:{JDC:2, GIN:2, ATL:1, ARE:1, PAT:1, OUT:1},
     con:['Identificar as capacidades físicas: resistência, força, velocidade, flexibilidade, agilidade e coordenação (geral), de acordo com as características do esforço realizado.', 'Interpretar as principais adaptações do funcionamento do seu organismo durante a atividade física.']},
  7:{af:{p:[0, 5], e:[1, 5]}, sel:SEL3, lec:{JDC:3, GIN:2, ATL:1, ARE:1, PAT:1, OUT:1},
     con:['Relacionar aptidão física e saúde e identificar os benefícios do exercício físico para a saúde: relaciona Aptidão Física e Saúde; identifica os fatores associados a um estilo de vida saudável; distingue o conceito de Desporto e de Educação Física.', 'Interpretar a dimensão sociocultural dos desportos na atualidade e ao longo dos tempos, nomeadamente os jogos olímpicos e paralímpicos.']},
  8:{af:{p:[0, 6], e:[2, 4]}, sel:SEL3, lec:{JDC:3, GIN:2, ATL:1, ARE:1, PAT:1, OUT:1},
     con:['Relacionar aptidão física e saúde e identificar os fatores associados a um estilo de vida saudável, nomeadamente o desenvolvimento das capacidades motoras.', 'Identificar e interpretar os valores olímpicos e paralímpicos, compreendendo a sua importância para a construção de uma sociedade moderna e inclusiva.']},
  9:{af:{p:[1, 5], e:[3, 3]}, top:'Avançado', sel:SEL3, lec:{JDC:3, GIN:2, ARE:2, ATL:1, PAT:1, RAQ:1, OUT:1},
     con:['Relacionar aptidão física e saúde e identificar os fatores associados a um estilo de vida saudável, nomeadamente o desenvolvimento das capacidades motoras, a composição corporal, a alimentação, o repouso, a higiene, afetividade e a qualidade do meio ambiente.', 'Interpretar a dimensão sociocultural dos desportos e da atividade física na atualidade e ao longo dos tempos, identificando fenómenos associados a limitações e possibilidades de prática dos desportos e das atividades físicas tais como: o sedentarismo e a evolução tecnológica, a poluição, o urbanismo e a industrialização, relacionando-os com a evolução das sociedades.']},
  10:{af:{p:[1, 5], e:[3, 3]}, top:'Avançado', sel:SELS, lec:{JDC:3, GIN:2, ARE:2, ATL:1, PAT:1, RAQ:1, OUT:1},
     con:['Relacionar a Aptidão Física e Saúde, identificando os fatores associados a um estilo de vida saudável, nomeadamente o desenvolvimento das capacidades motoras, a composição corporal, a alimentação, o repouso, a higiene, a afetividade e a qualidade do meio ambiente.', 'Interpretar a dimensão sociocultural dos desportos e da atividade física na atualidade e ao longo dos tempos, identificando fenómenos associados a limitações e possibilidades de prática dos desportos e das atividades físicas tais como: o sedentarismo e a evolução tecnológica, a poluição, o urbanismo e a industrialização, relacionando-os com a evolução das sociedades.', 'Realizar a prestação de socorro a uma vítima de paragem cardiorrespiratória, no contexto das atividades físicas ou outras, e interpretá-la como uma ação essencial, reveladora de responsabilidade individual e coletiva (cadeia de sobrevivência, exame primário da vítima, contacto com o 112, Suporte Básico de Vida e Desfibrilhação Automática Externa segundo o algoritmo do European Resuscitation Council, desobstrução da via aérea).']},
  11:{af:{p:[2, 4], e:[4, 2]}, sel:SELS,
     con:['Identificar os métodos e meios de treino mais adequados ao desenvolvimento ou manutenção das diversas capacidades motoras.', 'Conhecer e interpretar os fatores de saúde e risco associados à prática das atividades físicas utilizando esse conhecimento de modo a garantir a realização de atividade física em segurança, nomeadamente: dopagem e riscos de vida e/ou saúde; doenças e lesões; condições materiais, de equipamentos e de orientação do treino.']},
  12:{af:{p:[3, 3], e:[5, 1]}, sel:{g:[[['JDC'], 2], [['GIN', 'ATL'], 1], [['ARE'], 1], [['PAT', 'RAQ', 'OUT'], 2, true]], n:6, fb:['PAT', 'RAQ', 'OUT'], txt:'2 matérias dos Jogos Desportivos Coletivos, 1 da Ginástica ou do Atletismo, 1 das ARE e 2 de subdomínios diferentes (Patinagem, Raquetas e Outras); na impossibilidade de avaliar algum subdomínio obrigatório, uma outra matéria dos subdomínios opcionais.'},
     con:['Identificar e utilizar os métodos e meios de treino mais adequados ao desenvolvimento ou manutenção das diversas capacidades motoras, de acordo com a sua aptidão atual e o estilo de vida, cuidando o doseamento da intensidade e duração do esforço, respeitando em todas as situações os princípios básicos do treino.', 'Analisar criticamente aspetos gerais da ética na participação nas Atividades Físicas Desportivas, relacionando os interesses sociais, económicos, políticos e outros com algumas das suas “perversões”, nomeadamente: especialização precoce e exclusão ou abandono precoces; violência (dos espectadores e dos atletas) vs. espírito desportivo; corrupção vs. verdade desportiva.']}
};
const aeTop = A => A.top || 'Elevado';
const afTxt = ([e, i]) => (e ? `nível ELEMENTAR em ${e} ${e === 1 ? 'matéria' : 'matérias'} e ` : '') + `nível INTRODUÇÃO em ${i} ${i === 1 ? 'matéria' : 'matérias'}, de diferentes subdomínios`;
function guessAno(nome) { const m = /(\d{1,2})/.exec(String(nome || '')); const n = m ? +m[1] : 0; return n >= 1 && n <= 12 ? n : null; }
const anoOf = t => +t.ano || guessAno(t.nome);
function aeSelect(lv, ano) {
  const A = AE[ano], cand = Object.entries(lv).filter(([, l]) => l in LVP).map(([m, l]) => ({m, l, s:subOf(m, ano), p:LVP[l]})).sort((a, b) => b.p - a.p), sel = [];
  if (A.sel.distinct) { const used = new Set(); cand.forEach(c => { if (sel.length < A.sel.n && !used.has(c.s)) { sel.push(c); used.add(c.s); } }); }
  else { const gs = A.sel.g.map(([subs, n, dis]) => ({subs, n, dis, used:new Set(), k:0})); cand.forEach(c => { const g = gs.find(g => g.k < g.n && g.subs.includes(c.s) && !(g.dis && g.used.has(c.s))); if (g) { g.k++; g.used.add(c.s); sel.push(c); } }); }
  cand.forEach(c => { if (sel.length < A.sel.n && !sel.includes(c) && A.sel.fb.includes(c.s)) sel.push(c); });
  return sel.sort((a, b) => b.p - a.p);
}
// Situação do aluno face às AE do ano: 2 = Elevado/Avançado, 1 = Proficiente, 0 = não atinge, null = sem dados, 'na' = não aplicável.
function aeOf(t, al, p) {
  const ano = anoOf(t), A = AE[ano]; if (!A) return null;
  const lv = {}, z = {};
  for (let i = 1; i <= p; i++) {
    const v = avalOf(t.id, i);
    new Set([...Object.keys((v.af || {})[al.id] || {}), ...Object.keys(v.ind || {})]).forEach(m => { const x = lvOf(v, al.id, m); if (x && (!lv[m] || LVP[x.l] > LVP[lv[m]])) lv[m] = x.l; });
    const r = calc(t, i, al); FIT.forEach(f => { if (r.zones[f.k] != null) z[f.k] = r.zones[f.k]; });
  }
  const sel = aeSelect(lv, ano), nE = sel.filter(c => c.p >= LVP.E).length, nI = sel.filter(c => c.p >= LVP.I).length, ok = ([e, i]) => nE >= e && nI >= e + i;
  const aero = z.vaivem != null && z.vaivem >= 1, neuro = FIT.filter(f => f.k !== 'vaivem' && z[f.k] != null && z[f.k] >= 1).length;
  const con = calc(t, p, al).CON, cc = CFG.aeCon || [10, 14], R = REG[regAt(al, p)] || REG.Normal;
  return {ano, A, sel, lv, nE, nI, aero, neuro,
    af:!R.af ? 'na' : Object.keys(lv).length ? (ok(A.af.e) ? 2 : ok(A.af.p) ? 1 : 0) : null,
    apf:!R.apf ? 'na' : Object.keys(z).length ? (aero && neuro >= 4 ? 2 : aero && neuro >= 2 ? 1 : 0) : null,
    con:con == null ? null : con >= cc[1] ? 2 : con >= cc[0] ? 1 : 0};
}
const aeLbl = (ae, x) => x === 'na' ? 'Não aplicável' : x == null ? 'Sem dados' : x === 2 ? aeTop(ae.A) : x === 1 ? 'Proficiente' : 'Não atinge';
const aeShort = (ae, x) => x === 'na' ? 'n/a' : x == null ? '—' : x === 2 ? aeTop(ae.A)[0] : x === 1 ? 'P' : 'NA';
const aeCls = x => x === 2 ? 'ae2' : x === 1 ? 'ae1' : x === 0 ? 'ae0' : '';
function aeBox(t) {
  const ano = anoOf(t), A = AE[ano];
  if (!A) return `<p class="hint">Aprendizagens Essenciais: indique o ano de escolaridade da turma (5.º ao 12.º) em Mais → turma.</p>`;
  return `<div class="aebox"><b>Aprendizagens Essenciais · ${ano}.º ano</b> <span class="muted small">(DGE, março de 2026)</span>
    <div><span class="ae1 pill">Proficiente</span> ${esc(afTxt(A.af.p))}.</div><div><span class="ae2 pill">${esc(aeTop(A))}</span> ${esc(afTxt(A.af.e))}.</div>
    <div class="hint">Para a avaliação contam os melhores níveis: ${esc(A.sel.txt)}</div></div>`;
}

