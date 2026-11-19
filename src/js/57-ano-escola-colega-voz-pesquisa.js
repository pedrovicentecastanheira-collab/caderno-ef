/* ---------- novo ano letivo, programa da escola, caderno de um colega, notas de voz, pesquisa, relatório anual, sem internet ---------- */

/* A. Novo ano letivo */
const anoSeg = a => { const m = /(\d{4})\D+(\d{4})/.exec(a || ''), y = new Date().getFullYear(); return m ? (+m[1] + 1) + '/' + (+m[2] + 1) : y + '/' + (y + 1); };
const nomeSeg = n => String(n || '').replace(/(\d{1,2})(\s*\.?\s*º)/, (_, d, r) => (+d + 1) + r);
const cicloDe = a => a <= 4 ? '1' : a <= 6 ? '2' : a <= 9 ? '3' : 'S';
const mais1 = d => d && /^\d{4}/.test(d) ? (+d.slice(0, 4) + 1) + d.slice(4) : d;
function ultimoP(t, al) { for (let p = CFG.nper; p >= 1; p--) { const r = calc(t, p, al); if (r.FIN != null || Object.keys(r.lv).length) return p; } return CFG.nper; }
function anteriorDe(t, al) {
  const p = ultimoP(t, al), r = calc(t, p, al), v = avalOf(t.id, p);
  return {ano:CFG.ano, turma:t.nome, p, fin:r.FIN ?? null, nv:nivel(t, r.FIN) ?? null, est:r.EST, niveis:Object.assign({}, r.lv), fit:clone((v.fit || {})[al.id] || {}), zonas:Object.assign({}, r.zones)};
}
function sheetNovoAno(open) {
  const ts = Object.values(S.turmas).sort(byNome), novo = anoSeg(CFG.ano);
  if (open || !UI.draft || !UI.draft.nano) UI.draft = {nano:true, ts:Object.fromEntries(ts.map(t => [t.id, {on:(anoOf(t) || 0) < 12, nome:nomeSeg(t.nome)}]))};
  const D = UI.draft.ts;
  const body = `<div class="form"><p class="hint" style="margin:0">Fecha <b>${esc(CFG.ano)}</b> e prepara <b>${esc(novo)}</b>. Primeiro, o ano que termina é guardado inteiro num ficheiro${typeof odOn === 'function' && odOn() ? ' (e no OneDrive)' : ''}. Depois, cada turma escolhida passa para o ano seguinte com os mesmos alunos e as fotografias. O nível de cada matéria, a classificação final e os resultados do FITescola ficam como ponto de partida na ficha de cada aluno. As outras turmas ficam só no ficheiro.</p>
    <div class="list na-l">${ts.map(t => `<div class="li na-r"><label class="cli"><input type="checkbox" data-in="na-on" data-id="${esc(t.id)}"${D[t.id] && D[t.id].on ? ' checked' : ''}${(anoOf(t) || 0) >= 12 ? ' disabled' : ''}> <span><b>${esc(t.nome)}</b> <span class="muted small">${(t.alunos || []).length} alunos</span></span></label>
      ${(anoOf(t) || 0) >= 12 ? '<span class="small muted na-nome">termina o secundário: fica só no ficheiro</span>' : `<label class="na-nome"><span class="small muted">passa a</span><input type="text" data-in="na-nome" data-id="${esc(t.id)}" value="${esc((D[t.id] || {}).nome || '')}" aria-label="Novo nome de ${esc(t.nome)}"${D[t.id] && D[t.id].on ? '' : ' disabled'}></label>`}</div>`).join('') || '<p class="muted">Não há turmas.</p>'}</div>
    <p class="hint" style="margin:0">As datas dos períodos e os feriados fixos passam para ${esc(novo)}. As interrupções letivas mudam todos os anos: confirme-as depois em Ano letivo.</p></div>`;
  const foot = `<button class="btn" data-a="sh-close">Cancelar</button><button class="btn primary" data-a="na-go">Guardar ${esc(CFG.ano)} e começar ${esc(novo)}</button>`;
  if (open) openSheet('Novo ano letivo', body, foot); else updSheet(body, foot);
}
async function novoAnoAplicar(D) {
  Store.flush(); await Promise.all(Object.values(Store.q || {}));
  const velho = CFG.ano, novo = anoSeg(velho), nome = 'caderno-ef-' + String(velho || 'ano').replace(/\W+/g, '-') + '.json';
  let txt = JSON.stringify(Object.assign(syncData(), {anoLetivo:velho}));
  txt = await copiaCifrar(txt);
  await saveFile(nome, new Blob([txt], {type:'application/json'}));
  if (typeof odOn === 'function' && odOn()) { try { await _odEnv2(nome, txt); } catch (e) {} }
  const velhas = Object.values(S.turmas), keepDocs = new Set(), novas = [];
  velhas.forEach(t => { const o = D[t.id]; if (!o || !o.on || (anoOf(t) || 0) >= 12) return; const a = (anoOf(t) || 0) + 1;
    novas.push({id:uid(), nome:(o.nome || '').trim() || nomeSeg(t.nome), ciclo:anoOf(t) ? cicloDe(a) : t.ciclo, ano:anoOf(t) ? a : null, escala:t.escala, cor:t.cor,
      alunos:(t.alunos || []).map(al => { const n = clone(al); n.ant = anteriorDe(t, al); if (n.i31 != null && n.i31 !== '') n.i31 = +n.i31 + 1; n.disp = (n.disp || []).filter(d => !d.fim || d.fim >= today()); n.disp.forEach(d => d.doc && keepDocs.add(d.doc)); return n; })}); });
  const fica = new Set(novas.flatMap(t => t.alunos.map(a => a.id)));
  for (const k of ['aulas', 'aval', 'hist']) for (const id of Object.keys(S[k])) { delete S[k][id]; Store.del(k, id); }
  for (const id of Object.keys(S.fotos)) if (!fica.has(id)) { delete S.fotos[id]; Store.del('fotos', id); }
  for (const id of Object.keys(S.docs)) if (!keepDocs.has(id)) { delete S.docs[id]; Store.del('docs', id); }
  velhas.forEach(t => { delete S.turmas[t.id]; Store.del('turmas', t.id); });
  novas.forEach(t => { S.turmas[t.id] = t; Store.save('turmas', t); });
  CFG.ano = novo; CFG.per = CFG.per.map(x => ({ini:mais1(x.ini), fim:mais1(x.fim)}));
  CFG.semAulas = (CFG.semAulas || []).filter(x => x[0] === x[1] && !/corpo de deus|carnaval|p[áa]scoa/i.test(x[2] || '')).map(x => [mais1(x[0]), mais1(x[1]), x[2]]);
  CFG.fimAno = Object.fromEntries(Object.entries(CFG.fimAno || {}).map(([k, v]) => [k, mais1(v)])); CFG.cal2627 = false; CFG.anoNovo = today(); Store.save('cfg', CFG);
  if (typeof AULAS_V !== 'undefined') AULAS_V++;
  UI.turma = novas[0] ? novas[0].id : null; UI.p = 1; UI.tab = 'inicio'; UI.draft = null;
  return {nome, n:novas.length, novo};
}
function antHtml(al, tab) {
  const a = al.ant; if (!a) return '';
  if (tab === 'fit') { const val = f => a.fit[f.k] != null ? a.fit[f.k] : [a.fit[f.k + '_d'], a.fit[f.k + '_e']].filter(x => x != null).join(' / ');
    const rows = FIT.map(f => [f, val(f)]).filter(x => x[1] !== '' && x[1] != null); if (!rows.length) return '';
    return `<div class="card ant"><b>Ponto de partida · ${esc(a.ano)}</b><p class="small muted" style="margin:4px 0 8px">Resultados do FITescola no fim do ano anterior (${esc(a.turma)}).</p><div class="ant-fit">${rows.map(([f, x]) => { const z = a.zonas[f.k]; return `<span class="tag ${z === 0 ? 'z0' : z === 1 ? 'z1' : z === 2 ? 'z2' : ''}">${esc(f.n)}: <b>${esc(String(x))}</b></span>`; }).join('')}</div></div>`; }
  const nv = Object.entries(a.niveis || {});
  return `<div class="card ant"><b>Ano anterior · ${esc(a.ano)}</b><p class="small" style="margin:4px 0 6px">${esc(a.turma)} · final <b>${a.fin ?? '—'}</b>${a.nv != null ? ' (nível ' + a.nv + ')' : ''} · ${esc(a.est || '')}</p>${nv.length ? `<div class="ant-fit">${nv.map(([m, l]) => `<span class="tag">${subIcon(m, 7)} ${esc(m)}: <b>${esc(l)}</b></span>`).join('')}</div>` : ''}</div>`;
}
const _vAlunoPage57 = vAlunoPage;
vAlunoPage = function (t, al, split) {
  let h = _vAlunoPage57(t, al, split); const tab = UI.atab || 'resumo';
  const extra = (tab === 'resumo' || tab === 'fit' ? antHtml(al, tab) : '') + (tab === 'resumo' ? vozHtml(t, al) : '');
  if (!extra) return h; const i = h.lastIndexOf('</div>'); return h.slice(0, i) + extra + h.slice(i);
};
DEXTRA.ano = (f => () => `<div class="sec-h"><h2>Novo ano letivo</h2></div><div class="card form"><p class="small" style="margin:0">No fim de ${esc(CFG.ano)}: guarde o ano num ficheiro e passe as turmas para ${esc(anoSeg(CFG.ano))}, com os alunos, as fotografias e o ponto de partida de cada um.</p><button class="btn" data-a="na-open">Começar o novo ano letivo…</button></div>` + f())(DEXTRA.ano);

