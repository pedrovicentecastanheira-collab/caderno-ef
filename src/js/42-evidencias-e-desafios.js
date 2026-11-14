/* ---------- avaliação formativa: evidências por competência e próximo desafio ---------- */
// Em cada aula regista-se, com um toque, se o aluno conseguiu (1) ou ainda não (0) uma competência observada.
// Guarda-se no período da data: v.ev[aluno][matéria][competência] = [[data, 1|0], ...].
// Uma competência conta como dominada quando a última observação é positiva e já houve pelo menos duas positivas.
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
}
// Passa as competências dominadas pelas evidências para as assinaladas e recalcula o nível.
function evApply(t, p, m, aids) {
  const v = avalOf(t.id, p); let n = 0; v.comp = v.comp || {};
  aids.forEach(aid => {
    const ev = evMap(v, aid, m), dom = Object.keys(ev).filter(c => evState(ev[c]) === 'dom'); if (!dom.length) return;
    const tk = (v.comp[aid] = v.comp[aid] || {})[m] = (v.comp[aid] || {})[m] || {}; let ch = false;
    dom.forEach(c => { if (!tk[c]) { tk[c] = true; ch = true; } });
    if (ch) { v.af = v.af || {}; v.af[aid] = v.af[aid] || {}; v.af[aid][m] = lvFromTicks(t.ciclo, m, tk); n++; }
  });
  if (n) touchAval(v); return n;
}

