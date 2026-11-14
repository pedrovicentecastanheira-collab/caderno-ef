/* ---------- linguagem do aluno, desafio com treino, passaporte e relatório de uma página ---------- */
// Cada competência oficial ganha uma frase curta para o aluno (até ~15 palavras). A frase automática corta o texto
// oficial na primeira ideia; o professor pode reescrevê-la (CFG.cal, partilhada com o grupo).
const calKey = (ciclo, m, c) => ciclo + '|' + m + '|' + c.id;
const CTXI = /^(em|na|no|nas|nos|após|durante|quando|numa?|perante|a partir|sem|depois)\b/i;
const FIMX = /\s+(ou|e|de|da|do|das|dos|a|o|os|as|com|em|para|por|ao|aos|na|no|nas|nos|num|numa|que|se|um|uma|lhe|à|às|pela|pelo)$/i;
function autoShort(s) {
  s = String(s || '').replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  let parts = splitTop(s.replace(/[.;,:]\s*$/, ''), ', ').flatMap(x => x.split(/;\s*|:\s+/)).map(x => x.trim()).filter(Boolean);
  while (parts.length > 1 && CTXI.test(parts[0])) parts.shift();          // o contexto não é o que o aluno faz
  parts[0] = parts[0].replace(/^e\s+/i, '');
  const wc = x => x.split(' ').length; let out = '';
  for (const p of parts) { if (out && wc(out) >= 7) break; out = out ? out + ', ' + p : p; }
  if (wc(out) > 16) { out = out.split(' ').slice(0, 16).join(' '); const c = out.lastIndexOf(', '); if (c > 0 && wc(out.slice(0, c)) >= 6) out = out.slice(0, c); }
  out = out.replace(/\s+-\s*$/, ''); while (FIMX.test(out)) out = out.replace(FIMX, '');
  out = paraAluno(out).trim().replace(/\s*,\s*\.\s*/g, '. ').replace(/[,;:\-]$/, ''); return out.charAt(0).toUpperCase() + out.slice(1) + '.';
}
function cAluno(ciclo, m, c) { const own = ((CFG && CFG.cal) || {})[calKey(ciclo, m, c)]; return own || autoShort(c.txt); }
// Exercício do banco que melhor treina uma competência: mesmo nível e mais palavras em comum.
const palavras = s => new Set(String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 5));
function exPara(m, c) {
  const xs = exAll().filter(x => x.m === m); if (!xs.length) return null; const cw = palavras(c.txt + ' ' + (c.ctx || ''));
  return xs.map(x => { let n = x.lv === c.k ? 2 : 0; palavras(x.nome + ' ' + x.desc + ' ' + x.crit).forEach(w => { if (cw.has(w)) n++; }); return {x, n}; }).sort((a, b) => b.n - a.n)[0].x;
}
// Desafio completo: o que tens de conseguir, como treinar e como sabes que já consegues.
function desafioPlus(t, p, al, m) {
  const d = desafioDe(t, p, al, m); if (!d) return null;
  if (d.own || !d.c) return {alvo:d.txt, own:true};
  const ex = exPara(m, d.c);
  return {alvo:cAluno(t.ciclo, m, d.c), c:d.c, ev:d.ev, ex, crit:ex && ex.crit ? ex.crit : null};
}
function desafioBloco(d, compact) {
  return `<p class="dp-a">${esc(d.alvo)}</p>${d.ex ? `<p class="dp-l"><b>Como treinar:</b> ${esc(d.ex.nome)}${compact ? '' : (d.ex.desc ? ` — ${esc(encurta(d.ex.desc, 140))}` : '')}</p>` : ''}${d.crit ? `<p class="dp-l"><b>Já consegues quando:</b> ${esc(d.crit)}</p>` : ''}`;
}
// Substitui o bloco do próximo desafio na ficha do aluno.
desafioHtml = function (t, p, al, m, edit) {
  const d = desafioPlus(t, p, al, m); if (!d) return '';
  return `<div class="desf"><span class="desf-k">Próximo desafio</span>${desafioBloco(d)}${d.c ? `<details class="dp-of"><summary>Competência oficial ${esc(d.c.id)}</summary><p class="small">${d.c.ctx ? esc(d.c.ctx) + ': ' : ''}${esc(d.c.txt)}</p></details>` : ''}${d.ev ? `<span class="small muted">Evidências: ${evDots(d.ev)}</span>` : ''}${edit ? `<button class="link" data-a="des-edit" data-aid="${esc(al.id)}" data-m="${esc(m)}">${d.own ? 'Editar o desafio' : 'Escrever outro desafio'}</button>` : ''}</div>`;
};
cartoesHtml = function (t, p) {
  const ms = matsOf(t, p);
  return `<section class="rel">${docHead('Cartões de desafio · ' + t.nome, perLabel(p, true))}<div class="cards-des">${alunosOf(t).map(al => { const ls = ms.map(m => ({m, l:(lvOf(avalOf(t.id, p), al.id, m) || {}).l, d:desafioPlus(t, p, al, m)})).filter(x => x.d);
    return `<div class="cdes"><b>${esc(al.nome)}</b>${ls.length ? ls.map(x => `<div class="cdes-m"><span>${esc(x.m)}${x.l ? ' · ' + esc(LVN[x.l]) : ''}</span>${desafioBloco(x.d, true)}</div>`).join('') : '<p class="small">Sem desafios: faltam níveis ou competências.</p>'}</div>`; }).join('')}</div></section>`;
};

