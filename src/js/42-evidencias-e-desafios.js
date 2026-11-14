/* ---------- avaliação formativa: evidências por competência e próximo desafio ---------- */
// Em cada aula regista-se, com um toque, se o aluno conseguiu (1) ou ainda não (0) uma competência observada.
// Guarda-se no período da data: v.ev[aluno][matéria][competência] = [[data, 1|0], ...].
// Uma competência conta como dominada quando a última observação é positiva e já houve pelo menos duas positivas.
const isMan = (v, aid, m) => !!(((v.man || {})[aid] || {})[m]);
const evMap = (v, aid, m) => (((v.ev || {})[aid] || {})[m]) || {};
function evState(arr) {
  if (!arr || !arr.length) return null; const ok = arr.filter(x => x[1]).length, last = arr[arr.length - 1][1];
  return last && ok >= 2 ? 'dom' : ok ? 'prog' : 'nao';
}
const EVN = {dom:'Dominada pelas evidências', prog:'Em progresso', nao:'Ainda não conseguiu'};
function evDots(arr, n) {
  if (!arr || !arr.length) return '';
  return `<span class="evd" title="${arr.map(x => fmtDate(x[0], {day:'numeric', month:'short'}) + ': ' + (x[1] ? 'conseguiu' : 'ainda não')).join('\n')}">${arr.slice(-(n || 6)).map(x => `<i class="${x[1] ? 'ok' : 'no'}"></i>`).join('')}</span>`;
}
function evAdd(t, d, aid, m, cid, ok) {
  const v = avalOf(t.id, periodOf(d)); v.ev = v.ev || {}; const a = v.ev[aid] = v.ev[aid] || {}, b = a[m] = a[m] || {}, l = b[cid] = b[cid] || [];
  const i = l.findIndex(x => x[0] === d); if (i >= 0) { if (l[i][1] === ok) l.splice(i, 1); else l[i][1] = ok; } else { l.push([d, ok]); l.sort((x, y) => x[0].localeCompare(y[0])); }
  if (!l.length) delete b[cid]; touchAval(v);
  evApply(t, periodOf(d), m, [aid]); // as evidências contam logo, sem passo extra
}
// Passa as competências dominadas pelas evidências para as assinaladas e recalcula o nível.
function evApply(t, p, m, aids) {
  const v = avalOf(t.id, p); let n = 0; v.comp = v.comp || {};
  aids.forEach(aid => {
    const ev = evMap(v, aid, m), dom = Object.keys(ev).filter(c => evState(ev[c]) === 'dom'); if (!dom.length) return;
    const tk = (v.comp[aid] = v.comp[aid] || {})[m] = (v.comp[aid] || {})[m] || {}; let ch = false;
    dom.forEach(c => { if (!tk[c]) { tk[c] = true; ch = true; } });
    if (ch) { if (!isMan(v, aid, m)) { v.af = v.af || {}; v.af[aid] = v.af[aid] || {}; v.af[aid][m] = lvFromTicks(t.ciclo, m, tk); } n++; }
  });
  if (n) touchAval(v); return n;
}