/* folha "Observar": uma competência de cada vez, a turma toda */
function sheetObs(d, ms) {
  const t = turma(); ms = ms && ms.length ? ms : matsOf(t, periodOf(d)); if (!ms.length) ms = (MATS[t.ciclo] || GR).slice(0, 6);
  const O = UI.obs = UI.obs && UI.obs.d === d ? UI.obs : {d, ms, m:ms[0], k:null, cid:null};
  O.ms = ms; if (!ms.includes(O.m)) O.m = ms[0];
  obsRender(true);
}
function obsRender(open) {
  const t = turma(), O = UI.obs, p = periodOf(O.d), v = avalOf(t.id, p), cs = compsOf(t.ciclo, O.m);
  if (!O.k) O.k = nivelTurma(t, O.m); let xs = cs.filter(c => c.k === O.k); if (!xs.length) { O.k = 'I'; xs = cs.filter(c => c.k === 'I'); }
  if (!xs.some(c => c.id === O.cid)) O.cid = xs[0] && xs[0].id; const c = xs.find(x => x.id === O.cid);
  const als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0);
  const body = `<div class="form obs"><p class="hint" style="margin:0">Escolha a competência que está a observar e toque em <b>✓</b> (conseguiu) ou <b>✗</b> (ainda não). Duas observações positivas, sendo a última positiva, contam como competência dominada.</p>
    <div class="chips">${O.ms.map(m => `<button class="chip ${m === O.m ? 'on' : ''}" data-a="obs-m" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`).join('')}</div>
    ${cs.length ? `<div class="seg block">${['I', 'E', 'A'].filter(k => cs.some(x => x.k === k)).map(k => `<button data-a="obs-k" data-k="${k}" class="${O.k === k ? 'on' : ''}">${LVN[k]}</button>`).join('')}</div>
    <div class="field"><label for="obs-c">Competência</label><select id="obs-c" data-in="obs-c">${xs.map(x => `<option value="${x.id}"${x.id === O.cid ? ' selected' : ''}>${esc((x.of ? x.id + ' · ' : '') + x.txt.slice(0, 90) + (x.txt.length > 90 ? '…' : ''))}</option>`).join('')}</select></div>
    ${c ? `<div class="obs-c">${c.ctx ? `<span class="cctx">${esc(c.ctx)}:</span> ` : ''}${cidOf(c)}${esc(c.txt)}</div>` : ''}
    <div class="obs-l">${als.map(al => { const arr = (evMap(v, al.id, O.m))[O.cid], hoje = (arr || []).find(x => x[0] === O.d), st = evState(arr), tk = (tksOf(v, al.id, O.m) || {})[O.cid];
      return `<div class="obs-r"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}<span class="small muted">${tk ? 'assinalada' : st ? EVN[st] : ''} ${evDots(arr)}</span></span>
        <button class="ob ok${hoje && hoje[1] ? ' on' : ''}" data-a="obs-set" data-aid="${esc(al.id)}" data-v="1" aria-label="${esc(al.nome)} conseguiu">✓</button><button class="ob no${hoje && !hoje[1] ? ' on' : ''}" data-a="obs-set" data-aid="${esc(al.id)}" data-v="0" aria-label="${esc(al.nome)} ainda não">✗</button></div>`; }).join('')}</div>` : '<p class="hint">Esta matéria não tem competências descritas neste ciclo.</p>'}</div>`;
  const foot = `<button class="btn" data-a="sh-close">Fechar</button><button class="btn primary" data-a="obs-apply">Atualizar competências assinaladas</button>`;
  if (open) openSheet('Observar · ' + fmtDate(O.d, {day:'numeric', month:'short'}), body, foot); else { const b = $('#sheet .sh-b'), y = b ? b.scrollTop : 0; updSheet(body, foot); if (b) b.scrollTop = y; }
}

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
  'obs-m': el => { UI.obs.m = el.dataset.m; UI.obs.k = null; UI.obs.cid = null; obsRender(); },
  'obs-k': el => { UI.obs.k = el.dataset.k; UI.obs.cid = null; obsRender(); },
  'obs-set': el => { const O = UI.obs; evAdd(turma(), O.d, el.dataset.aid, O.m, O.cid, +el.dataset.v); obsRender(); },
  'obs-apply': () => { const t = turma(), O = UI.obs, n = evApply(t, periodOf(O.d), O.m, alunosOf(t).map(a => a.id)); toast(n ? `Competências atualizadas em ${n} ${n === 1 ? 'aluno' : 'alunos'}; os níveis foram recalculados.` : 'Ainda não há competências dominadas pelas evidências (são precisas duas observações positivas).'); closeSheet(); render(); },
  'g-obs': () => sheetObs(today(), FOCUS && S.aulas[FOCUS] ? S.aulas[FOCUS].materias : null),
  'des-edit': el => sheetDes(el.dataset.aid, el.dataset.m),
  'des-save': () => { const t = turma(), v = avalOf(t.id, UI.p), {aid, m} = UI.draft, x = $('#des-txt').value.trim(), auto = (desafioDe(t, UI.p, alunosOf(t).find(a => a.id === aid), m) || {});
    v.des = v.des || {}; v.des[aid] = v.des[aid] || {};
    if (x && !(auto.txt === x && !auto.own)) v.des[aid][m] = x; else delete v.des[aid][m];
    touchAval(v); closeSheet(); render(); toast('Desafio guardado.'); },
  'doc-des': () => printDoc('Cartões de desafio', cartoesHtml(turma(), UI.p))
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'obs-c' && UI.obs) { UI.obs.cid = el.value; obsRender(); } });
// Evolução das competências observadas de um aluno numa matéria.
function evList(t, v, al, m) {
  const ev = evMap(v, al.id, m), cs = compsOf(t.ciclo, m).filter(c => ev[c.id]); if (!cs.length) return '';
  return `<details class="evl"><summary>Evidências registadas nas aulas (${cs.length} ${cs.length === 1 ? 'competência' : 'competências'})</summary>${cs.map(c => { const st = evState(ev[c.id]); return `<div class="evr"><span>${cidOf(c)}${esc(encurta(c.txt, 110))}</span>${evDots(ev[c.id], 10)}<span class="pill ${st === 'dom' ? 'ok' : st === 'nao' ? 'bad' : 'inc'}">${EVN[st]}</span></div>`; }).join('')}</details>`;
}
