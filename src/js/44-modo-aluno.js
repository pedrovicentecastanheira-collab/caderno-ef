/* ---------- modo aluno: autoavaliação, coavaliação e questionários no aparelho do professor ---------- */
// O professor prepara a atividade e passa o telemóvel ou o tablet. O ecrã cobre a app (não se veem notas nem dados
// de outros alunos); cada aluno toca no seu nome, responde e devolve. Sair pede dois toques.
// Guarda no período atual: v.autoc[aluno][matéria] = {d, r:{competência:1|0}}, v.coav[avaliado][matéria] = [{by, d, r}],
// v.quiz[aluno] = [{d, n, ok, nota}].
const QB = [
  {id:'q1', a:[5, 12], q:'Qual é a capacidade física mais solicitada numa corrida de 20 minutos a ritmo constante?', o:['Resistência', 'Velocidade', 'Flexibilidade', 'Força máxima']},
  {id:'q2', a:[5, 12], q:'Num sprint de 40 metros, a capacidade física mais importante é…', o:['Velocidade', 'Resistência aeróbia', 'Flexibilidade', 'Equilíbrio']},
  {id:'q3', a:[5, 12], q:'O teste "senta e alcança" do FITescola avalia…', o:['A flexibilidade', 'A força', 'A velocidade', 'A resistência']},
  {id:'q4', a:[5, 12], q:'O teste do vaivém avalia…', o:['A aptidão aeróbia', 'A flexibilidade', 'A força dos braços', 'A agilidade']},
  {id:'q5', a:[5, 12], q:'Mudar rapidamente de direção sem perder o equilíbrio é…', o:['Agilidade', 'Força', 'Resistência', 'Flexibilidade']},
  {id:'q6', a:[5, 12], q:'Durante um esforço intenso, a frequência cardíaca…', o:['Aumenta', 'Diminui', 'Mantém-se igual', 'Para']},
  {id:'q7', a:[6, 12], q:'Durante o exercício, a respiração fica mais rápida porque os músculos precisam de mais…', o:['Oxigénio', 'Água', 'Sal', 'Vitaminas']},
  {id:'q8', a:[5, 12], q:'Para que serve o aquecimento?', o:['Preparar o corpo para o esforço e reduzir o risco de lesão', 'Cansar os músculos antes do jogo', 'Substituir o treino', 'Baixar a temperatura do corpo']},
  {id:'q9', a:[6, 12], q:'Estar na Zona Saudável de Aptidão Física significa…', o:['Ter a aptidão física adequada à saúde para a idade e o sexo', 'Ser atleta de competição', 'Ter o peso mais baixo possível', 'Ganhar todas as provas']},
  {id:'q10', a:[5, 12], q:'Quanto tempo de atividade física moderada a vigorosa recomenda a OMS para crianças e jovens?', o:['Em média 60 minutos por dia', '60 minutos por semana', '10 minutos por dia', '3 horas por mês']},
  {id:'q11', a:[5, 12], q:'Qual destes comportamentos faz parte de um estilo de vida saudável?', o:['Dormir o suficiente e praticar atividade física regular', 'Passar muitas horas seguidas sentado', 'Saltar refeições', 'Beber bebidas energéticas à noite']},
  {id:'q12', a:[7, 12], q:'Qual é a principal diferença entre a Educação Física e o desporto federado?', o:['A Educação Física é uma disciplina para todos os alunos; o desporto federado é organizado por clubes e federações para a competição', 'São a mesma coisa', 'A Educação Física é só para atletas', 'O desporto federado é obrigatório na escola']},
  {id:'q13', a:[7, 12], q:'Os Jogos Olímpicos da era moderna começaram em 1896, em…', o:['Atenas', 'Paris', 'Londres', 'Roma']},
  {id:'q14', a:[7, 12], q:'Os Jogos Paralímpicos destinam-se a…', o:['Atletas com deficiência', 'Atletas com menos de 18 anos', 'Desportos de inverno', 'Atletas veteranos']},
  {id:'q15', a:[5, 12], q:'Os cinco anéis olímpicos representam…', o:['A união dos cinco continentes', 'As cinco modalidades originais', 'Os cinco países fundadores', 'As cinco medalhas']},
  {id:'q16', a:[5, 12], q:'No voleibol, quantos toques pode dar cada equipa antes de enviar a bola (sem contar o bloco)?', o:['3', '2', '4', 'Os que quiser']},
  {id:'q17', a:[6, 12], q:'No voleibol, a equipa roda quando…', o:['Recupera o direito de servir', 'Perde um ponto', 'Faz um bloco', 'Termina o set']},
  {id:'q18', a:[5, 12], q:'No basquetebol, dar mais de dois apoios com a bola nas mãos sem driblar chama-se…', o:['Passos', 'Dupla', 'Falta técnica', 'Bola fora']},
  {id:'q19', a:[5, 12], q:'No basquetebol, um cesto marcado de fora da linha dos 3 pontos vale…', o:['3 pontos', '2 pontos', '1 ponto', '4 pontos']},
  {id:'q20', a:[5, 12], q:'No andebol, quantos apoios pode dar um jogador com a bola sem driblar?', o:['3', '2', '5', '1']},
  {id:'q21', a:[5, 12], q:'No andebol, a área de baliza só pode ser ocupada por…', o:['O guarda-redes', 'Qualquer jogador', 'O pivot', 'O capitão']},
  {id:'q22', a:[8, 12], q:'No futebol, o fora de jogo só é assinalado quando o jogador…', o:['Está em posição de fora de jogo e participa ativamente na jogada', 'Está no seu meio-campo', 'Recebe a bola de um lançamento lateral', 'Está atrás da bola']},
  {id:'q23', a:[6, 12], q:'No badminton, o serviço é feito…', o:['Abaixo da cintura e para a área de serviço na diagonal', 'Acima da cabeça, para a frente', 'Em qualquer direção', 'Deixando o volante tocar no chão']},
  {id:'q24', a:[5, 12], q:'Nas estafetas, o testemunho tem de ser passado…', o:['Dentro da zona de transmissão', 'Em qualquer ponto da pista', 'Só na reta da meta', 'Depois da linha de chegada']},
  {id:'q25', a:[5, 12], q:'Na ajuda a um colega na ginástica, o mais importante é…', o:['Colocar-se de forma a amparar e acompanhar o movimento com segurança', 'Empurrar com força', 'Afastar-se para não atrapalhar', 'Fazer o elemento ao mesmo tempo']},
  {id:'q26', a:[5, 12], q:'Ter fair play significa…', o:['Respeitar as regras, os adversários e o árbitro', 'Ganhar a qualquer custo', 'Discutir as decisões do árbitro', 'Jogar só com os amigos']},
  {id:'q27', a:[10, 12], q:'Um plano de treino de resistência aeróbia deve definir…', o:['A frequência, a intensidade, a duração e o tipo de exercício', 'Só a duração', 'Só a música', 'Apenas o resultado do último teste']},
  {id:'q28', a:[9, 12], q:'Treinar de forma contínua a 60–80% da frequência cardíaca máxima desenvolve sobretudo…', o:['A resistência aeróbia', 'A flexibilidade', 'A velocidade de reação', 'A força máxima']},
  {id:'q29', a:[9, 12], q:'A frequência cardíaca máxima pode estimar-se, de forma aproximada, por…', o:['220 − idade', '100 + idade', '180 − peso', '200 + altura']},
  {id:'q30', a:[10, 12], q:'O doping no desporto é…', o:['O uso de substâncias ou métodos proibidos para aumentar o rendimento', 'Um tipo de aquecimento', 'Uma regra de fair play', 'Um suplemento obrigatório']},
  {id:'q31', a:[9, 12], q:'Para melhorar a condição física, a carga do treino deve…', o:['Aumentar de forma progressiva', 'Ser sempre igual', 'Diminuir todas as semanas', 'Ser máxima em todos os treinos']},
  {id:'q32', a:[5, 12], q:'Depois de um esforço intenso, o organismo precisa de…', o:['Recuperar: descanso, água e alimentação', 'Repetir logo o mesmo esforço', 'Deixar de beber água', 'Dormir menos']}
];
const qbAno = ano => QB.filter(q => ano >= q.a[0] && ano <= q.a[1]);
// Baralha as opções de forma estável por aluno e pergunta (a primeira opção do banco é a certa).
function qOrd(q, aid) { let h = 0; for (const ch of q.id + aid) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const ix = q.o.map((_, i) => i); for (let i = ix.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [ix[i], ix[j]] = [ix[j], ix[i]]; } return ix; }
let KI = null;
const KIN = {auto:'Autoavaliação', coav:'Coavaliação', quiz:'Questionário'};
const geralC = c => /^(Adequa|Coopera|Aceita|Conhece|Identifica|Respeita|Cumpre|Compreende|Interpreta|Analisa|Aprecia|Trata|Preserva|Participa)/i.test(c.txt);
function sheetModo() {
  const t = turma(), ms = matsOf(t, UI.p).length ? matsOf(t, UI.p) : (MATS[t.ciclo] || GR).slice(0, 8);
  KI = KI && KI.t === t.id ? KI : {t:t.id, act:'auto', m:ms[0], qs:null, focus:null};
  if (!ms.includes(KI.m)) KI.m = ms[0];
  if (!KI.qs) { const pool = qbAno(anoOf(t) || 7); KI.qs = pool.slice().sort(() => Math.random() - .5).slice(0, Math.min(8, pool.length)).map(q => q.id); }
  const cs = compsOf(t.ciclo, KI.m), nv = nivelTurma(t, KI.m);
  if (!KI.focus || !KI.focus.every(id => cs.some(c => c.id === id))) KI.focus = cs.filter(c => c.k === nv && !geralC(c)).slice(0, 5).map(c => c.id);
  const v = avalOf(t.id, UI.p), quiz = v.quiz || {};
  let b = `<div class="form"><div class="seg block">${Object.entries(KIN).map(([k, n]) => `<button data-a="ki-act" data-k="${k}" class="${KI.act === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (KI.act !== 'quiz') b += `<div class="chips">${ms.map(m => `<button class="chip ${m === KI.m ? 'on' : ''}" data-a="ki-m" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>`;
  if (KI.act === 'auto') b += `<p class="hint">Cada aluno vê as competências do nível em que está a trabalhar e do seguinte, escritas para si, e responde "Já consigo" ou "Ainda não". Na ficha do aluno aparece a comparação com o que o professor assinalou.</p>`;
  if (KI.act === 'coav') b += `<p class="hint">Cada aluno escolhe o colega que observou e assinala as competências em foco. Escolha até 6 (as do nível da turma vêm sugeridas):</p><div class="ki-f">${cs.filter(c => !geralC(c)).map(c => `<button class="chip ${KI.focus.includes(c.id) ? 'on' : ''}" data-a="ki-foc" data-id="${c.id}" title="${esc(c.txt)}">${c.of ? c.id + ' · ' : ''}${esc(encurta(c.txt, 60))}</button>`).join('')}</div>`;
  if (KI.act === 'quiz') { const pool = qbAno(anoOf(t) || 7);
    b += `<p class="hint">Perguntas de escolha múltipla sobre os conhecimentos do ${anoOf(t)}.º ano. A ordem das opções muda de aluno para aluno. Escolhidas: ${KI.qs.length}.</p><div class="ki-q">${pool.map(q => `<label class="cli"><input type="checkbox" data-in="ki-q" data-id="${q.id}"${KI.qs.includes(q.id) ? ' checked' : ''}> <span>${esc(q.q)}</span></label>`).join('')}</div>`;
    const rs = alunosOf(t).filter(al => (quiz[al.id] || []).length);
    if (rs.length) b += `<div class="card"><b>Resultados · ${perLabel(UI.p, true)}</b>${rs.map(al => { const l = quiz[al.id]; return `<div class="li"><span class="who nm">${esc(al.nome)}</span><span class="num-t">${l.map(x => f1(x.nota)).join(' · ')}</span></div>`; }).join('')}<button class="btn block" data-a="ki-con" style="margin-top:8px">Lançar a média dos questionários em Conhecimentos</button></div>`; }
  b += '</div>';
  openSheet('Modo aluno', b, `<button class="btn primary" data-a="ki-go"${KI.act === 'coav' && !KI.focus.length ? ' disabled' : ''}>Começar e passar o aparelho</button>`);
}
function kiEl() { let el = $('#kiosk'); if (!el) { el = document.createElement('div'); el.id = 'kiosk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); } return el; }
function kiRender() {
  const t = S.turmas[KI.t], v = avalOf(t.id, UI.p), als = alunosOf(t), el = kiEl(), feito = aid => KI.act === 'quiz' ? (KI.done || []).includes(aid) : (KI.done || []).includes(aid);
  let h = `<header class="ki-h"><div><span class="eyebrow">Modo aluno · ${esc(KIN[KI.act])}</span><b>${esc(KI.act === 'quiz' ? 'Conhecimentos' : KI.m)}</b></div><button class="btn" data-a="ki-exit">Sair (professor)</button></header><div class="ki-b">`;
  if (!KI.aid) {
    h += `<h1 class="ki-t">Toca no teu nome</h1><div class="ki-n">${als.map(al => `<button data-a="ki-al" data-id="${esc(al.id)}" class="${feito(al.id) ? 'done' : ''}">${avatar(al)}<span>${esc(nome2(al.nome))}</span>${feito(al.id) ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
  } else if (KI.fim) {
    h += `<div class="ki-fim"><div class="ki-ok">✓</div><h1 class="ki-t">${esc(KI.fim)}</h1><button class="btn primary big" data-a="ki-next">Passa ao colega</button></div>`;
  } else {
    const al = als.find(x => x.id === KI.aid);
    if (KI.act === 'auto') {
      const tk = tksOf(v, al.id, KI.m) || {}, cs = compsOf(t.ciclo, KI.m), low = ['I', 'E', 'A'].find(k => cs.some(c => c.k === k && !tk[c.id])) || 'A', nxt = {I:'E', E:'A', A:null}[low];
      const xs = cs.filter(c => c.k === low || c.k === nxt);
      h += `<h1 class="ki-t">${esc(al.nome.split(' ')[0])}, o que já consegues fazer em ${esc(KI.m)}?</h1><p class="ki-s">Responde com sinceridade: serve para conversares com o professor.</p>`;
      h += xs.map(c => { const r = KI.r[c.id]; return `<div class="ki-c"><span class="ki-lv">${LVN[c.k]}</span><p>${esc(paraAluno(c.txt))}</p><div class="ki-bt"><button class="${r === 1 ? 'on ok' : ''}" data-a="ki-r" data-id="${c.id}" data-v="1">Já consigo</button><button class="${r === 0 ? 'on no' : ''}" data-a="ki-r" data-id="${c.id}" data-v="0">Ainda não</button></div></div>`; }).join('');
      h += `<button class="btn primary big block" data-a="ki-save"${Object.keys(KI.r).length < xs.length ? ' disabled' : ''}>Entregar</button>`;
    } else if (KI.act === 'coav' && !KI.alvo) {
      h += `<h1 class="ki-t">${esc(al.nome.split(' ')[0])}, que colega observaste?</h1><div class="ki-n">${als.filter(x => x.id !== al.id).map(x => `<button data-a="ki-alvo" data-id="${esc(x.id)}">${avatar(x)}<span>${esc(nome2(x.nome))}</span></button>`).join('')}</div>`;
    } else if (KI.act === 'coav') {
      const alvo = als.find(x => x.id === KI.alvo), xs = compsOf(t.ciclo, KI.m).filter(c => KI.focus.includes(c.id));
      h += `<h1 class="ki-t">O que fez ${esc(alvo.nome.split(' ')[0])}?</h1><p class="ki-s">Observaste com atenção? Assinala o que o teu colega conseguiu fazer.</p>`;
      h += xs.map(c => { const r = KI.r[c.id]; return `<div class="ki-c"><p>${esc(c.txt)}</p><div class="ki-bt"><button class="${r === 1 ? 'on ok' : ''}" data-a="ki-r" data-id="${c.id}" data-v="1">Conseguiu</button><button class="${r === 0 ? 'on no' : ''}" data-a="ki-r" data-id="${c.id}" data-v="0">Ainda não</button></div></div>`; }).join('');
      h += `<button class="btn primary big block" data-a="ki-save"${Object.keys(KI.r).length < xs.length ? ' disabled' : ''}>Entregar</button>`;
    } else {
      const qs = KI.qs.map(id => QB.find(q => q.id === id)).filter(Boolean);
      h += `<h1 class="ki-t">${esc(al.nome.split(' ')[0])}, responde às ${qs.length} perguntas</h1>`;
      h += qs.map((q, i) => `<div class="ki-c"><p><b>${i + 1}.</b> ${esc(q.q)}</p><div class="ki-op">${qOrd(q, al.id).map(j => `<button class="${KI.r[q.id] === j ? 'on' : ''}" data-a="ki-r" data-id="${q.id}" data-v="${j}">${esc(q.o[j])}</button>`).join('')}</div></div>`).join('');
      h += `<button class="btn primary big block" data-a="ki-save"${Object.keys(KI.r).length < qs.length ? ' disabled' : ''}>Entregar</button>`;
    }
  }
  el.innerHTML = h + '</div>'; el.hidden = false; document.body.classList.add('locked');
}
function kiSave() {
  const t = S.turmas[KI.t], v = avalOf(t.id, UI.p), d = today();
  if (KI.act === 'auto') { v.autoc = v.autoc || {}; (v.autoc[KI.aid] = v.autoc[KI.aid] || {})[KI.m] = {d, r:Object.assign({}, KI.r)}; KI.fim = 'Obrigado! A tua autoavaliação foi entregue.'; }
  else if (KI.act === 'coav') { v.coav = v.coav || {}; const o = v.coav[KI.alvo] = v.coav[KI.alvo] || {}; (o[KI.m] = o[KI.m] || []).push({by:KI.aid, d, r:Object.assign({}, KI.r)}); KI.fim = 'Obrigado! A tua observação foi entregue.'; }
  else { const qs = KI.qs.filter(id => QB.some(q => q.id === id)), ok = qs.filter(id => KI.r[id] === 0).length, nota = Math.round(ok / qs.length * 200) / 10;
    v.quiz = v.quiz || {}; (v.quiz[KI.aid] = v.quiz[KI.aid] || []).push({d, n:qs.length, ok, nota}); KI.fim = `Acertaste ${ok} de ${qs.length} perguntas.`; }
  touchAval(v); KI.done = [...new Set([...(KI.done || []), KI.aid])]; kiRender();
}
// Comparação na ficha do aluno: o que o aluno diz, o que os colegas viram e o que o professor assinalou.
function autoCompHtml(t, p, al, m) {
  const v = avalOf(t.id, p), a = ((v.autoc || {})[al.id] || {})[m], co = ((v.coav || {})[al.id] || {})[m] || []; if (!a && !co.length) return '';
  const tk = tksOf(v, al.id, m) || {}, ev = evMap(v, al.id, m), ids = [...new Set([...Object.keys(a ? a.r : {}), ...co.flatMap(x => Object.keys(x.r))])];
  const cs = compsOf(t.ciclo, m).filter(c => ids.includes(c.id)), sym = x => x == null ? '—' : x ? '✓' : '✗';
  const prof = c => tk[c.id] ? 1 : evState(ev[c.id]) === 'dom' ? 1 : (ev[c.id] || tk[c.id] === false) ? 0 : (Object.keys(tk).length ? 0 : null);
  let dif = 0;
  const rows = cs.map(c => { const s = a ? a.r[c.id] : null, cv = co.filter(x => x.r[c.id] != null), cp = cv.length ? cv.filter(x => x.r[c.id]).length / cv.length : null, pr = prof(c), off = s != null && pr != null && s !== pr; if (off) dif++;
    return `<tr class="${off ? 'off' : ''}"><td class="l">${cidOf(c)}${esc(encurta(c.txt, 80))}</td><td>${sym(s)}</td><td>${cp == null ? '—' : Math.round(cp * 100) + '%'}</td><td>${sym(pr)}</td></tr>`; }).join('');
  return `<details class="evl"${dif ? ' open' : ''}><summary>Autoavaliação e coavaliação${dif ? ` · <span class="bad-t">${dif} ${dif === 1 ? 'diferença' : 'diferenças'} para conversar</span>` : ''}</summary><div class="tbl-wrap"><table class="auto-c"><thead><tr><th class="l">Competência</th><th>Aluno</th><th>Colegas</th><th>Professor</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
Object.assign(A, {
  'modo-aluno': () => sheetModo(),
  'ki-act': el => { KI.act = el.dataset.k; sheetModo(); },
  'ki-m': el => { KI.m = el.dataset.m; KI.focus = null; sheetModo(); },
  'ki-foc': el => { const id = el.dataset.id, i = KI.focus.indexOf(id); if (i >= 0) KI.focus.splice(i, 1); else if (KI.focus.length < 6) KI.focus.push(id); sheetModo(); },
  'ki-go': () => { if (KI.act === 'quiz' && !KI.qs.length) { toast('Escolha pelo menos uma pergunta.', 'bad'); return; } closeSheet(); Object.assign(KI, {aid:null, alvo:null, r:{}, fim:null, done:[]}); kiRender(); },
  'ki-al': el => { KI.aid = el.dataset.id; KI.alvo = null; KI.r = {}; KI.fim = null; kiRender(); window.scrollTo(0, 0); },
  'ki-alvo': el => { KI.alvo = el.dataset.id; kiRender(); },
  'ki-r': el => { KI.r[el.dataset.id] = +el.dataset.v; const y = kiEl().scrollTop; kiRender(); kiEl().scrollTop = y; },
  'ki-save': () => kiSave(),
  'ki-next': () => { KI.aid = null; KI.alvo = null; KI.fim = null; KI.r = {}; kiRender(); kiEl().scrollTop = 0; },
  'ki-exit': el => { if (!armed(el, 'Toque de novo para sair')) return; const k = $('#kiosk'); if (k) { k.hidden = true; k.innerHTML = ''; } document.body.classList.remove('locked'); render(); toast('Modo aluno terminado.'); },
  'ki-con': () => { const t = turma(), v = avalOf(t.id, UI.p), q = v.quiz || {}; let n = 0; v.con = v.con || {};
    alunosOf(t).forEach(al => { const l = q[al.id]; if (!l || !l.length) return; const m = l.reduce((s, x) => s + x.nota, 0) / l.length; v.con[al.id] = t.escala === '1-5' ? Math.round(m / 4 * 10) / 10 : Math.round(m * 10) / 10; n++; });
    touchAval(v); closeSheet(); render(); toast(`Conhecimentos lançados para ${n} ${n === 1 ? 'aluno' : 'alunos'}.`); }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'ki-q' && KI) { const id = el.dataset.id, i = KI.qs.indexOf(id); if (el.checked && i < 0) KI.qs.push(id); if (!el.checked && i >= 0) KI.qs.splice(i, 1); sheetModo(); } });