/* folha "Observar": uma competência de cada vez, a turma toda */
function sheetObs(d, ms) {
  const t = turma(); ms = ms && ms.length ? ms : matsOf(t, periodOf(d)); if (!ms.length) ms = (MATS[t.ciclo] || GR).slice(0, 6);
  const O = UI.obs = UI.obs && UI.obs.d === d ? UI.obs : {d, ms, m:ms[0], k:null, cids:[], modo:'aluno', aid:null};
  O.ms = ms; if (!ms.includes(O.m)) O.m = ms[0];
  obsRender(true);
}
// Assinala (ou retira) competências de um aluno e recalcula o nível, como na lista do Avaliar.
function tickSet(t, p, aid, m, match, on) {
  const v = avalOf(t.id, p); v.comp = v.comp || {}; v.comp[aid] = v.comp[aid] || {}; const tk = v.comp[aid][m] = v.comp[aid][m] || {};
  compsOf(t.ciclo, m).forEach(c => { if (match(c.id)) { if (on) tk[c.id] = true; else delete tk[c.id]; } });
  v.af = v.af || {}; v.af[aid] = v.af[aid] || {};
  if (Object.keys(tk).length) v.af[aid][m] = lvFromTicks(t.ciclo, m, tk); else { delete v.comp[aid][m]; }
  if (v.man && v.man[aid]) delete v.man[aid][m];
  touchAval(v);
}
function obsRender(open) {
  const t = turma(), O = UI.obs, p = periodOf(O.d), v = avalOf(t.id, p), cs = compsOf(t.ciclo, O.m);
  const als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0);
  let b = `<div class="form obs"><div class="seg block">${[['aluno', 'Por aluno'], ['turma', 'Por competência']].map(([k, n]) => `<button data-a="obs-modo" data-k="${k}" class="${O.modo === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="chips">${O.ms.map(m => `<button class="chip ${m === O.m ? 'on' : ''}" data-a="obs-m" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`).join('')}</div>`;
  if (!cs.length) b += '<p class="hint">Esta matéria não tem competências descritas neste ciclo.</p>';
  else if (O.modo === 'aluno') {
    if (!als.some(al => al.id === O.aid)) O.aid = als[0] && als[0].id; const i = als.findIndex(al => al.id === O.aid), al = als[i];
    if (al) { const l = (lvOf(v, al.id, O.m) || {}).l;
      b += `<div class="obs-nav"><button class="icon-btn" data-a="obs-al" data-d="-1" aria-label="Aluno anterior"${i <= 0 ? ' disabled' : ''}>‹</button>${avatar(al, 'sm')}<select data-in="obs-al" aria-label="Aluno">${als.map(x => `<option value="${esc(x.id)}"${x.id === al.id ? ' selected' : ''}>${esc(x.num ?? '')} · ${esc(x.nome)}</option>`).join('')}</select>${l ? `<span class="lvpill ${GLV[l]}">${l}</span>` : ''}<button class="icon-btn" data-a="obs-al" data-d="1" aria-label="Aluno seguinte"${i >= als.length - 1 ? ' disabled' : ''}>›</button></div>
        ${(() => { const so = semObs(t, p, O.m).filter(x => x.al.id !== al.id).slice(0, 4); return so.length ? `<div class="obs-falta"><span class="small muted">Há mais tempo sem observação:</span>${so.map(x => `<button class="chip" data-a="obs-ir" data-id="${esc(x.al.id)}">${esc(nome2(x.al.nome))} · ${x.n} aulas</button>`).join('')}</div>` : ''; })()}
        <p class="hint" style="margin:0">Marque as competências que ${esc(al.nome.split(' ')[0])} já domina. O nível é calculado logo (PI, PE e PA: metade do nível).</p>
        <div class="cl obs-cl">${checkList(t.ciclo, O.m, tksOf(v, al.id, O.m), evMap(v, al.id, O.m), 'obs-tk', 'obs-all')}</div>`; }
  } else {
    if (!O.k) O.k = nivelTurma(t, O.m); let xs = cs.filter(c => c.k === O.k); if (!xs.length) { O.k = 'I'; xs = cs.filter(c => c.k === 'I'); }
    O.cids = (O.cids || []).filter(id => cs.some(c => c.id === id)); if (!O.cids.length) O.cids = xs.filter(c => !geralC(c)).slice(0, 3).map(c => c.id);
    const sel = O.cids.map(id => cs.find(c => c.id === id));
    b += `<div class="seg block">${['I', 'E', 'A'].filter(k => cs.some(c => c.k === k)).map(k => `<button data-a="obs-k" data-k="${k}" class="${O.k === k ? 'on' : ''}">${LVN[k]}</button>`).join('')}</div>
      <p class="hint" style="margin:0">Escolha até 4 competências e toque nas células: ✓ conseguiu, ✗ ainda não, vazio. Duas observações positivas (a última positiva) assinalam a competência.</p>
      <div class="ki-f">${xs.map(c => `<button class="chip ${O.cids.includes(c.id) ? 'on' : ''}" data-a="obs-c" data-id="${c.id}" title="${esc(c.txt)}">${c.of ? c.id + ' · ' : ''}${esc(encurta(cAluno(t.ciclo, O.m, c), 70))}</button>`).join('')}</div>
      <div class="tbl-wrap"><table class="obs-t"><thead><tr><th class="l">Aluno</th>${sel.map((c, j) => `<th title="${esc(c.txt)}">${j + 1}<span>${esc(c.id)}</span></th>`).join('')}</tr></thead><tbody>${als.map(al => { const ev = evMap(v, al.id, O.m), tk = tksOf(v, al.id, O.m) || {};
        return `<tr><td class="l nm">${esc(nome2(al.nome))}</td>${sel.map(c => { const h = (ev[c.id] || []).find(x => x[0] === O.d), st = h ? (h[1] ? 'ok' : 'no') : '';
          return `<td><button class="ob ${st} on" data-a="obs-cell" data-aid="${esc(al.id)}" data-id="${c.id}" aria-label="${esc(al.nome)}, ${esc(c.id)}">${st === 'ok' ? '✓' : st === 'no' ? '✗' : tk[c.id] ? '•' : ''}</button></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>
      <ol class="obs-leg small">${sel.map(c => `<li><b>${esc(c.id)}</b> ${esc(cAluno(t.ciclo, O.m, c))}</li>`).join('')}</ol>`;
  }
  b += '</div>';
  const foot = `<button class="btn primary" data-a="obs-done">Feito</button>`;
  if (open) openSheet('Observar · ' + fmtDate(O.d, {day:'numeric', month:'short'}), b, foot); else { const el = $('#sheet .sh-b'), y = el ? el.scrollTop : 0; updSheet(b, foot); if (el) el.scrollTop = y; }
}
Object.assign(A, {
  'obs-ir': el => { UI.obs.aid = el.dataset.id; obsRender(); $('#sheet .sh-b').scrollTop = 0; },
  'obs-modo': el => { UI.obs.modo = el.dataset.k; obsRender(); },
  'obs-al': el => { const t = turma(), O = UI.obs, p = periodOf(O.d), als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0), i = als.findIndex(al => al.id === O.aid) + +el.dataset.d; if (als[i]) { O.aid = als[i].id; obsRender(); $('#sheet .sh-b').scrollTop = 0; } },
  'obs-all': el => { const t = turma(), O = UI.obs; tickSet(t, periodOf(O.d), O.aid, O.m, id => id[0] === el.dataset.k, el.dataset.v === '1'); obsRender(); },
  'obs-c': el => { const O = UI.obs, id = el.dataset.id, i = O.cids.indexOf(id); if (i >= 0) O.cids.splice(i, 1); else if (O.cids.length < 4) O.cids.push(id); else toast('No máximo 4 competências de cada vez.'); obsRender(); },
  'obs-cell': el => { const t = turma(), O = UI.obs, p = periodOf(O.d), aid = el.dataset.aid, id = el.dataset.id, h = (evMap(avalOf(t.id, p), aid, O.m)[id] || []).find(x => x[0] === O.d);
    if (!h) evAdd(t, O.d, aid, O.m, id, 1); else if (h[1]) evAdd(t, O.d, aid, O.m, id, 0); else evAdd(t, O.d, aid, O.m, id, 0); obsRender(); },
  'cl-of': () => { UI.clOf = !UI.clOf; if (UI.obs && !$('#sheet').hidden && $('#sheet .obs')) obsRender(); else if (typeof gEditor === 'function' && SEL) gEditor(); }
});
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k || !UI.obs) return;
  if (k === 'obs-al') { UI.obs.aid = el.value; obsRender(); }
  else if (k === 'obs-tk') { const t = turma(), O = UI.obs; tickSet(t, periodOf(O.d), O.aid, O.m, id => id === el.dataset.id, el.checked); obsRender(); } });

