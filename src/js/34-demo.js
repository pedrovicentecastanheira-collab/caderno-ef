/* ---------- demo ---------- */
function makeDemo() {
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const nomes = [['Alice Ferreira','F','2013-03-14'],['Bernardo Lopes','M','2013-06-02'],['Carolina Matos','F','2012-11-21'],['Diogo Antunes','M','2013-01-09'],['Eva Rodrigues','F','2013-08-30'],['Francisco Pires','M','2013-04-17'],['Gabriela Nunes','F','2013-10-05'],['Henrique Sá','M','2012-12-12'],['Inês Carvalho','F','2013-02-27'],['João Teixeira','M','2013-09-19'],['Leonor Batista','F','2013-05-08'],['Martim Gomes','M','2013-07-23'],['Matilde Fonseca','F','2013-11-30'],['Rodrigo Vieira','M','2013-03-03']];
  const t = {id: uid(), nome: 'Exemplo 7.º X', ciclo: '3', ano: 7, escala: '0-20', exemplo: true, alunos: nomes.map(([nome, sexo, nasc], i) => ({id: uid(), num: i + 1, nome, sexo, nasc, regime: i === 6 ? 'Dispensa Parcial 1' : 'Normal', obs: i === 6 ? 'Exemplo: atestado médico (joelho) até dezembro.' : ''}))};
  S.turmas[t.id] = t; Store.save('turmas', t);
  const plan = [['2026-09-16',['Voleibol'],'Apresentação. Normas de funcionamento das aulas. Voleibol: toque de dedos em situação de exercício a pares.'],['2026-09-18',['Voleibol'],'Voleibol: toque de dedos e manchete. Jogo 2x2 em campo reduzido.'],['2026-09-23',['Atletismo'],'Aptidão física: aplicação do teste do vaivém (FITescola).'],['2026-09-25',['Voleibol'],'Voleibol: serviço por baixo. Jogo 2x2.'],['2026-09-30',['Ginástica de Solo'],'Ginástica de solo: rolamento à frente e à retaguarda. Testes de abdominais e flexões.'],['2026-10-02',['Ginástica de Solo'],'Ginástica de solo: apoio facial invertido. Sequência gímnica simples.'],['2026-10-07',['Voleibol'],'Voleibol: jogo 4x4. Avaliação formativa.'],['2026-10-09',['Ginástica de Solo','Voleibol'],'Ginástica de solo: roda. Voleibol: jogo 4x4.'],['2026-10-14',['Atletismo'],'Atletismo: corrida de velocidade, partida baixa. Teste senta e alcança.'],['2026-10-16',['Atletismo'],'Atletismo: salto em comprimento, chamada e impulsão.']];
  plan.forEach(([data, materias, sumario], i) => {
    const pres = {}; t.alunos.forEach(al => { const x = rnd(); pres[al.id] = al.regime !== 'Normal' && i < 8 ? 'D' : x < .05 ? 'F' : x < .1 ? 'A' : x < .16 ? 'M' : 'P'; });
    const a = {id: uid(), turmaId: t.id, data, c: i, materias, sumario, presencas: pres}; S.aulas[a.id] = a; Store.save('aulas', a);
  });
  const v = {id: t.id + '_1', turmaId: t.id, p: 1, materias: [], af: {}, fit: {}, con: {}, av: {}};
  t.alunos.forEach((al, i) => {
    v.af[al.id] = {'Voleibol': LV[1 + Math.floor(rnd() * 5)], 'Ginástica de Solo': LV[Math.floor(rnd() * 6)]};
    const m = al.sexo === 'M'; v.fit[al.id] = {vaivem: Math.round((m ? 22 : 18) + rnd() * 40), abd: Math.round((m ? 15 : 12) + rnd() * 45), ombros: rnd() < .8 ? 'S' : 'N', senta: Math.round(16 + rnd() * 16)};
    if (i % 3) v.con[al.id] = Math.round(8 + rnd() * 11);
    if (i % 4 !== 3) v.av[al.id] = {resp: 1 + Math.floor(rnd() * 3), emp: 1 + Math.floor(rnd() * 3), lid: Math.floor(rnd() * 4)};
  });
  S.aval[v.id] = v; Store.save('aval', v);
  UI.turma = t.id; UI.p = 1; UI.tab = 'aulas'; render(); toast('Turma de exemplo criada (alunos fictícios).');
}

