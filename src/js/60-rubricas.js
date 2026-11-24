/* ---------- rúbricas: critérios com descritores por nível, avaliação rápida, autoavaliação e partilha ---------- */
// Biblioteca em CFG.rub = [{id, nome, niv:[{n, v}], crit:[{id, n, p, d:[descritor por nível]}]}].
// Em cada período: v.rubUse = [ids em uso], v.rub[rid][aluno][critério] = índice do nível, v.rubAuto (o que o aluno escolheu),
// v.rubCon = rid cuja nota passa a ser a de Conhecimentos.
const NIV4 = () => [{n:'Insuficiente', v:7}, {n:'Suficiente', v:11}, {n:'Bom', v:15}, {n:'Muito bom', v:19}];
const RUBB = [
  {id:'rb:trab', nome:'Trabalho escrito ou de pesquisa', crit:[
    ['Conteúdo e rigor', 40, ['Informação escassa ou com erros importantes.', 'Informação correta mas incompleta.', 'Informação correta e completa.', 'Informação correta, completa e aprofundada, com exemplos próprios.']],
    ['Organização', 20, ['Sem estrutura clara.', 'Estrutura simples, com falhas.', 'Introdução, desenvolvimento e conclusão claros.', 'Muito bem organizado, fácil de seguir.']],
    ['Linguagem e termos da EF', 20, ['Muitos erros; não usa termos da disciplina.', 'Alguns erros; poucos termos da disciplina.', 'Escrita correta com os termos certos.', 'Escrita rigorosa e rica em termos da disciplina.']],
    ['Fontes e prazo', 20, ['Sem fontes e fora do prazo.', 'Fontes incompletas ou atraso.', 'Fontes indicadas e no prazo.', 'Fontes variadas e bem citadas, no prazo.']]]},
  {id:'rb:oral', nome:'Apresentação oral', crit:[
    ['Domínio do tema', 40, ['Não domina o tema.', 'Domina partes do tema.', 'Domina o tema e responde a perguntas.', 'Domina o tema com segurança e acrescenta exemplos.']],
    ['Clareza', 25, ['Difícil de perceber.', 'Percebe-se com esforço.', 'Clara e com bom ritmo.', 'Muito clara, envolve a turma.']],
    ['Apoios visuais ou demonstração', 20, ['Sem apoios.', 'Apoios pouco úteis.', 'Apoios úteis e bem feitos.', 'Demonstração prática ou apoios excelentes.']],
    ['Tempo', 15, ['Muito fora do tempo.', 'Um pouco fora do tempo.', 'Dentro do tempo.', 'Dentro do tempo e bem distribuído.']]]},
  {id:'rb:coreo', nome:'Coreografia ou sequência (Dança, Ginástica)', crit:[
    ['Elementos obrigatórios', 30, ['Faltam vários elementos.', 'Falta um elemento.', 'Todos os elementos.', 'Todos os elementos com variações próprias.']],
    ['Execução técnica', 30, ['Muitas falhas de execução.', 'Execução com algumas falhas.', 'Execução correta.', 'Execução correta, segura e com amplitude.']],
    ['Ritmo e ligação', 20, ['Sem ligação nem ritmo.', 'Ligações com paragens.', 'Ligações fluidas e no ritmo.', 'Totalmente fluida, no ritmo e expressiva.']],
    ['Composição e criatividade', 20, ['Repetitiva.', 'Pouco variada.', 'Variada e com uso do espaço.', 'Original, variada e com ótimo uso do espaço.']]]},
  {id:'rb:arb', nome:'Arbitragem e regras', crit:[
    ['Conhecimento das regras', 40, ['Não conhece as regras principais.', 'Conhece algumas regras.', 'Conhece e aplica as regras principais.', 'Conhece e aplica todas as regras, mesmo as raras.']],
    ['Sinalética e posicionamento', 30, ['Não usa sinais nem se posiciona.', 'Usa alguns sinais.', 'Sinais corretos e bem posicionado.', 'Sinais claros e posicionamento sempre certo.']],
    ['Atitude e autoridade', 30, ['Hesita e não se faz ouvir.', 'Decide com hesitação.', 'Decide com segurança e calma.', 'Decide com segurança, calma e respeito de todos.']]]}
].map(r => ({id:r.id, nome:r.nome, base:true, niv:NIV4(), crit:r.crit.map(([n, p, d], i) => ({id:r.id + ':' + i, n, p, d}))}));
const rubAll = () => RUBB.concat(CFG.rub || []);
const rubById = id => rubAll().find(r => r.id === id);
const nivAbr = n => n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
function rubNota(R, sel) {
  sel = sel || {}; let s = 0, w = 0, n = 0;
  R.crit.forEach(c => { const l = sel[c.id]; if (l == null || !R.niv[l]) return; s += c.p * R.niv[l].v; w += c.p; n++; });
  return {v:w ? Math.round(s / w * 10) / 10 : null, completo:n === R.crit.length && n > 0, n};
}
const rubSel = (v, rid, aid) => ((v.rub || {})[rid] || {})[aid] || {};
const rubAut = (v, rid, aid) => ((v.rubAuto || {})[rid] || {})[aid] || null;
function rubCon(t, v, rid, aid) {
  if (v.rubCon !== rid) return; const R = rubById(rid), r = rubNota(R, rubSel(v, rid, aid)); if (!r.completo) return;
  v.con = v.con || {}; v.con[aid] = t.escala === '1-5' ? Math.round(r.v / 4 * 10) / 10 : r.v;
}