/* próximo desafio: a primeira competência por dominar, escrita para o aluno */
function paraAluno(s) {
  s = String(s || '').replace(/\b([a-zçãõáéíóúâêô]+)-se\b/gi, '$1-te')
    .replace(/\bos seus\b/gi, 'os teus').replace(/\bas suas\b/gi, 'as tuas').replace(/\bo seu\b/gi, 'o teu').replace(/\ba sua\b/gi, 'a tua')
    .replace(/\bseus\b/gi, 'teus').replace(/\bsuas\b/gi, 'tuas').replace(/\bseu\b/gi, 'teu').replace(/\bsua\b/gi, 'tua').replace(/\bsi próprio\b/gi, 'ti próprio').replace(/\bconsigo\b/gi, 'contigo');
  return s;
}
const encurta = (s, n) => s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:]$/, '') + '…';
function desafioDe(t, p, al, m) {
  const v = avalOf(t.id, p), own = ((v.des || {})[al.id] || {})[m]; if (own) return {txt:own, own:true};
  const l = (lvOf(v, al.id, m) || {}).l, ev = evMap(v, al.id, m), tk = Object.assign({}, tksOf(v, al.id, m) || {});
  Object.keys(ev).forEach(c => { if (evState(ev[c]) === 'dom') tk[c] = true; });
  const x = compSplit(t.ciclo, m, l || 'NI', Object.values(tk).some(Boolean) ? tk : null); if (!x || !x.mel.length) return null;
  // Preferem-se competências motoras ou táticas observáveis às de cooperação, regras ou conhecimento.
  const geral = y => /^(Adequa|Coopera|Aceita|Conhece|Identifica|Respeita|Cumpre|Compreende|Interpreta|Analisa|Aprecia|Trata|Preserva|Participa)/i.test(y.txt);
  const c = x.mel.find(y => evState(ev[y.id]) === 'prog') || x.mel.find(y => !geral(y)) || x.mel[0];
  const cx = c.ctx ? c.ctx.split(' — ').pop().replace(/,?\s*(realizando|designadamente|faz)$/i, '') : '', ctx = cx.length <= 95 ? cx : '';
  return {txt:paraAluno((ctx ? ctx + ': ' + c.txt.charAt(0).toLowerCase() + c.txt.slice(1) : c.txt)), c, ev:ev[c.id]};
}
function desafioHtml(t, p, al, m, edit) {
  const d = desafioDe(t, p, al, m); if (!d) return '';
  return `<div class="desf"><span class="desf-k">Próximo desafio</span><p>${esc(encurta(d.txt, 260))}</p>${d.ev ? `<span class="small muted">Evidências: ${evDots(d.ev)}</span>` : ''}${edit ? `<button class="link" data-a="des-edit" data-aid="${esc(al.id)}" data-m="${esc(m)}">${d.own ? 'Editar o desafio' : 'Escrever outro desafio'}</button>` : ''}</div>`;
}
function sheetDes(aid, m) {
  const t = turma(), v = avalOf(t.id, UI.p), al = alunosOf(t).find(x => x.id === aid), d = desafioDe(t, UI.p, al, m) || {txt:''};
  UI.draft = {aid, m};
  openSheet('Próximo desafio · ' + m, `<div class="form"><p class="hint">Uma frase curta, observável, dirigida ao aluno. Deixe em branco para voltar à sugestão automática (a primeira competência que falta).</p><textarea id="des-txt" rows="4">${esc(((v.des || {})[aid] || {})[m] || d.txt)}</textarea></div>`, `<button class="btn primary" data-a="des-save">Guardar</button>`);
}
// Cartões de desafio para entregar aos alunos (um por aluno, com as matérias do período).
function cartoesHtml(t, p) {
  const ms = matsOf(t, p);
  return `<section class="rel">${docHead('Cartões de desafio · ' + t.nome, perLabel(p, true))}<div class="cards-des">${alunosOf(t).map(al => { const ls = ms.map(m => ({m, l:(lvOf(avalOf(t.id, p), al.id, m) || {}).l, d:desafioDe(t, p, al, m)})).filter(x => x.d);
    return `<div class="cdes"><b>${esc(al.nome)}</b>${ls.length ? ls.map(x => `<div class="cdes-m"><span>${esc(x.m)}${x.l ? ' · ' + esc(LVN[x.l]) : ''}</span><p>${esc(encurta(x.d.txt, 200))}</p></div>`).join('') : '<p class="small">Sem desafios: faltam níveis ou competências.</p>'}</div>`; }).join('')}</div></section>`;
}

