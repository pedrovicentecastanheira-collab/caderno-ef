/* ---------- banco de exercícios ---------- */
// Exercícios de base por matéria e nível (I = Introdução, E = Elementar, A = Avançado). O professor junta os seus,
// que ficam em CFG.exs e entram também na partilha com o grupo. Cada exercício tem nome, organização e critérios de êxito.
const EXB = {
  'Voleibol':[
    ['I', 'Toque de dedos a pares', 'A pares, 3 m de distância, bola afável. Lança-se a bola e o colega devolve em toque de dedos; depois sequências contínuas.', 'Mãos em concha acima da testa; pernas fletidas antes do contacto; extensão de braços e pernas.'],
    ['I', 'Manchete em sequência', 'A pares: um lança baixo, o outro devolve em manchete para as mãos do lançador. 10 repetições e troca.', 'Braços estendidos e unidos; contacto nos antebraços; desloca-se para ficar atrás da bola.'],
    ['I', 'Serviço por baixo ao alvo', 'Serviço por baixo a 3–4,5 m da rede, para meio-campo indicado (arcos no chão como alvos).', 'Pé contrário à mão que bate à frente; bola largada à frente; braço em pêndulo.'],
    ['I', 'Jogo 2x2 em campo reduzido', 'Campo 6 m x 3 m, rede a 2 m, bola afável. Obrigatório passar ao companheiro antes de enviar.', 'Chama a bola; posiciona-se debaixo da trajetória; envia para zona livre.'],
    ['E', 'Jogo 4x4 com rotação', 'Campo 12 m x 6 m. Serviço por baixo ou por cima; 3 toques por equipa; rotação a cada serviço ganho.', 'Receção dirigida ao passador; passe alto para a frente; ocupação equilibrada do campo.'],
    ['E', 'Remate em apoio após passe', 'Em coluna junto à zona 4: o passador coloca a bola alta e o atacante remata em apoio para o meio-campo contrário.', 'Chamada a dois pés; armação do braço; batimento no ponto mais alto.'],
    ['E', 'Defesa baixa de remate', 'Um atacante remata de cima de um banco; dois defensores em posição baixa defendem em manchete para o alvo.', 'Posição baixa e equilibrada; braços orientados para o alvo; sem balanço de braços.'],
    ['A', 'Jogo 6x6 com sistema 3:3', 'Jogo formal com passador definido. Distribuição para o atacante de zona 2 ou 4 e bloco individual.', 'Receção a 2–3 m da rede; bloco no tempo do remate; cobertura ao atacante.']],
  'Basquetebol':[
    ['I', 'Drible com mudança de mão', 'Percurso de cones em ziguezague; drible de progressão e de proteção, mudando de mão em cada cone.', 'Bola ao lado e à frente; olhar levantado; mão do lado contrário ao defensor.'],
    ['I', 'Passe e corte', 'Grupos de 3: passa de peito ou picado e corta para o cesto para receber de novo.', 'Passe tenso à altura do peito; corte com mudança de ritmo; mãos-alvo para receber.'],
    ['I', 'Lançamento na passada', 'Em duas colunas: drible, dois apoios e lançamento na passada, com ressalto e passe à coluna seguinte.', 'Ritmo direita-esquerda (mão direita); impulsão vertical; tabela no quadrado.'],
    ['I', 'Jogo 3x3 a meio-campo', 'Meio-campo, um cesto. Sem drible na primeira posse; recupera-se a bola atrás da linha de 3 pontos.', 'Ocupa espaços livres; passa e desmarca-se; defesa individual.'],
    ['E', 'Passe e vai com bloqueio direto', '3x3: o portador passa e vai bloquear o defensor do colega com bola, que ataca o cesto.', 'Bloqueio parado, de frente; uso do bloqueio pelo lado certo; rolar para o cesto.'],
    ['E', 'Contra-ataque 3x2', 'Após ressalto defensivo, saída rápida em 3 corredores contra 2 defensores recuados.', 'Bola no corredor central; ocupação dos corredores laterais; finalização em vantagem.'],
    ['E', 'Lançamento em suspensão', 'Receção a 3–4 m do cesto, enquadramento e lançamento em suspensão. 5 posições.', 'Pés alinhados com o cesto; extensão completa; flexão do pulso no final.'],
    ['A', 'Jogo 5x5 com defesa à zona', 'Jogo formal; a defesa alterna entre individual e zona 2:3 a cada 3 minutos.', 'Circulação rápida da bola; ataque aos espaços entre defensores; ressalto ofensivo.']],
  'Andebol':[
    ['I', 'Passe e receção em deslocamento', 'Em trios, ao longo do campo, passe de ombro em corrida, sem drible.', 'Braço armado atrás; receção com as duas mãos; passa para a frente do colega.'],
    ['I', 'Remate em salto', 'Em coluna: receção, três apoios e remate em salto na zona dos 9 m sobre o guarda-redes.', 'Impulsão no pé contrário ao braço que remata; remate no ponto alto; para os cantos.'],
    ['I', 'Jogo 4x4 sem drible', 'Meio-campo com balizas reduzidas e área. Obrigatório 3 passes antes de rematar.', 'Desmarcação para a frente; defesa entre o adversário e a baliza; respeito pela área.'],
    ['E', 'Penetração e passe ao pivot', '3x2 frente à área: o lateral penetra, fixa o defensor e passa ao pivot ou à ponta.', 'Fixação do defensor antes de passar; pivot de costas para a baliza; remate da ponta em ângulo.'],
    ['E', 'Defesa 6:0 com deslocamentos', 'Seis defensores na linha dos 6 m; deslocam-se lateralmente acompanhando a circulação da bola.', 'Saída ao portador; cobertura ao colega; braços altos no remate.'],
    ['A', 'Jogo 7x7 com contra-ataque', 'Jogo formal; um golo de contra-ataque vale dois.', 'Saída rápida do guarda-redes; ocupação dos corredores; transição defensiva.']],
  'Futebol':[
    ['I', 'Condução e passe', 'Percurso de cones em condução com as duas faces do pé, terminando num passe para um alvo a 8 m.', 'Bola perto do pé; olhar levantado; passe com a parte interna do pé.'],
    ['I', 'Receção orientada a pares', 'A pares a 10 m: recebe com a parte interna orientando a bola para o lado e devolve.', 'Amortece a bola; orienta para o espaço livre; passa com o pé de apoio ao lado da bola.'],
    ['I', 'Jogo 4x4 em campo reduzido', 'Campo 30 m x 20 m, balizas pequenas, sem guarda-redes.', 'Ocupa espaços livres; passa ao colega desmarcado; recupera a posição defensiva.'],
    ['E', 'Remate após combinação', 'Tabela com um apoio à entrada da área e remate à baliza com guarda-redes.', 'Passe tenso para o apoio; desmarcação em profundidade; remate de peito do pé.'],
    ['E', 'Jogo 5x5 com três zonas', 'Campo dividido em defesa, meio-campo e ataque; obrigatório a bola passar pelas três zonas.', 'Largura e profundidade no ataque; contenção e cobertura na defesa.'],
    ['A', 'Jogo 7x7 com pressing', 'Jogo formal; a equipa que recupera a bola no meio-campo contrário ganha um ponto extra.', 'Pressão ao portador; fecho das linhas de passe; transição rápida.']],
  'Futsal':[
    ['I', 'Condução com a sola', 'Condução em espaço reduzido com a sola do pé, mudando de direção a cada sinal.', 'Bola sempre controlada; corpo entre o adversário e a bola.'],
    ['I', 'Jogo 3x3 com guarda-redes', 'Meio-campo de futsal, balizas oficiais. O guarda-redes repõe com as mãos.', 'Passe rasteiro; desmarcação após passar; defesa ao portador.'],
    ['E', 'Rotações em 4x0', 'Quatro jogadores em losango: passa e troca de posição com o colega do lado.', 'Ocupação dos quatro vértices; passe ao pé de apoio; comunicação.'],
    ['E', 'Jogo 5x5 com regra de 4 segundos', 'Jogo formal; cada jogador só pode ter a bola 4 segundos.', 'Apoios próximos do portador; jogo rápido; pressão alta.']],
  'Ginástica de Solo':[
    ['I', 'Rolamento à frente engrupado', 'Em colchão inclinado e depois plano: rolamento à frente terminando de pé, sem apoio das mãos.', 'Queixo ao peito; apoio da nuca; pernas fletidas junto ao peito.'],
    ['I', 'Rolamento à retaguarda', 'Em colchão inclinado: rolamento à retaguarda com repulsão dos braços, terminando de pé.', 'Mãos junto às orelhas; corpo engrupado; repulsão no final.'],
    ['I', 'Apoio facial invertido com ajuda', 'Contra a parede ou com ajuda de dois colegas: apoio facial invertido, com regresso controlado.', 'Mãos à largura dos ombros; braços estendidos; olhar entre as mãos.'],
    ['E', 'Roda', 'Com linha no chão: roda com apoio sucessivo das mãos e dos pés na mesma linha.', 'Braços e pernas estendidos; passagem pela vertical; saída de frente para a linha.'],
    ['E', 'Sequência de solo', 'Sequência de 5–6 elementos com ligação: rolamentos, roda, avião, salto de gato e posição de equilíbrio.', 'Ligação sem paragens; amplitude; postura de início e final.'],
    ['A', 'Rodada', 'Com ajuda: corrida, chamada, rodada e salto em extensão a seguir.', 'Quarto de volta antes da vertical; pés juntos na receção; repulsão dos braços.']],
  'Ginástica de Aparelhos (Trampolins)':[
    ['I', 'Salto em extensão no minitrampolim', 'Corrida de balanço, chamada a pés juntos e salto em extensão com receção no colchão.', 'Chamada a dois pés no centro; corpo estendido no ar; receção equilibrada.'],
    ['I', 'Salto engrupado', 'Igual ao anterior, juntando os joelhos ao peito no ponto mais alto.', 'Agrupar no ponto alto; estender antes da receção.'],
    ['E', 'Salto de carpa', 'Minitrampolim: salto com pernas estendidas e afastadas (carpa afastada) e receção em pé.', 'Pernas estendidas à horizontal; mãos tocam os pés; tronco direito na receção.'],
    ['E', 'Salto ao eixo no boque', 'Boque transversal: corrida, chamada no trampolim, apoio das mãos e salto ao eixo.', 'Apoio das mãos à frente; afastamento das pernas; ajuda à frente do aparelho.']],
  'Ginástica Acrobática':[
    ['I', 'Figuras a pares', 'A pares: três figuras estáticas (base e volante), mantidas 3 segundos.', 'Base estável com costas direitas; montagem e desmontagem seguras.'],
    ['E', 'Esquema de trios', 'Trios: esquema com 3 figuras, ligações coreográficas e música.', 'Sincronia; figuras mantidas 3 s; ajuda nas montagens.']],
  'Ginástica Rítmica':[
    ['I', 'Manipulação da bola', 'Lançamentos e receções, rolamentos no chão e sobre o corpo, ao ritmo da música.', 'Bola na palma da mão; braços estendidos; sem agarrar com os dedos.'],
    ['I', 'Corda: saltos e balanços', 'Saltos a pés juntos e alternados com a corda, balanços e círculos.', 'Corda segura pelas pontas; saltos ritmados; braços afastados do corpo.'],
    ['E', 'Sequência com aparelho', 'Sequência individual de 45 s com aparelho à escolha, ligando saltos, voltas e equilíbrios.', 'Aparelho em movimento contínuo; amplitude; relação com a música.']],
  'Atletismo':[
    ['I', 'Partida de pé e corrida de velocidade', 'Corridas de 30–40 m a partir de partida de pé, a pares.', 'Inclinação à frente; braços fletidos a 90°; elevação dos joelhos.'],
    ['I', 'Estafetas com testemunho', 'Estafetas 4 x 50 m com zona de transmissão marcada.', 'Recetor parte na marca; transmissão sem olhar para trás; manter a pista.'],
    ['I', 'Salto em comprimento: chamada', 'Corrida de 7 passadas e chamada numa zona de 1 m, com receção na caixa de areia.', 'Chamada com um pé; elevação do joelho livre; receção a dois pés.'],
    ['E', 'Barreiras baixas', 'Corrida com 4 barreiras baixas a 7 m, com 3 passadas entre barreiras.', 'Ataque à barreira com a perna estendida; passagem rasante; ritmo de 3 apoios.'],
    ['E', 'Lançamento do peso', 'Lançamento do peso de 2–3 kg sem deslocamento e depois com deslizamento.', 'Peso junto ao pescoço; extensão da perna de trás; braço empurra, não lança.'],
    ['A', 'Salto em altura (Fosbury)', 'Corrida em curva de 5 passadas e transposição dorsal da fasquia elástica.', 'Corrida em curva; chamada com o pé de fora; arco dorsal sobre a fasquia.']],
  'Badminton':[
    ['I', 'Clear a pares', 'A pares, campo dividido: troca de clears altos e profundos.', 'Pega universal; batimento acima da cabeça; volante para o fundo.'],
    ['I', 'Serviço curto e comprido', 'Serviço curto de esquerda e comprido de direita para alvos no campo contrário.', 'Volante largado à frente; raquete abaixo da cintura; trajetória rasante no curto.'],
    ['E', 'Lob e amorti', 'Sequência: clear, amorti à rede, lob ao fundo, em cooperação.', 'Regresso à posição base; amorti cai junto à rede; lob alto e profundo.'],
    ['E', 'Jogo de singulares', 'Jogo de 11 pontos com contagem oficial.', 'Variação de trajetórias; deslocamentos em passos laterais; regresso ao centro.']],
  'Ténis de Mesa':[
    ['I', 'Batimentos de direita e esquerda', 'A pares, cooperação: 10 batimentos seguidos de direita e depois de esquerda.', 'Pega de caneta ou clássica; batimento à frente do corpo; raquete inclinada.'],
    ['E', 'Serviço e jogo de singulares', 'Serviço curto e longo; jogo de 11 pontos.', 'Serviço com lançamento vertical; variação de direção; posição base.']],
  'Dança':[
    ['I', 'Exploração do espaço e do ritmo', 'Deslocamentos livres ao ritmo da música, mudando de nível e direção a cada frase musical.', 'Respeita o ritmo; usa o espaço todo; varia níveis.'],
    ['E', 'Coreografia em grupo', 'Grupos de 4: composição de 32 tempos com formação, cânone e uníssono.', 'Sincronia; transições claras; relação com a música.']],
  'Danças Sociais':[
    ['I', 'Passo básico de merengue', 'A pares: passo básico, voltas simples e deslocamentos em roda.', 'Marca o tempo; condução clara; postura de par.'],
    ['E', 'Sequência de cha-cha-cha', 'Sequência com passo básico, new yorker e volta, sem paragens.', 'Ritmo 2, 3, 4 e 1; troca de papéis; ligação dos passos.']],
  'Danças Tradicionais':[
    ['I', 'Vira', 'Em roda: passos do vira e mudanças de par.', 'Ritmo ternário; giros no tempo certo; formação mantida.'],
    ['E', 'Malhão', 'Coreografia do malhão em quadra, com cumprimentos e trocas.', 'Sequência completa; coordenação com o par; expressão.']],
  'Patinagem':[
    ['I', 'Posição base e deslize', 'Em linha: posição base, deslize em apoio bipedal e travagem em T.', 'Joelhos fletidos; peso à frente; olhar em frente.'],
    ['I', 'Slalom entre cones', 'Percurso com cones afastados 2 m, em deslize contínuo.', 'Transferência de peso; curvas sem paragem.'],
    ['E', 'Patinagem à retaguarda', 'Deslize à retaguarda em "limões" e travagem.', 'Olhar por cima do ombro; joelhos fletidos; controlo da velocidade.']],
  'Orientação':[
    ['I', 'Orientar o mapa', 'Percurso de 6 pontos no espaço escolar com mapa simplificado; sempre com o mapa orientado.', 'Mapa orientado pelo terreno; polegar no local onde está.'],
    ['E', 'Percurso com bússola', 'Percurso em estrela com azimutes e cartão de controlo.', 'Leitura do azimute; contagem de passos; escolha do itinerário.']],
  'Luta':[
    ['I', 'Jogos de oposição em pé', 'A pares: empurrar o colega para fora de um círculo, mão com mão.', 'Base afastada; centro de gravidade baixo; respeito pelas regras de segurança.'],
    ['E', 'Luta no solo', 'A pares, de joelhos: virar o colega de costas e imobilizar 10 segundos.', 'Controlo do adversário; saídas de imobilização; cumprimento no início e no fim.']],
  'Judo':[
    ['I', 'Quedas (ukemi)', 'Quedas à retaguarda e laterais, de sentado, de cócoras e de pé.', 'Queixo ao peito; batimento com o braço a 45°; sem apoiar a mão.'],
    ['E', 'Projeção O-soto-gari', 'A pares (tori e uke): desequilíbrio e projeção O-soto-gari com queda controlada.', 'Desequilíbrio para trás; varrimento da perna; controlo do uke na queda.']],
  'Natação':[
    ['I', 'Respiração e flutuação', 'Expirações dentro de água, flutuação ventral e dorsal com apoio.', 'Expira debaixo de água; corpo horizontal; relaxamento.'],
    ['E', 'Crawl coordenado', '4 x 25 m crawl com respiração bilateral (a cada 3 braçadas).', 'Rotação do corpo; braço entra à frente do ombro; pernada contínua.']],
  'Softbol':[
    ['I', 'Receção com luva e lançamento', 'A pares: lançamento por cima do ombro e receção com luva a 10 m.', 'Passo à frente com o pé contrário; luva aberta para a bola; segunda mão a fechar.'],
    ['E', 'Batimento e corrida às bases', 'Batimento de bola parada (tee) e corrida à primeira base; jogo reduzido.', 'Pega da batida; rotação da anca; larga o taco antes de correr.']],
  'Jogos Tradicionais Populares':[
    ['I', 'Jogo da macaca', 'Em grupos: percurso da macaca com malha, ao pé-coxinho.', 'Equilíbrio num apoio; respeito pela vez; contagem das casas.'],
    ['I', 'Tração à corda', 'Duas equipas de 6 com a corda e linha central.', 'Pés firmes; puxar em conjunto ao sinal; segurança ao largar.']]
};
// Aquecimento e retorno à calma: sugestões rápidas para a folha da aula.
const EXAQ = ['Corrida contínua com mobilização articular (5 min).', 'Jogo de perseguição: apanhada com bola.', 'Ativação geral: skippings, calcanhares ao glúteo e deslocamentos laterais.', 'Jogo dos 10 passes em espaço reduzido.', 'Mobilização articular e alongamentos dinâmicos.'];
const EXRC = ['Alongamentos estáticos dos grupos musculares solicitados.', 'Respiração e relaxamento.', 'Balanço da aula com os alunos.', 'Arrumação do material.'];
// Todos os exercícios: os do banco e os do professor (CFG.exs).
function exAll() {
  const out = [];
  Object.entries(EXB).forEach(([m, xs]) => xs.forEach(([lv, nome, desc, crit], i) => out.push({id:'b:' + m + ':' + i, m, lv, nome, desc, crit, base:true})));
  ((CFG && CFG.exs) || []).forEach(x => out.push(Object.assign({}, x, {base:false})));
  return out;
}
const exById = id => exAll().find(x => x.id === id);