/* Avaliar › Rúbricas: mais uma vista da grelha (como o Mapa) */
GICO.rub = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16M15 4v16"/></svg>';
{ const _gt = gToolbar; gToolbar = function (doms) { return _gt(doms).replace(`<button data-a="g-lay" data-k="dominio"`, `<button data-a="g-lay" data-k="rub" class="${UI.avMode !== 'dominio' && gLayout() === 'rub' ? 'on' : ''}" title="Rúbricas" aria-label="Rúbricas">${GICO.rub}<span>Rúbricas</span></button><button data-a="g-lay" data-k="dominio"`); }; }
{ const _vg = vGrelha; vGrelha = function (t) { if (gLayout() !== 'rub') return _vg(t); return gToolbar(false) + vRubricas(t); }; }
function vRubricas(t) {
  const v = avalOf(t.id, UI.p), us = (v.rubUse || []).filter(id => rubById(id));
  if (!us.includes(UI.rubSel)) UI.rubSel = us[0] || null;
  let h = `<div class="chips">${us.map(id => `<button class="chip ${id === UI.rubSel ? 'on' : ''}" data-a="rb-sel" data-id="${esc(id)}">${esc(rubById(id).nome)}</button>`).join('')}<button class="chip add" data-a="rb-usar">+ Usar rúbrica</button><button class="chip" data-a="rb-lib">Biblioteca</button></div>`;
  if (!UI.rubSel) return h + `<div class="card empty">${ART}<h3>Sem rúbricas neste período</h3><p>Use uma rúbrica para avaliar trabalhos, apresentações, coreografias, arbitragem ou o que quiser, com descritores claros para cada nível. Há modelos prontos e pode criar os seus.</p><button class="btn primary" data-a="rb-usar">Escolher uma rúbrica</button></div>`;
  const R = rubById(UI.rubSel), als = alunosOf(t), con = v.rubCon === R.id;
  h += `<div class="rb-bar"><button class="btn sm" data-a="rb-ver">Ver descritores</button><button class="btn sm" data-a="rb-print">Imprimir</button><label class="cli small"><input type="checkbox" data-in="rb-con"${con ? ' checked' : ''}> Conta como nota de Conhecimentos</label><span class="sp"></span><button class="btn sm danger" data-a="rb-tirar">Retirar deste período</button></div>`;
  if (con) h += `<p class="hint" style="margin:0">Quando um aluno tiver todos os critérios avaliados, a nota desta rúbrica passa a ser a sua nota de Conhecimentos.</p>`;
  h += `<div class="tbl-wrap"><table class="rb-t"><thead><tr><th class="l">Aluno</th>${R.crit.map(c => `<th title="${esc(c.n)}"><span class="rb-cn">${esc(c.n)}</span><span class="muted">${c.p}%</span></th>`).join('')}<th>Nota</th></tr></thead><tbody>`;
  als.forEach(al => { const sel = rubSel(v, R.id, al.id), au = rubAut(v, R.id, al.id), r = rubNota(R, sel);
    h += `<tr><td class="l nm">${esc(al.num ?? '')} ${esc(nome2(al.nome))}</td>${R.crit.map(c => { const l = sel[c.id], a = au ? au[c.id] : null;
      return `<td><button class="rb-c ${l != null ? 'l' + Math.round(l / Math.max(1, R.niv.length - 1) * 3) : ''}" data-a="rb-c" data-aid="${esc(al.id)}" data-c="${esc(c.id)}" aria-label="${esc(al.nome)}: ${esc(c.n)}">${l != null ? esc(nivAbr(R.niv[l].n)) : '·'}${a != null && a !== l ? `<i class="rb-au" title="O aluno escolheu ${esc(R.niv[a].n)}">${esc(nivAbr(R.niv[a].n))}</i>` : ''}</button></td>`; }).join('')}
      <td class="rb-n ${r.v != null && r.v < 10 ? 'low' : ''}">${r.v == null ? '—' : f1(r.v)}${r.v != null && !r.completo ? '<span class="muted">*</span>' : ''}</td></tr>`; });
  h += `</tbody></table></div><p class="hint">Toque numa célula para escolher o nível pelos descritores; passa logo ao aluno seguinte. * = faltam critérios. As letras pequenas mostram o que o aluno escolheu na autoavaliação (Turma › Aulas › Modo aluno › Rúbrica), quando é diferente.</p>`;
  return h;
}
let RBC = null;
function sheetRbCell(aid, cid) {
  RBC = {aid, cid}; const t = turma(), v = avalOf(t.id, UI.p), R = rubById(UI.rubSel), c = R.crit.find(x => x.id === cid), als = alunosOf(t), al = als.find(x => x.id === aid);
  if (!c || !al) return; const l = rubSel(v, R.id, aid)[cid], au = rubAut(v, R.id, aid), i = als.indexOf(al);
  const body = `<div class="form rb-cell"><div class="obs-nav"><button class="icon-btn" data-a="rb-mv" data-d="-1" aria-label="Aluno anterior"${i ? '' : ' disabled'}>‹</button>${avatar(al, 'sm')}<b style="flex:1">${esc(al.nome)}</b><button class="icon-btn" data-a="rb-mv" data-d="1" aria-label="Aluno seguinte"${i < als.length - 1 ? '' : ' disabled'}>›</button></div>
    <div class="chips">${R.crit.map(x => `<button class="chip ${x.id === cid ? 'on' : ''}" data-a="rb-crit" data-c="${esc(x.id)}">${esc(x.n)}</button>`).join('')}</div>
    ${au && au[cid] != null ? `<p class="small" style="margin:0">Na autoavaliação escolheu: <b>${esc(R.niv[au[cid]].n)}</b></p>` : ''}
    <div class="rb-ops">${R.niv.map((n, j) => `<button class="rb-op l${Math.round(j / Math.max(1, R.niv.length - 1) * 3)}${l === j ? ' on' : ''}" data-a="rb-set" data-l="${j}"><b>${esc(n.n)} <span class="muted">${n.v}</span></b><span>${esc(c.d[j] || '')}</span></button>`).join('')}</div>
    ${l != null ? '<button class="link" data-a="rb-set" data-l="-1">Limpar</button>' : ''}</div>`;
  const foot = `<button class="btn primary" data-a="sh-close">Feito</button>`;
  if ($('#sheet').hidden) openSheet(c.n, body, foot); else updSheet(body, foot);
}
function rbGuardar(t, v) { touchAval(v); }

