/* ---------- banco de sumários e de observações ---------- */
const SUMB = {
  'Voleibol':['Voleibol: toque de dedos e manchete em situação de exercício a pares.', 'Voleibol: serviço por baixo e receção em manchete; jogo 2x2 em campo reduzido.', 'Voleibol: jogo 4x4 com rotação; ocupação do espaço e cobertura.', 'Voleibol: remate em apoio e em salto após passe alto.'],
  'Basquetebol':['Basquetebol: drible de progressão e mudanças de direção.', 'Basquetebol: passe e corte; lançamento na passada.', 'Basquetebol: jogo 3x3 em meio campo; desmarcação e defesa individual.', 'Basquetebol: contra-ataque e ressalto; jogo 5x5.'],
  'Andebol':['Andebol: passe e receção em deslocamento; remate em apoio.', 'Andebol: remate em salto junto à área; ação do guarda-redes.', 'Andebol: jogo 5x5; contra-ataque e defesa individual.', 'Andebol: desmarcação e criação de linhas de passe em jogo reduzido.'],
  'Futebol':['Futebol: receção, condução e passe em situação de exercício.', 'Futebol: remate e finta; jogo 4x4 com guarda-redes.', 'Futebol: desmarcação, largura e profundidade; jogo 5x5.', 'Futebol: marcação e recuperação da posse; jogo 7x7.'],
  'Ginástica de Solo':['Ginástica de solo: cambalhota à frente e à retaguarda.', 'Ginástica de solo: apoio facial invertido e roda.', 'Ginástica de solo: avião, ponte e elementos de ligação.', 'Ginástica de solo: construção e apresentação de uma sequência gímnica.'],
  'Ginástica de Aparelhos (Trampolins)':['Ginástica de aparelhos: salto em extensão e engrupado no mini-trampolim.', 'Ginástica de aparelhos: salto de eixo e entre-mãos no boque/plinto.', 'Ginástica de aparelhos: corrida de balanço, chamada e receção em segurança.'],
  'Ginástica Acrobática':['Ginástica acrobática: pegas, montes e desmontes em segurança.', 'Ginástica acrobática: figuras a pares e em trio; funções de base e volante.', 'Ginástica acrobática: construção de uma coreografia com música.'],
  'Atletismo':['Atletismo: corrida de velocidade; partida de pé e de tacos.', 'Atletismo: salto em altura (técnica de tesoura/Fosbury Flop).', 'Atletismo: salto em comprimento; corrida de balanço, chamada e impulsão.', 'Atletismo: lançamento do peso; corrida de estafetas.'],
  'Dança':['Dança: exploração do espaço e do ritmo; sequências de movimento.', 'Dança: criação de uma pequena coreografia em grupo.'],
  'Danças Sociais':['Danças sociais: posição fechada e aberta; condução e seguimento.', 'Danças sociais: passo básico de merengue e rumba quadrada.', 'Danças sociais: valsa lenta e foxtrot; alinhamento e progressão.'],
  'Danças Tradicionais':['Danças tradicionais: passos base e formações em roda.', 'Danças tradicionais: aprendizagem de uma dança regional e do seu contexto cultural.'],
  'Badminton':['Badminton: pega, posição base e clear.', 'Badminton: serviço curto e comprido; lob e amorti.', 'Badminton: jogo de singulares; deslocamentos e recuperação da posição base.'],
  'Ténis de Mesa':['Ténis de mesa: pega e batimentos de direita e de esquerda.', 'Ténis de mesa: serviço curto e comprido; jogo de singulares.'],
  'Judo/Luta':['Luta: quedas e regras de segurança; luta no solo.', 'Judo: pegas, desequilíbrios e projeções simples.'],
  'Patinagem':['Patinagem: posição base, deslize e travagem em T.', 'Patinagem: curvas, deslize para trás e meia volta.', 'Patinagem: percurso com obstáculos e composição a pares.'],
  'Natação':['Natação: respiração, flutuação e deslize.', 'Natação: crawl e costas; coordenação de braços, pernas e respiração.'],
  'Orientação':['Orientação: leitura do mapa e orientação do mapa com bússola.', 'Orientação: percurso no espaço escolar com cartão de controlo.'],
  'Softbol':['Softbol: receção com luva e lançamento por cima do ombro.', 'Softbol: batimento e corrida entre bases; jogo reduzido.'],
  'Jogos Tradicionais Populares':['Jogos tradicionais: aprendizagem e prática de jogos regionais e do seu contexto.']
};
const SUMG = ['Aquecimento geral e específico.', 'Avaliação inicial.', 'Avaliação formativa.', 'Condição física: resistência aeróbia.', 'Condição física: força (circuito de estações).', 'Condição física: flexibilidade e retorno à calma.', 'FITescola: aplicação do teste do vaivém.', 'FITescola: abdominais, flexões de braços e senta e alcança.', 'Conhecimentos: aptidão física e saúde.'];
const OBSB = ['Revela empenho e persistência nas tarefas propostas.', 'Coopera com os colegas e respeita as regras.', 'Deve ser mais pontual e assíduo(a).', 'Deve trazer sempre o material adequado à prática.', 'Deve melhorar a concentração e o cumprimento das regras de segurança.', 'Ajuda os colegas e assume a liderança quando solicitado.', 'Deve praticar atividade física regular fora da escola.', 'Evoluiu de forma consistente ao longo do período.'];
const CAPN = {vaivem:'a resistência aeróbia (vaivém)', abd:'a força abdominal', flex:'a força dos membros superiores', senta:'a flexibilidade dos membros inferiores', ombros:'a flexibilidade dos ombros', imp:'a força explosiva dos membros inferiores', vel:'a velocidade', agil:'a agilidade'};
const lista = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1];
// Rascunho de observação a partir dos dados do aluno; o professor revê e ajusta.
function obsSugest(t, p, al) {
  const r = calc(t, p, al), f = al.sexo === 'F', o = [];
  if (r.EST === 'Apto') o.push(r.FIN >= 14 ? 'Revela um muito bom desempenho em Educação Física.' : 'Revela um desempenho satisfatório em Educação Física.');
  else if (r.EST === 'Não apto') o.push('Ainda não atinge os objetivos essenciais da disciplina.');
  const lv = Object.entries(r.lv), forte = lv.filter(([, l]) => LVP[l] >= LVP.E).map(([m]) => m), fraco = lv.filter(([, l]) => LVP[l] < LVP.I).map(([m]) => m);
  if (forte.length) o.push(`Destaca-se em ${lista(forte)}.`);
  if (fraco.length) o.push(`Deve melhorar em ${lista(fraco)}, onde ainda não atinge o nível Introdução.`);
  const fz = FIT.filter(x => r.zones[x.k] === 0).map(x => CAPN[x.k]); if (fz.length) o.push(`Na aptidão física, deve melhorar ${lista(fz)}.`);
  if (r.c.F >= 3) o.push(`Deve ser mais assídu${f ? 'a' : 'o'}.`); else if (r.ix.pont != null && r.ix.pont <= 1) o.push('Deve ser mais pontual.');
  if (r.ix.mat != null && r.ix.mat <= 1) o.push('Deve trazer sempre o material adequado à prática.');
  if (r.ix.emp != null && r.ix.emp <= 1) o.push('Deve empenhar-se mais e persistir perante as dificuldades.');
  if (r.ix.resp != null && r.ix.resp <= 1) o.push('Deve respeitar mais os colegas e os materiais.');
  if (r.ix.lid === 3) o.push('É um exemplo para os colegas, ajudando e tomando a iniciativa.');
  return o.join(' ');
}