/* B. Exportar para o programa da escola */
const EXPC = [['num', 'N.º'], ['proc', 'N.º de processo'], ['nome', 'Nome'], ['nota', 'Classificação (nível ou 0–20)'], ['fin', 'Classificação 0–20'], ['nivel', 'Nível 1–5'], ['faltas', 'Faltas'], ['atrasos', 'Atrasos'], ['est', 'Situação'], ['obs', 'Observação do período'], ['turma', 'Turma']];
const expCfg = () => (CFG.escExp = Object.assign({cols:['num', 'nome', 'nota', 'faltas'], fmt:'csv;', dec:',', head:true, todas:false}, CFG.escExp || {}));
function expVal(k, t, p, al, dec) {
  const r = calc(t, p, al), c = counts(t, p, al.id), n = x => x == null ? '' : dec === ',' && typeof x === 'number' ? String(x).replace('.', ',') : x;
  return ({num:al.num ?? '', proc:al.proc ?? '', nome:al.nome, nota:n(t.ciclo === 'S' ? r.FIN : nivel(t, r.FIN)), fin:n(r.FIN), nivel:n(nivel(t, r.FIN)), faltas:c.F, atrasos:c.A, est:r.EST, obs:(avalOf(t.id, p).obs || {})[al.id] || '', turma:t.nome})[k] ?? '';
}
function expLinhas(ts, p) {
  const E = expCfg(), cols = E.cols.filter(k => EXPC.some(x => x[0] === k)), nm = Object.fromEntries(EXPC);
  const head = cols.map(k => nm[k]), out = E.head ? [head] : [];
  ts.forEach(t => alunosOf(t).forEach(al => out.push(cols.map(k => expVal(k, t, p, al, E.dec)))));
  return out;
}
const csvCel = (x, sep) => { const s = String(x ?? ''); return /["\n\r]/.test(s) || s.includes(sep) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function sheetEscExp() {
  const E = expCfg(), t = turma(), nm = Object.fromEntries(EXPC), ord = E.cols.concat(EXPC.map(x => x[0]).filter(k => !E.cols.includes(k)));
  if (E.todas && !E.cols.includes('turma')) { /* com várias turmas num só ficheiro, a coluna Turma ajuda o programa a separá-las */ }
  const ts = E.todas ? Object.values(S.turmas).sort(byNome) : [t], prev = expLinhas(ts, UI.p).slice(0, 4);
  const body = `<div class="form"><p class="hint" style="margin:0">A maioria dos programas da escola aceita um ficheiro CSV ou Excel com uma linha por aluno. Escolha as colunas pela ordem que o programa pede; a configuração fica guardada para a próxima vez.</p>
    <div class="field"><span class="lbl">Colunas (por esta ordem)</span><div class="list">${ord.map((k, i) => `<div class="li"><label class="cli" style="flex:1"><input type="checkbox" data-in="ee-col" data-k="${k}"${E.cols.includes(k) ? ' checked' : ''}> <span>${esc(nm[k])}</span></label>${E.cols.includes(k) ? `<button class="icon-btn" data-a="ee-mv" data-k="${k}" data-d="-1" aria-label="Subir"${E.cols.indexOf(k) ? '' : ' disabled'}>↑</button><button class="icon-btn" data-a="ee-mv" data-k="${k}" data-d="1" aria-label="Descer"${E.cols.indexOf(k) < E.cols.length - 1 ? '' : ' disabled'}>↓</button>` : ''}</div>`).join('')}</div></div>
    <div class="field"><span class="lbl">Formato</span><div class="seg block">${[['csv;', 'CSV com ;'], ['csv,', 'CSV com ,'], ['xlsx', 'Excel']].map(([k, n]) => `<button data-a="ee-set" data-k="fmt" data-v="${k}" class="${E.fmt === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Casas decimais</span><div class="seg block">${[[',', 'Vírgula (14,5)'], ['.', 'Ponto (14.5)']].map(([k, n]) => `<button data-a="ee-set" data-k="dec" data-v="${k}" class="${E.dec === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <label class="cli"><input type="checkbox" data-in="ee-b" data-k="head"${E.head ? ' checked' : ''}> Primeira linha com os nomes das colunas</label>
    <label class="cli"><input type="checkbox" data-in="ee-b" data-k="todas"${E.todas ? ' checked' : ''}> Todas as turmas num só ficheiro</label>
    <div class="field"><span class="lbl">Pré-visualização · ${esc(perLabel(UI.p, true))}</span><div class="tbl-wrap"><table class="ee-prev"><tbody>${prev.map(r => `<tr>${r.map(x => `<td>${esc(String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
  const foot = `<button class="btn" data-a="sh-close">Fechar</button><button class="btn primary" data-a="ee-go">Exportar</button>`;
  if ($('#sheet').hidden) openSheet('Exportar para o programa da escola', body, foot); else updSheet(body, foot);
}
async function escExportar() {
  const E = expCfg(), ts = E.todas ? Object.values(S.turmas).sort(byNome) : [turma()], base = (E.todas ? 'turmas' : norm(ts[0].nome).replace(/[^a-z0-9]+/g, '-')) + '-' + perLabel(UI.p).replace(/\W+/g, '');
  const rows = expLinhas(ts, UI.p);
  if (E.fmt === 'xlsx') { if (typeof XLSX === 'undefined') { toast('A biblioteca do Excel não carregou. Escolha CSV.', 'bad'); return; }
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Classificações');
    await saveFile('escola-' + base + '.xlsx', new Blob([XLSX.write(wb, {bookType:'xlsx', type:'array'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); }
  else { const sep = E.fmt === 'csv,' ? ',' : ';'; await saveFile('escola-' + base + '.csv', new Blob(['﻿' + rows.map(r => r.map(x => csvCel(x, sep)).join(sep)).join('\r\n')], {type:'text/csv;charset=utf-8'})); }
  toast('Ficheiro para o programa da escola criado.');
}

/* C. Ver o caderno de um colega (só leitura) */
let CONS = null;
async function consultaAbrir(file) {
  let d; try { d = JSON.parse(await copiaDecifrar(await file.text())); } catch (e) { if (e && e.message !== 'cancelado') toast('Este ficheiro não é uma cópia do Caderno EF (ou a palavra-passe está errada).', 'bad'); return; }
  if (!d || d.app !== 'Caderno EF' || !d.turmas || !Object.keys(d.turmas).length) { toast('Este ficheiro não tem turmas do Caderno EF.', 'bad'); return; }
  { const e = validarCopia(d); if (e.length) { toast('Não foi possível abrir: ' + e.slice(0, 2).join('; ') + '.', 'bad'); return; } }
  Store.flush(); migrate(d);
  CONS = {S:Object.fromEntries(['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'].map(k => [k, S[k]])), CFG, UI:{turma:UI.turma, p:UI.p, tab:UI.tab}, quem:(d.cfg && d.cfg.geral && d.cfg.geral.prof) || d.autor || file.name.replace(/\.json$/i, '')};
  ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'].forEach(k => { S[k] = clone(d[k] || {}); });
  Object.values(S.aval).forEach(v => { SHADOW[v.id] = clone(v); });
  if (d.cfg && d.cfg.geral) { CFG = Object.assign(clone(CONS.CFG), d.cfg.geral); CFG.fit = Object.assign(clone(FITREF), CFG.fit || {}); while (CFG.per.length < 3) CFG.per.push({ini:'', fim:''}); }
  if (typeof AULAS_V !== 'undefined') AULAS_V++;
  UI.turma = Object.keys(S.turmas)[0]; UI.p = 1; UI.tab = 'relatorios'; closeSheet(); document.body.classList.add('consulta'); render();
  toast('A ver o caderno de ' + CONS.quem + '. Nada do que fizer aqui fica guardado.');
}
function consultaSair() {
  if (!CONS) return; Object.assign(S, CONS.S); CFG = CONS.CFG; Object.assign(UI, CONS.UI); CONS = null;
  Object.values(S.aval).forEach(v => { SHADOW[v.id] = clone(v); });
  if (typeof AULAS_V !== 'undefined') AULAS_V++;
  document.body.classList.remove('consulta'); render(); toast('Voltou ao seu caderno.');
}
{ const _sm = syncMerge; syncMerge = function (d) { if (CONS) return 0; return _sm(d); }; }
for (const fn of ['save', 'del']) { const o = Store[fn].bind(Store); Store[fn] = function (...a) { if (CONS) return Promise.resolve(); return o(...a); }; }
{ const _sd = syncData; syncData = function () { if (!CONS) return _sd(); const cur = {}; ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'].forEach(k => { cur[k] = S[k]; S[k] = CONS.S[k]; }); const c = CFG; CFG = CONS.CFG; try { return _sd(); } finally { Object.assign(S, cur); CFG = c; } }; }
const _render57 = render;
render = function () {
  _render57();
  let b = $('#cons-bar'); if (CONS) { if (!b) { b = document.createElement('div'); b.id = 'cons-bar'; b.setAttribute('role', 'status'); $('#top').after(b); } b.innerHTML = `<span>👁 A ver o caderno de <b>${esc(CONS.quem)}</b> · só leitura</span><button class="btn sm" data-a="cons-sair">Voltar ao meu caderno</button>`; } else if (b) b.remove();
  const top = $('#top .top-in'); if (top && !top.querySelector('.pesq-b')) { const g = top.querySelector('.gear'); const x = document.createElement('button'); x.className = 'icon-btn pesq-b'; x.dataset.a = 'pesq'; x.setAttribute('aria-label', 'Pesquisar'); x.title = 'Pesquisar (Ctrl+K)'; x.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'; top.insertBefore(x, g); }
  document.body.classList.toggle('offline', navigator.onLine === false);
};

/* D. Notas de voz */
const VOZ = {rec:null, aid:null, t0:0, tm:null};
const vozesDe = aid => Object.values(S.docs).filter(x => x.tipo === 'voz' && x.aid === aid).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
function vozHtml(t, al) {
  const vs = vozesDe(al.id), rec = VOZ.rec && VOZ.aid === al.id, ok = !!(navigator.mediaDevices && window.MediaRecorder);
  return `<div class="card voz"><div class="sec-h" style="margin:0"><b>Notas de voz</b>${ok ? `<button class="btn sm${rec ? ' rec' : ' primary'}" data-a="voz-rec" data-id="${esc(al.id)}">${rec ? '■ Parar' : '● Gravar'}</button>` : ''}</div>
    ${rec ? '<p class="small voz-on" style="margin:6px 0 0"><i></i> A gravar… (até 45 segundos)</p>' : ''}
    ${vs.length ? `<div class="voz-l">${vs.map(x => `<div class="voz-r"><span class="small muted">${esc(fmtDate((x.at || '').slice(0, 10), {day:'numeric', month:'short'}))} · ${x.dur || 0} s</span><audio controls preload="none" src="${esc(x.d)}"></audio><button class="icon-btn" data-a="voz-del" data-id="${esc(x.id)}" aria-label="Apagar nota de voz">×</button></div>`).join('')}</div>` : `<p class="small muted" style="margin:6px 0 0">${ok ? 'Grave uma observação rápida no pavilhão, sem escrever. Fica só neste caderno.' : 'Este navegador não permite gravar som.'}</p>`}</div>`;
}
const blobURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function vozGuardar(aid, blob, dur) {
  const t = turma(), id = uid(), d = await blobURL(blob);
  if (d.length > 220000) { toast('A nota de voz ficou grande demais para guardar. Grave notas mais curtas (até cerca de 30 segundos).', 'bad'); render(); return; }
  S.docs[id] = {id, tipo:'voz', aid, turmaId:t.id, nome:'nota-de-voz.' + (blob.type.includes('mp4') ? 'm4a' : 'webm'), d, dur:Math.round(dur), at:new Date().toISOString()}; Store.save('docs', S.docs[id]);
  render();
}
async function vozGravar(aid) {
  if (VOZ.rec) { VOZ.rec.stop(); return; }
  let st; try { st = await navigator.mediaDevices.getUserMedia({audio:true}); } catch (e) { toast('Sem acesso ao microfone. Autorize-o nas definições do navegador.', 'bad'); return; }
  const tipo = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(x => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x));
  const rec = new MediaRecorder(st, Object.assign({audioBitsPerSecond:16000}, tipo ? {mimeType:tipo} : {})), parts = [];
  rec.ondataavailable = e => e.data.size && parts.push(e.data);
  rec.onstop = () => { clearTimeout(VOZ.tm); st.getTracks().forEach(x => x.stop()); const dur = (Date.now() - VOZ.t0) / 1000; VOZ.rec = null; VOZ.aid = null; if (parts.length) vozGuardar(aid, new Blob(parts, {type:rec.mimeType || 'audio/webm'}), dur); else render(); };
  VOZ.rec = rec; VOZ.aid = aid; VOZ.t0 = Date.now(); rec.start(); VOZ.tm = setTimeout(() => rec.state === 'recording' && rec.stop(), 45000); render();
}
{ const _tp = turmaPacote; turmaPacote = function (t) { const P = _tp(t); Object.values(S.docs).filter(x => x.tipo === 'voz' && x.turmaId === t.id).forEach(x => { P.docs[x.id] = x; }); return P; }; }

/* E. Pesquisa global */
function pesqRes(q) {
  const n = norm(q.trim()); if (n.length < 2) return [];
  const out = [], has = s => norm(s || '').includes(n);
  Object.values(S.turmas).sort(byNome).forEach(t => {
    if (has(t.nome)) out.push({k:'turma', t, txt:t.nome, sub:(t.alunos || []).length + ' alunos'});
    (t.alunos || []).forEach(al => { if (has(al.nome) || String(al.num) === q.trim() || (al.proc && String(al.proc) === q.trim())) out.push({k:'aluno', t, al, txt:al.nome, sub:t.nome + (al.num != null ? ' · n.º ' + al.num : '')}); });
  });
  Object.values(S.aulas).filter(a => S.turmas[a.turmaId] && (has(a.sumario) || (a.materias || []).some(has))).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12)
    .forEach(a => out.push({k:'aula', a, txt:(a.sumario || (a.materias || []).join(', ') || 'Aula').slice(0, 90), sub:S.turmas[a.turmaId].nome + ' · ' + fmtDate(a.data)}));
  exAll().filter(x => has(x.nome) || has(x.desc) || has(x.m)).slice(0, 12).forEach(x => out.push({k:'ex', x, txt:x.nome, sub:x.m + ' · ' + (x.lv || '')}));
  return out.slice(0, 40);
}
const PQK = {turma:'Turma', aluno:'Aluno', aula:'Aula', ex:'Exercício'};
function pesqLista(q) {
  const rs = pesqRes(q);
  return rs.length ? `<div class="list pq-l">${rs.map((r, i) => `<button class="li pq-r" data-a="pq-ir" data-i="${i}">${r.k === 'aluno' ? avatar(r.al, 'sm') : `<span class="pq-k">${PQK[r.k][0]}</span>`}<span class="who"><div class="nm">${esc(r.txt)}</div><div class="meta">${PQK[r.k]} · ${esc(r.sub)}</div></span></button>`).join('')}</div>`
    : `<p class="muted small">${q.trim().length < 2 ? 'Escreva pelo menos duas letras: nome de um aluno, de uma turma, de um exercício ou uma palavra de um sumário.' : 'Nada encontrado.'}</p>`;
}
function pesqAbrir() {
  UI.pq = ''; openSheet('Pesquisar', `<div class="form"><input type="search" id="pq" data-in="pq" placeholder="Aluno, turma, exercício, sumário…" autocomplete="off" enterkeyhint="search" aria-label="Pesquisar"><div id="pq-out">${pesqLista('')}</div></div>`, '');
  setTimeout(() => { const i = $('#pq'); if (i) i.focus(); }, 30);
}
function pesqIr(r) {
  closeSheet();
  if (r.k === 'turma') { UI.turma = r.t.id; UI.tab = 'turma'; render(); }
  else if (r.k === 'aluno') { UI.turma = r.t.id; UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = r.al.id; UI.atab = 'resumo'; render(); window.scrollTo(0, 0); }
  else if (r.k === 'aula') { UI.turma = r.a.turmaId; UI.tab = 'turma'; UI.tsub = 'aulas'; render(); A['aula-edit']({dataset:{id:r.a.id}}); }
  else { const x = r.x; openSheet(x.nome, `<div class="form"><p class="small muted" style="margin:0">${esc(x.m)}${x.lv ? ' · ' + esc(x.lv) : ''}</p>${x.desc ? `<p style="margin:0">${esc(x.desc)}</p>` : ''}${x.crit ? `<p style="margin:0"><b>Critérios de êxito:</b> ${esc(x.crit)}</p>` : ''}${x.link ? `<a class="btn" href="${esc(x.link)}" target="_blank" rel="noopener">Abrir o vídeo</a>` : ''}</div>`, ''); }
}
document.addEventListener('input', e => { const el = e.target; if (el.id === 'pq') { UI.pq = el.value; const o = $('#pq-out'); if (o) o.innerHTML = pesqLista(el.value); } });
document.addEventListener('keydown', e => {
  const lk = $('#lock'); if (!CFG || (lk && !lk.hidden)) return;
  if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'k' || e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') && !e.target.isContentEditable) { e.preventDefault(); pesqAbrir(); }
  else if (e.key === 'Enter' && e.target.id === 'pq') { const r = pesqRes(e.target.value)[0]; if (r) pesqIr(r); }
});

/* F. Relatório anual da turma */
function relAnualHtml(t) {
  const als = alunosOf(t), ps = CFG.per.slice(0, CFG.nper).map((_, i) => i + 1), R = Object.fromEntries(ps.map(p => [p, als.map(al => ({al, r:calc(t, p, al), c:counts(t, p, al.id)}))]));
  const med = xs => { const v = xs.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : null; };
  const ser = [{name:'Média final', color:'var(--v1)', vals:ps.map(p => med(R[p].map(x => x.r.FIN)))}, {name:'Matérias', color:'var(--v2)', vals:ps.map(p => med(R[p].map(x => x.r.AF)))}, {name:'Apt. física', color:'var(--v3)', vals:ps.map(p => med(R[p].map(x => x.r.APF)))}];
  const keep = CHW; CHW = 640;
  let h = `<section class="rel ranual">${docHead('Relatório anual · ' + t.nome, alunosOf(t).length + ' alunos')}
    <div class="tiles">${ps.map(p => { const xs = R[p], ap = xs.filter(x => x.r.EST === 'Apto').length; return `<div class="tile"><b>${med(xs.map(x => x.r.FIN)) ?? '—'}</b><span>${esc(perLabel(p, true))} · ${ap}/${xs.length} aptos</span></div>`; }).join('')}</div>`;
  if (ser[0].vals.some(x => x != null)) h += fig('Evolução da turma', 'Médias por período (0–20)', chLine(ps.map(p => perLabel(p)), ser, {h:180, label:'Evolução da turma'}) + legend(ser));
  h += `<h3>Classificações</h3><div class="tbl-wrap"><table><thead><tr><th>N.º</th><th class="l">Aluno</th>${ps.map(p => `<th>${esc(perLabel(p))}</th>`).join('')}<th>Faltas</th></tr></thead><tbody>${als.map((al, i) => `<tr><td>${esc(al.num ?? '')}</td><td class="l">${esc(al.nome)}</td>${ps.map(p => { const r = R[p][i].r, nv = nivel(t, r.FIN); return `<td class="${r.FIN != null && r.FIN < 10 ? 'low' : ''}">${r.FIN ?? '—'}${t.ciclo !== 'S' && nv != null ? ` <span class="muted">(${nv})</span>` : ''}</td>`; }).join('')}<td>${ps.reduce((s, p) => s + R[p][i].c.F, 0)}</td></tr>`).join('')}</tbody></table></div>`;
  const ms = [...new Set(ps.flatMap(p => matsOf(t, p)))];
  if (ms.length) h += `<h3>Matérias: alunos por nível</h3><div class="tbl-wrap"><table><thead><tr><th class="l">Matéria</th><th>Período</th>${LV.map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody>${ms.flatMap(m => ps.filter(p => R[p].some(x => x.r.lv[m])).map(p => `<tr><td class="l">${esc(m)}</td><td>${esc(perLabel(p))}</td>${LV.map(l => { const n = R[p].filter(x => x.r.lv[m] === l).length; return `<td>${n || ''}</td>`; }).join('')}</tr>`)).join('')}</tbody></table></div>`;
  h += `<h3>Aptidão física: alunos na Zona Saudável</h3><div class="tbl-wrap"><table><thead><tr><th class="l">Teste</th>${ps.map(p => `<th>${esc(perLabel(p))}</th>`).join('')}</tr></thead><tbody>${FIT.map(f => `<tr><td class="l">${esc(f.n)}</td>${ps.map(p => { const z = R[p].map(x => x.r.zones[f.k]).filter(x => x != null); return `<td>${z.length ? Math.round(z.filter(x => x >= 1).length / z.length * 100) + '%' : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  h += `<h3>Assiduidade</h3><div class="tbl-wrap"><table><thead><tr><th class="l">Período</th><th>Aulas</th><th>Faltas</th><th>Atrasos</th><th>Sem material</th></tr></thead><tbody>${ps.map(p => { const n = aulasOf(t.id).filter(a => periodOf(a.data) === p).length, s = k => R[p].reduce((a, x) => a + x.c[k], 0); return `<tr><td class="l">${esc(perLabel(p, true))}</td><td>${n}</td><td>${s('F')}</td><td>${s('A')}</td><td>${s('M')}</td></tr>`; }).join('')}</tbody></table></div></section>`;
  CHW = keep; return h;
}

/* G. Sem internet */
window.addEventListener('online', () => { document.body.classList.remove('offline'); toast('Voltou a haver internet.'); });
window.addEventListener('offline', () => { document.body.classList.add('offline'); toast('Sem internet: pode continuar a trabalhar, tudo fica guardado neste aparelho.'); });

const _vDocs57 = vDocs;
vDocs = function (t) {
  const extra = [['doc-anual', 'Relatório anual da turma', 'Classificações dos três períodos, evolução da turma, níveis por matéria, aptidão física e assiduidade, num só documento para o departamento.'],
    ['doc-anual-todas', 'Relatório anual de todas as turmas', 'O mesmo relatório, uma turma por página.'],
    ['doc-dipl', 'Diplomas de unidade', 'Um diploma por aluno que concluiu um nível numa matéria, com o selo e o nome, para entregar no fim da unidade.'],
    ['ee-open', 'Exportar para o programa da escola', 'Classificações e faltas em CSV ou Excel, com as colunas pela ordem que o programa da escola pede.'],
    ['col-open', 'Ver o caderno de um colega', 'Abre a cópia que um colega lhe enviou, só para consulta (substituições, conselhos de turma). Nada se mistura com o seu caderno.']];
  return _vDocs57(t).replace(/(<button class="card doc" data-a="auto-first">[\s\S]*?<\/button>)/, `$1${extra.map(([a, n, d]) => `<button class="card doc" data-a="${a}"><b>${n}</b><span class="hint">${d}</span></button>`).join('')}`);
};

Object.assign(A, {
  'na-open': () => sheetNovoAno(true),
  'na-go': async el => { if (!armed(el, 'Confirmar: fechar ' + CFG.ano + '?')) return; el.disabled = true;
    try { const r = await novoAnoAplicar(UI.draft.ts); closeSheet(); render(); toast(`Começou ${r.novo}: ${r.n} ${r.n === 1 ? 'turma passou' : 'turmas passaram'}. O ano anterior ficou no ficheiro ${r.nome}.`); }
    catch (e) { el.disabled = false; toast('Não foi possível guardar o ficheiro do ano. Nada foi apagado.', 'bad'); } },
  'ee-open': () => { expCfg(); sheetEscExp(); },
  'ee-mv': el => { const c = expCfg().cols, i = c.indexOf(el.dataset.k), j = i + +el.dataset.d; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; Store.save('cfg', CFG); sheetEscExp(); },
  'ee-set': el => { expCfg()[el.dataset.k] = el.dataset.v; Store.save('cfg', CFG); sheetEscExp(); },
  'ee-go': () => escExportar(),
  'col-open': () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json'; i.onchange = () => { if (i.files[0]) consultaAbrir(i.files[0]); }; i.click(); },
  'cons-sair': () => consultaSair(),
  'voz-rec': el => vozGravar(el.dataset.id),
  'voz-del': el => { if (!armed(el, '?')) return; const id = el.dataset.id; delete S.docs[id]; Store.del('docs', id); render(); },
  'pesq': () => pesqAbrir(),
  'pq-ir': el => { const r = pesqRes(UI.pq || '')[+el.dataset.i]; if (r) pesqIr(r); },
  'doc-anual': () => printDoc('Relatório anual', relAnualHtml(turma())),
  'doc-anual-todas': () => printDoc('Relatório anual', Object.values(S.turmas).sort(byNome).map(relAnualHtml).join(''))
});
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'na-on') { UI.draft.ts[el.dataset.id].on = el.checked; sheetNovoAno(); }
  else if (k === 'na-nome') { UI.draft.ts[el.dataset.id].nome = el.value; }
  else if (k === 'ee-col') { const E = expCfg(); if (el.checked) { if (!E.cols.includes(el.dataset.k)) E.cols.push(el.dataset.k); } else E.cols = E.cols.filter(x => x !== el.dataset.k); Store.save('cfg', CFG); sheetEscExp(); }
  else if (k === 'ee-b') { expCfg()[el.dataset.k] = el.checked; Store.save('cfg', CFG); sheetEscExp(); } });