/* Biblioteca e editor */
function sheetRubLib(modo) {
  const t = turma(), v = avalOf(t.id, UI.p), us = v.rubUse || [], usar = modo === 'usar';
  const body = `<div class="form"><p class="hint" style="margin:0">${usar ? 'Escolha a rúbrica a usar nesta turma no ' + esc(perLabel(UI.p, true)) + '.' : 'Os modelos prontos não se editam: duplique-os para os adaptar.'} As suas rúbricas vão no pacote do grupo de EF (Definições › Grupo de EF).</p>
    <div class="list">${rubAll().map(R => `<div class="li"><span class="who"><div class="nm">${esc(R.nome)}${R.base ? ' <span class="tag">modelo</span>' : ''}</div><div class="meta">${R.crit.length} critérios · ${R.niv.map(n => esc(n.n)).join(' / ')}${R.autor ? ' · ' + esc(R.autor) : ''}</div></span>
      ${usar ? (us.includes(R.id) ? '<span class="muted small">em uso</span>' : `<button class="btn sm primary" data-a="rb-add" data-id="${esc(R.id)}">Usar</button>`) : `<button class="btn sm" data-a="rb-dup" data-id="${esc(R.id)}">Duplicar</button>${R.base ? '' : `<button class="btn sm" data-a="rb-ed" data-id="${esc(R.id)}">Editar</button>`}`}</div>`).join('')}</div>
    <button class="btn" data-a="rb-novo">+ Nova rúbrica</button></div>`;
  const tit = usar ? 'Usar uma rúbrica' : 'Biblioteca de rúbricas';
  if ($('#sheet').hidden) openSheet(tit, body, ''); else { updSheet(body, ''); const h = $('#sheet .sh-h h2'); if (h) h.textContent = tit; }
}
function sheetRubEd(R) {
  UI.draft = R; const ln = R.niv.length;
  const body = `<div class="form rb-ed"><div class="field"><label for="rb-nome">Nome</label><input id="rb-nome" type="text" value="${esc(R.nome)}" placeholder="Ex.: Relatório da visita de estudo"></div>
    <div class="field"><span class="lbl">Níveis (nome e valor de 0 a 20)</span><div class="rb-nivs">${R.niv.map((n, j) => `<div class="rb-niv"><input type="text" data-rb="niv-n" data-j="${j}" value="${esc(n.n)}" aria-label="Nome do nível ${j + 1}"><input type="number" min="0" max="20" step="0.5" data-rb="niv-v" data-j="${j}" value="${n.v}" aria-label="Valor do nível ${j + 1}"></div>`).join('')}</div>
      <div class="btn-row">${ln < 5 ? '<button class="btn sm" data-a="rb-niv" data-d="1">+ Nível</button>' : ''}${ln > 2 ? '<button class="btn sm" data-a="rb-niv" data-d="-1">− Nível</button>' : ''}</div></div>
    ${R.crit.map((c, i) => `<div class="card form rb-cr"><div class="rb-crh"><input type="text" data-rb="c-n" data-i="${i}" value="${esc(c.n)}" placeholder="Critério" aria-label="Critério ${i + 1}"><label class="small">Peso <input type="number" min="1" max="100" data-rb="c-p" data-i="${i}" value="${c.p}" aria-label="Peso em %"> %</label><button class="icon-btn" data-a="rb-cdel" data-i="${i}" aria-label="Retirar critério">×</button></div>
      ${R.niv.map((n, j) => `<label class="rb-d"><span>${esc(n.n)}</span><textarea rows="2" data-rb="c-d" data-i="${i}" data-j="${j}" aria-label="${esc(c.n)}: ${esc(n.n)}">${esc(c.d[j] || '')}</textarea></label>`).join('')}</div>`).join('')}
    <button class="btn" data-a="rb-cadd">+ Critério</button>
    <p class="hint" style="margin:0">Os pesos não precisam de somar 100: a nota é a média pesada dos níveis. Escreva os descritores como o que o aluno faz ("Executa a sequência sem paragens"), para servirem também na autoavaliação.</p></div>`;
  const novo = !(CFG.rub || []).some(x => x.id === R.id), foot = `${novo ? '<button class="btn" data-a="rb-lib">Cancelar</button>' : '<button class="btn danger" data-a="rb-del">Apagar</button>'}<button class="btn primary" data-a="rb-save">Guardar</button>`;
  if ($('#sheet').hidden) openSheet(novo ? 'Nova rúbrica' : 'Editar rúbrica', body, foot); else updSheet(body, foot);
}
function rubLer() {
  const R = UI.draft; R.nome = ($('#rb-nome') || {}).value || R.nome;
  document.querySelectorAll('#sheet [data-rb]').forEach(el => { const k = el.dataset.rb, i = +el.dataset.i, j = +el.dataset.j;
    if (k === 'niv-n') R.niv[j].n = el.value.trim() || R.niv[j].n; else if (k === 'niv-v') R.niv[j].v = Math.max(0, Math.min(20, parseNum(el.value) ?? R.niv[j].v));
    else if (k === 'c-n') R.crit[i].n = el.value.trim(); else if (k === 'c-p') R.crit[i].p = Math.max(1, Math.min(100, parseInt(el.value, 10) || 1)); else if (k === 'c-d') R.crit[i].d[j] = el.value.trim(); });
  return R;
}
function rubDocHtml(t, R, comNotas) {
  const v = avalOf(t.id, UI.p);
  let h = `<section class="rel rb-doc">${docHead('Rúbrica · ' + R.nome, t.nome + ' · ' + perLabel(UI.p, true))}<table class="rel-t rb-dt"><thead><tr><th class="l">Critério</th>${R.niv.map(n => `<th>${esc(n.n)} <span class="muted">(${n.v})</span></th>`).join('')}</tr></thead><tbody>${R.crit.map(c => `<tr><td class="l"><b>${esc(c.n)}</b><br><span class="muted">${c.p}%</span></td>${R.niv.map((n, j) => `<td class="l">${esc(c.d[j] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  if (comNotas) h += `<h2>Resultados</h2><table class="rel-t"><thead><tr><th>N.º</th><th class="l">Aluno</th>${R.crit.map(c => `<th>${esc(c.n)}</th>`).join('')}<th>Nota</th></tr></thead><tbody>${alunosOf(t).map(al => { const s = rubSel(v, R.id, al.id), r = rubNota(R, s); return `<tr><td>${esc(al.num ?? '')}</td><td class="l">${esc(al.nome)}</td>${R.crit.map(c => `<td>${s[c.id] != null ? esc(R.niv[s[c.id]].n) : '—'}</td>`).join('')}<td><b>${r.v == null ? '—' : f1(r.v)}</b></td></tr>`; }).join('')}</tbody></table>`;
  return h + '</section>';
}
// Ficha do aluno e relatório individual: o que escolheu o professor, com os descritores
function rubAlunoHtml(t, p, al, rel) {
  const v = avalOf(t.id, p), us = (v.rubUse || []).map(rubById).filter(Boolean).filter(R => Object.keys(rubSel(v, R.id, al.id)).length); if (!us.length) return '';
  const blocos = us.map(R => { const s = rubSel(v, R.id, al.id), r = rubNota(R, s);
    return `<div class="rb-al"><b>${esc(R.nome)}</b> <span class="pill">${r.v == null ? '—' : f1(r.v)}${r.completo ? '' : ' (incompleta)'}</span><ul>${R.crit.filter(c => s[c.id] != null).map(c => `<li><b>${esc(c.n)}:</b> ${esc(R.niv[s[c.id]].n)} — ${esc(c.d[s[c.id]] || '')}</li>`).join('')}</ul></div>`; }).join('');
  return rel ? `<h2>Rúbricas</h2>${blocos}` : `<div class="card"><b>Rúbricas · ${esc(perLabel(p, true))}</b>${blocos}</div>`;
}
{ const _ap = vAlunoPage; vAlunoPage = function (t, al, split) { let h = _ap(t, al, split); if ((UI.atab || 'resumo') !== 'resumo') return h; const x = rubAlunoHtml(t, UI.p, al); if (!x) return h; const i = h.lastIndexOf('</div>'); return h.slice(0, i) + x + h.slice(i); }; }
{ const _rh = relHtml; relHtml = function (t, p, al) { const h = _rh(t, p, al), x = rubAlunoHtml(t, p, al, true); if (!x) return h; const i = h.lastIndexOf('</section>'); return i < 0 ? h + x : h.slice(0, i) + x + h.slice(i); }; }

/* Modo aluno › Rúbrica (autoavaliação) */
KIN.rub = 'Rúbrica';
{ const _sm = sheetModo; sheetModo = function () { _sm();
  if (!KI || KI.act !== 'rub') return; const t = turma(), v = avalOf(t.id, UI.p), us = (v.rubUse || []).filter(id => rubById(id));
  if (!us.includes(KI.rub)) KI.rub = us[0] || null; const f = $('#sheet .form'); if (!f) return;
  f.querySelectorAll('.chips').forEach(x => x.remove());
  f.insertAdjacentHTML('beforeend', us.length ? `<p class="hint">Cada aluno lê os descritores de cada critério, escritos como o que faz, e escolhe o nível em que se vê. Aparece ao lado da sua avaliação em Avaliar › Rúbricas.</p><div class="chips">${us.map(id => `<button class="chip ${id === KI.rub ? 'on' : ''}" data-a="ki-rub" data-id="${esc(id)}">${esc(rubById(id).nome)}</button>`).join('')}</div>` : '<p class="hint">Ainda não há rúbricas em uso neste período: escolha uma em Avaliar › Rúbricas.</p>'); }; }
{ const _kr = kiRender; kiRender = function () {
  if (!(KI && KI.act === 'rub' && KI.aid && !KI.fim)) return _kr();
  const t = S.turmas[KI.t], R = rubById(KI.rub), al = alunosOf(t).find(x => x.id === KI.aid), el = kiEl();
  let h = `<header class="ki-h"><div><span class="eyebrow">Modo aluno · Rúbrica</span><b>${esc(R.nome)}</b></div><button class="btn" data-a="ki-exit">Sair (professor)</button></header><div class="ki-b">
    <h1 class="ki-t">${esc(al.nome.split(' ')[0])}, em que nível te vês?</h1><p class="ki-s">Lê as frases de cada critério e escolhe a que descreve melhor o teu trabalho.</p>`;
  h += R.crit.map(c => `<div class="ki-c"><p><b>${esc(c.n)}</b></p><div class="ki-op rb-kop">${R.niv.map((n, j) => `<button class="${KI.r[c.id] === j ? 'on' : ''}" data-a="ki-r" data-id="${esc(c.id)}" data-v="${j}"><b>${esc(n.n)}</b><br>${esc(c.d[j] || '')}</button>`).join('')}</div></div>`).join('');
  h += `<button class="btn primary big block" data-a="ki-save"${Object.keys(KI.r).length < R.crit.length ? ' disabled' : ''}>Entregar</button></div>`;
  el.innerHTML = h; el.hidden = false; document.body.classList.add('locked'); }; }
{ const _ks = kiSave; kiSave = function () {
  if (!(KI && KI.act === 'rub')) return _ks();
  const v = avalOf(KI.t, UI.p); v.rubAuto = v.rubAuto || {}; (v.rubAuto[KI.rub] = v.rubAuto[KI.rub] || {})[KI.aid] = Object.assign({}, KI.r);
  touchAval(v); KI.fim = 'Obrigado! A tua autoavaliação foi entregue.'; KI.done = [...new Set([...(KI.done || []), KI.aid])]; kiRender(); }; }
{ const _go = A['ki-go']; A['ki-go'] = el => { if (KI && KI.act === 'rub' && !KI.rub) { toast('Escolha primeiro uma rúbrica em uso.', 'bad'); return; } _go(el); }; }

/* Pacote do grupo de EF */
PKG_PARTES.push(['rub', 'Rúbricas']);
{ const _b = pkgBuild; pkgBuild = function () { return Object.assign(_b(), {rub:(CFG.rub || []).map(R => Object.assign({autor:CFG.prof || ''}, clone(R)))}); }; }
{ const _r = pkgResumo; pkgResumo = function (k, P) { if (k === 'rub') return (P.rub || []).length ? P.rub.map(R => R.nome).join(', ') : null; return _r(k, P); }; }
{ const _a = pkgApply; pkgApply = function (P, sel) {
  if (sel.rub && Array.isArray(P.rub)) { const L = CFG.rub = CFG.rub || [];
    P.rub.forEach(R => { if (!R || !R.nome || !Array.isArray(R.crit) || !Array.isArray(R.niv) || L.some(x => x.id === R.id || norm(x.nome) === norm(R.nome))) return;
      L.push({id:R.id || 'rb' + uid(), nome:String(R.nome), autor:R.autor || '', niv:R.niv.slice(0, 5).map(n => ({n:String(n.n), v:+n.v || 0})), crit:R.crit.map(c => ({id:c.id || uid(), n:String(c.n), p:+c.p || 1, d:(c.d || []).map(String)}))}); }); }
  return _a(P, sel); }; }

Object.assign(A, {
  'rb-sel': el => { UI.rubSel = el.dataset.id; render(); },
  'rb-usar': () => sheetRubLib('usar'),
  'rb-lib': () => sheetRubLib('lib'),
  'rb-add': el => { const t = turma(), v = avalOf(t.id, UI.p); v.rubUse = v.rubUse || []; if (!v.rubUse.includes(el.dataset.id)) v.rubUse.push(el.dataset.id); UI.rubSel = el.dataset.id; touchAval(v); closeSheet(); render(); },
  'rb-tirar': el => { if (!armed(el, 'Retirar? As avaliações ficam guardadas')) return; const t = turma(), v = avalOf(t.id, UI.p); v.rubUse = (v.rubUse || []).filter(x => x !== UI.rubSel); if (v.rubCon === UI.rubSel) v.rubCon = null; touchAval(v); UI.rubSel = null; render(); },
  'rb-ver': () => { const R = rubById(UI.rubSel); openSheet(R.nome, `<div class="tbl-wrap">${rubDocHtml(turma(), R, false).replace(/<section[^>]*>|<\/section>|<header[\s\S]*?<\/header>/g, '')}</div>`, ''); },
  'rb-print': () => printDoc('Rúbrica', rubDocHtml(turma(), rubById(UI.rubSel), true)),
  'rb-c': el => sheetRbCell(el.dataset.aid, el.dataset.c),
  'rb-crit': el => sheetRbCell(RBC.aid, el.dataset.c),
  'rb-mv': el => { const als = alunosOf(turma()), i = als.findIndex(a => a.id === RBC.aid), n = als[i + +el.dataset.d]; if (n) sheetRbCell(n.id, RBC.cid); },
  'rb-set': el => { const t = turma(), v = avalOf(t.id, UI.p), R = rubById(UI.rubSel), l = +el.dataset.l; v.rub = v.rub || {}; const o = (v.rub[R.id] = v.rub[R.id] || {})[RBC.aid] = (v.rub[R.id] || {})[RBC.aid] || {};
    if (l < 0) delete o[RBC.cid]; else o[RBC.cid] = l; rubCon(t, v, R.id, RBC.aid); rbGuardar(t, v); render();
    const als = alunosOf(t), i = als.findIndex(a => a.id === RBC.aid); if (l >= 0 && als[i + 1]) sheetRbCell(als[i + 1].id, RBC.cid); else sheetRbCell(RBC.aid, RBC.cid); },
  'rb-novo': () => sheetRubEd({id:'rb' + uid(), nome:'', niv:NIV4(), crit:[{id:uid(), n:'', p:50, d:[]}, {id:uid(), n:'', p:50, d:[]}]}),
  'rb-dup': el => { const R = clone(rubById(el.dataset.id)); R.id = 'rb' + uid(); R.nome = R.nome + ' (cópia)'; delete R.base; R.crit.forEach(c => { c.id = uid(); }); sheetRubEd(R); },
  'rb-ed': el => { const R = (CFG.rub || []).find(x => x.id === el.dataset.id); if (R) sheetRubEd(clone(R)); },
  'rb-niv': el => { const R = rubLer(); if (+el.dataset.d > 0) R.niv.push({n:'Nível ' + (R.niv.length + 1), v:20}); else { R.niv.pop(); R.crit.forEach(c => { c.d = c.d.slice(0, R.niv.length); }); } sheetRubEd(R); },
  'rb-cadd': () => { const R = rubLer(); R.crit.push({id:uid(), n:'', p:20, d:[]}); sheetRubEd(R); const b = $('#sheet .sh-b'); if (b) b.scrollTop = b.scrollHeight; },
  'rb-cdel': el => { const R = rubLer(); if (R.crit.length > 1) R.crit.splice(+el.dataset.i, 1); sheetRubEd(R); },
  'rb-save': () => { const R = rubLer(); R.crit = R.crit.filter(c => c.n); if (!R.nome.trim() || !R.crit.length) { toast('Indique o nome e pelo menos um critério.', 'bad'); sheetRubEd(R); return; }
    const L = CFG.rub = CFG.rub || [], i = L.findIndex(x => x.id === R.id); if (i >= 0) L[i] = R; else L.push(R); Store.save('cfg', CFG); toast('Rúbrica guardada.'); sheetRubLib('lib'); render(); },
  'rb-del': el => { if (!armed(el, 'Apagar a rúbrica?')) return; CFG.rub = (CFG.rub || []).filter(x => x.id !== UI.draft.id); Store.save('cfg', CFG); sheetRubLib('lib'); render(); },
  'ki-rub': el => { KI.rub = el.dataset.id; sheetModo(); }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'rb-con') { const t = turma(), v = avalOf(t.id, UI.p); v.rubCon = el.checked ? UI.rubSel : null; if (el.checked) alunosOf(t).forEach(al => rubCon(t, v, UI.rubSel, al.id)); touchAval(v); render(); } });