/* passaporte: o caminho todo da matéria, em linguagem do aluno, com o que já consegue assinalado */
// Domina: assinalada, ou dominada pelas evidências; sem nada assinalado, conta o nível atribuído (níveis completos).
function domina(v, aid, m, c) {
  const tk = tksOf(v, aid, m) || {}, ev = evMap(v, aid, m);
  if (tk[c.id] || evState(ev[c.id]) === 'dom') return true;
  if (Object.values(tk).some(Boolean) || Object.keys(ev).length) return false;
  const l = (lvOf(v, aid, m) || {}).l; return !!l && ({NI:[], PI:[], I:['I'], PE:['I'], E:['I', 'E'], PA:['I', 'E'], A:['I', 'E', 'A']}[l] || []).includes(c.k);
}
function passHtml(t, p, al, m, ecra) {
  const v = avalOf(t.id, p), cs = compsOf(t.ciclo, m); if (!cs.length) return '';
  const lv = ['I', 'E', 'A'].filter(k => cs.some(c => c.k === k)), aqui = lv.find(k => cs.some(c => c.k === k && !domina(v, al.id, m, c))) || null;
  const tot = cs.length, ok = cs.filter(c => domina(v, al.id, m, c)).length;
  return `<div class="pass${ecra ? ' ecra' : ''}"><div class="pass-h"><div><span class="pass-k">Passaporte · ${esc(m)}</span><b>${esc(al.nome)}</b></div><span class="pass-n"><b>${ok}</b>/${tot}</span></div>
    <div class="pass-bar"><i style="width:${tot ? ok / tot * 100 : 0}%"></i></div>
    ${lv.map(k => { const xs = cs.filter(c => c.k === k), n = xs.filter(c => domina(v, al.id, m, c)).length;
      return `<div class="pass-l${k === aqui ? ' aqui' : ''}"><div class="pass-lh"><b>${LVN[k]}</b><span>${n}/${xs.length}</span>${k === aqui ? '<em>Estás aqui</em>' : n === xs.length ? '<em class="ok">Conseguido</em>' : ''}</div>
        <ul>${xs.map(c => { const d = domina(v, al.id, m, c); return `<li class="${d ? 'ok' : ''}"><span class="bx">${d ? '✓' : ''}</span>${esc(cAluno(t.ciclo, m, c))}</li>`; }).join('')}</ul></div>`; }).join('')}</div>`;
}
const passDoc = (t, p, als, m) => `<section class="rel">${docHead('Passaportes · ' + m, t.nome + ' · ' + perLabel(p, true))}<div class="pass-g">${als.map(al => passHtml(t, p, al, m)).join('')}</div></section>`;