Object.assign(A, {
  'obs-open': () => { const d = A['aula-save'](true); if (!d) return; sheetObs(d.data, d.materias); },
  'obs-m': el => { UI.obs.m = el.dataset.m; UI.obs.k = null; UI.obs.cids = []; obsRender(); },
  'obs-k': el => { UI.obs.k = el.dataset.k; UI.obs.cids = []; obsRender(); },
  'obs-done': () => { closeSheet(); render(); },
  'obs-apply': () => { const t = turma(), O = UI.obs, n = evApply(t, periodOf(O.d), O.m, alunosOf(t).map(a => a.id)); toast(n ? `Competências atualizadas em ${n} ${n === 1 ? 'aluno' : 'alunos'}; os níveis foram recalculados.` : 'Ainda não há competências dominadas pelas evidências (são precisas duas observações positivas).'); closeSheet(); render(); },
  'g-obs': () => sheetObs(today(), FOCUS && S.aulas[FOCUS] ? S.aulas[FOCUS].materias : null),
  'des-edit': el => sheetDes(el.dataset.aid, el.dataset.m),
  'des-save': () => { const t = turma(), v = avalOf(t.id, UI.p), {aid, m} = UI.draft, x = $('#des-txt').value.trim(), auto = (desafioDe(t, UI.p, alunosOf(t).find(a => a.id === aid), m) || {});
    v.des = v.des || {}; v.des[aid] = v.des[aid] || {};
    if (x && !(auto.txt === x && !auto.own)) v.des[aid][m] = x; else delete v.des[aid][m];
    touchAval(v); closeSheet(); render(); toast('Desafio guardado.'); },
  'doc-des': () => printDoc('Cartões de desafio', cartoesHtml(turma(), UI.p))
});
// Evolução das competências observadas de um aluno numa matéria.
function evList(t, v, al, m) {
  const ev = evMap(v, al.id, m), cs = compsOf(t.ciclo, m).filter(c => ev[c.id]); if (!cs.length) return '';
  return `<details class="evl"><summary>Evidências registadas nas aulas (${cs.length} ${cs.length === 1 ? 'competência' : 'competências'})</summary>${cs.map(c => { const st = evState(ev[c.id]); return `<div class="evr"><span>${cidOf(c)}${esc(encurta(c.txt, 110))}</span>${evDots(ev[c.id], 10)}<span class="pill ${st === 'dom' ? 'ok' : st === 'nao' ? 'bad' : 'inc'}">${EVN[st]}</span></div>`; }).join('')}</details>`;
}
A['man-clear'] = () => { const {c, col, al} = gHere(); if (!col || !al) return; gSnap(c, col); const v = c.v, tk = tksOf(v, al.id, col.m); if (tk) { v.af[al.id][col.m] = lvFromTicks(c.t.ciclo, col.m, tk); } if (v.man && v.man[al.id]) delete v.man[al.id][col.m]; touchAval(v); gRefresh(); toast('Nível de acordo com as competências.'); };