/* relatório de uma página para o aluno */
function relAlunoHtml(t, p, al) {
  const r = calc(t, p, al), v = avalOf(t.id, p), ms = [...new Set([...Object.keys(r.lv), ...matsOf(t, p)])].filter(m => compsOf(t.ciclo, m).length || r.lv[m]);
  const ph = S.fotos[al.id] ? `<img src="${esc(S.fotos[al.id].d)}" alt="">` : `<span class="rph">${esc((al.nome || '?')[0])}</span>`;
  let h = `<section class="rel relal">${docHead('O meu percurso em Educação Física', perLabel(p, true))}<div class="rel-id">${ph}<div><h1>${esc(al.nome)}</h1><div class="rel-s">Turma ${esc(t.nome)}</div></div></div>`;
  h += ms.map(m => { const l = r.lv[m], cs = compsOf(t.ciclo, m), feitos = cs.filter(c => domina(v, al.id, m, c)), d = desafioPlus(t, p, al, m);
    const ult = feitos.slice(-3).map(c => cAluno(t.ciclo, m, c));
    return `<div class="ra-m"><div class="ra-h"><b>${esc(m)}</b><span class="ra-sc">${['I', 'E', 'A'].map(k => `<i class="${l && LVI(l) >= LVI(k) ? 'on' : ''}">${LVN[k]}</i>`).join('')}</span></div>
      <div class="ra-c"><div><span class="ra-k ok">Já consegues</span>${ult.length ? `<ul>${ult.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Ainda estamos a observar.</p>'}</div>
      <div><span class="ra-k nx">O teu próximo passo</span>${d ? desafioBloco(d, true) : '<p>Mantém o que já consegues e ajuda os colegas.</p>'}</div></div></div>`; }).join('');
  if (r.apfOn) { const fz = FIT.filter(f => r.zones[f.k] != null);
    if (fz.length) h += `<h2>A tua aptidão física</h2><div class="ra-fit">${fz.map(f => `<span class="${r.zones[f.k] ? 'ok' : 'nx'}">${r.zones[f.k] ? '✓' : '↑'} ${esc(f.n)}</span>`).join('')}</div>${pfitOf(t, al) ? '<p class="rel-s">Tens um plano para melhorar: pede-o ao teu professor.</p>' : ''}`; }
  const pp = papeisDe(t, p, al.id); if (Object.keys(pp).length) h += `<h2>Papéis que desempenhaste</h2><p class="rel-p">${esc(papeisTxt(pp))}.</p>`;
  return h + `<p class="rel-s" style="margin-top:14px">Este resumo mostra o que já consegues e o que vem a seguir. Fala com o teu professor se tiveres dúvidas.</p></section>`;
}

/* conselho de turma: síntese extra */
function conselhoExtra(t, p) {
  const als = alunosOf(t), med = als.filter(temMed), pf = als.filter(al => pfitOf(t, al)), eq = equidade(t, p).filter(x => Math.abs(x.d) >= 3), cs = consist(t, p).filter(x => x.k === 'warn');
  let h = '';
  if (med.length) h += `<h2>Medidas de suporte em vigor</h2><table class="rel-t"><tbody>${med.map(al => { const M = medOf(al); return `<tr><td class="l" style="width:30%"><b>${esc(al.nome)}</b></td><td class="l">${esc([...M.u, ...M.s, ...M.a].join('; '))}${M.obs ? ' · ' + esc(M.obs) : ''}</td></tr>`; }).join('')}</tbody></table>`;
  if (pf.length) h += `<h2>Planos individuais de aptidão física</h2><p class="rel-p">${esc(pf.map(al => nome2(al.nome)).join(', '))}.</p>`;
  if (eq.length) h += `<h2>Equidade</h2><p class="rel-p">${eq.map(x => `${esc(x.m)}: raparigas ${lvNear(x.mf)}, rapazes ${lvNear(x.mm)}`).join(' · ')}.</p>`;
  if (cs.length) h += `<h2>Situações a confirmar antes da pauta</h2><ul class="rel-p">${cs.map(x => `<li>${esc(x.txt)}</li>`).join('')}</ul>`;
  return h;
}

/* editor da linguagem do aluno */
function sheetCal(m) {
  const t = turma(), cs = compsOf(t.ciclo, m); UI.draft = {m};
  const body = `<div class="form"><p class="hint">Uma frase curta, concreta e observável, dirigida ao aluno. Deixe em branco para usar a frase automática. Estas frases aparecem nos desafios, nos passaportes, no modo aluno e no relatório do aluno, e entram no pacote do grupo.</p>
    ${['I', 'E', 'A'].map(k => { const xs = cs.filter(c => c.k === k); return xs.length ? `<div class="field"><span class="lbl">${LVN[k]}</span>${xs.map(c => `<div class="cal-r"><span class="small muted">${cidOf(c)}${esc(encurta(c.txt, 140))}</span><input type="text" data-cal="${c.id}" value="${esc(((CFG.cal || {})[calKey(t.ciclo, m, c)]) || '')}" placeholder="${esc(autoShort(c.txt))}"></div>`).join('')}</div>` : ''; }).join('')}</div>`;
  openSheet('Linguagem do aluno · ' + m, body, `<button class="btn primary" data-a="cal-save">Guardar</button>`);
}
function sheetPassEsc() {
  const t = turma(), ms = matsOf(t, UI.p).filter(m => compsOf(t.ciclo, m).length);
  openSheet('Passaportes', `<p class="hint">Um passaporte por aluno com todas as competências da matéria, em linguagem do aluno, e as que já consegue assinaladas.</p><div class="chips">${ms.map(m => `<button class="chip" data-a="pass-go" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`).join('') || '<p class="hint">Sem matérias com competências neste período.</p>'}</div>`);
}
function sheetRelEsc(aid) {
  const t = turma(), al = alunosOf(t).find(x => x.id === aid), ms = [...new Set([...Object.keys(calc(t, UI.p, al).lv), ...matsOf(t, UI.p)])].filter(m => compsOf(t.ciclo, m).length);
  openSheet('Relatório · ' + nome2(al.nome), `<div class="docs">
    <button class="card doc" data-a="rel-al" data-id="${esc(aid)}"><b>Para o aluno</b><span class="hint">Uma página: o que já consegue e o próximo passo em cada matéria, em linguagem simples.</span></button>
    <button class="card doc" data-a="rel-one" data-id="${esc(aid)}"><b>Para o encarregado de educação</b><span class="hint">Relatório completo: classificação, domínios, Aprendizagens Essenciais, aptidão física, atitudes, assiduidade e próximos passos.</span></button></div>
    ${ms.length ? `<p class="lbl" style="margin-top:12px">Passaporte de uma matéria</p><div class="chips">${ms.map(m => `<button class="chip" data-a="pass-one" data-id="${esc(aid)}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}`);
}
Object.assign(A, {
  'cal-ed': el => sheetCal(el.dataset.m),
  'cal-save': () => { const t = turma(), m = UI.draft.m; CFG.cal = CFG.cal || {};
    document.querySelectorAll('#sheet [data-cal]').forEach(i => { const c = compsOf(t.ciclo, m).find(x => x.id === i.dataset.cal), k = calKey(t.ciclo, m, c), x = i.value.trim(); if (x) CFG.cal[k] = x; else delete CFG.cal[k]; });
    Store.save('cfg', CFG); closeSheet(); render(); toast('Linguagem do aluno guardada.'); },
  'doc-pass': () => sheetPassEsc(),
  'pass-go': el => { const t = turma(); closeSheet(); printDoc('Passaportes · ' + el.dataset.m, passDoc(t, UI.p, alunosOf(t), el.dataset.m)); },
  'pass-one': el => { const t = turma(), al = alunosOf(t).find(x => x.id === el.dataset.id); closeSheet(); printDoc('Passaporte · ' + el.dataset.m, passDoc(t, UI.p, [al], el.dataset.m)); },
  'rel-esc': el => sheetRelEsc(el.dataset.id),
  'rel-al': el => { const t = turma(), al = alunosOf(t).find(x => x.id === el.dataset.id); closeSheet(); printDoc('Relatório para o aluno', relAlunoHtml(t, UI.p, al)); },
  'doc-rel-alunos': () => { const t = turma(); printDoc('Relatórios para os alunos', alunosOf(t).map(al => relAlunoHtml(t, UI.p, al)).join('')); }
});
