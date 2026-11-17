/* ---------- integridade, recuperação e diagnóstico ---------- */
// Verificação ao abrir (registos órfãos, datas inválidas, registos perto do limite de tamanho) com arrumação segura;
// validação das cópias antes de as aplicar; reposição de uma só turma; registo de erros e relatório sem dados pessoais.
const VERSAO_APP = '@VERSAO@';   // trocado pelo build (resumo do código-fonte)

/* registo de erros (sem dados dos alunos: só a mensagem e o sítio) */
const ERRLOG = [];
function logErro(msg, onde) {
  ERRLOG.push({t:new Date().toISOString(), msg:String(msg || '').slice(0, 200), onde:String(onde || '').slice(0, 120)});
  if (ERRLOG.length > 30) ERRLOG.shift(); try { localStorage.setItem('ef:errlog', JSON.stringify(ERRLOG)); } catch (e) {}
}
try { ERRLOG.push(...JSON.parse(localStorage.getItem('ef:errlog') || '[]')); } catch (e) {}
window.addEventListener('error', e => logErro(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno));
window.addEventListener('unhandledrejection', e => logErro(e.reason && (e.reason.message || e.reason), 'promessa'));
const _toast = toast; toast = function (msg, kind) { if (kind === 'bad') logErro(msg, 'aviso'); return _toast(msg, kind); };

/* validação de uma cópia antes de a aplicar */
function validarCopia(d) {
  const err = [], isO = x => x && typeof x === 'object' && !Array.isArray(x), iso = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!isO(d) || d.app !== 'Caderno EF') return ['não é uma cópia do Caderno EF'];
  ['turmas', 'aulas', 'aval'].forEach(k => { if (d[k] != null && !isO(d[k])) err.push(k + ' com formato inválido'); });
  Object.values(d.turmas || {}).forEach(t => { if (!isO(t) || !t.id || !Array.isArray(t.alunos || [])) err.push('turma inválida'); });
  const mal = Object.values(d.aulas || {}).filter(a => !isO(a) || !a.id || !a.turmaId || !iso(a.data)).length; if (mal) err.push(mal + ' aulas sem turma ou data');
  const malv = Object.values(d.aval || {}).filter(v => !isO(v) || !v.id || !v.turmaId).length; if (malv) err.push(malv + ' avaliações inválidas');
  return err;
}
function comValidacao(fn, nome) {
  return function (d) { const e = validarCopia(d); if (e.length) { toast('A cópia não foi aplicada: ' + e.slice(0, 2).join('; ') + '. Os seus dados ficaram como estavam.', 'bad'); logErro('cópia inválida: ' + e.join('; '), nome); return 0; } return fn(d); };
}
syncMerge = comValidacao(syncMerge, 'juntar');
// Substituir tudo a partir de uma cópia: valida primeiro e guarda antes uma cópia do estado atual.
const _restGo = A['restore-go'], _restMerge = A['restore-merge'];
A['restore-go'] = async () => { const d = A._pending, e = validarCopia(d); if (e.length) { toast('A cópia não foi aplicada: ' + e[0] + '.', 'bad'); return; } await snapAntes('antes-de-repor'); return _restGo(); };
A['restore-merge'] = () => { const d = A._pending, e = validarCopia(d); if (e.length) { toast('A cópia não foi aplicada: ' + e[0] + '.', 'bad'); return; } return _restMerge(); };
async function snapAntes(motivo) { if (Store.mode !== 'idb') return; try { await idbReq(Store.tx(true).put(JSON.parse(JSON.stringify(syncData())), 'snap:' + today() + '-' + motivo)); } catch (e) {} }

/* verificação ao abrir */
function verificar() {
  const out = [], tids = new Set(Object.keys(S.turmas)), aids = new Set(Object.values(S.turmas).flatMap(t => (t.alunos || []).map(a => a.id))), iso = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const aOrf = Object.values(S.aulas).filter(a => !tids.has(a.turmaId)); if (aOrf.length) out.push({k:'aulas', n:aOrf.length, txt:'aulas de turmas que já não existem', fix:true});
  const vOrf = Object.values(S.aval).filter(v => !tids.has(v.turmaId)); if (vOrf.length) out.push({k:'aval', n:vOrf.length, txt:'avaliações de turmas que já não existem', fix:true});
  const fOrf = Object.keys(S.fotos).filter(id => !aids.has(id)); if (fOrf.length) out.push({k:'fotos', n:fOrf.length, txt:'fotografias de alunos que já não existem', fix:true});
  let alOrf = 0; Object.values(S.aval).forEach(v => { if (!tids.has(v.turmaId)) return; ['af', 'comp', 'fit', 'con', 'av', 'ev', 'obs'].forEach(c => Object.keys(v[c] || {}).forEach(aid => { if (!aids.has(aid)) alOrf++; })); });
  if (alOrf) out.push({k:'alunos', n:alOrf, txt:'registos de avaliação de alunos retirados das turmas', fix:true});
  const dMal = Object.values(S.aulas).filter(a => !iso(a.data)).length; if (dMal) out.push({k:'datas', n:dMal, txt:'aulas com data inválida', fix:false});
  const ids = Object.values(S.turmas).flatMap(t => (t.alunos || []).map(a => a.id)), dup = ids.length - new Set(ids).size; if (dup) out.push({k:'dup', n:dup, txt:'alunos repetidos em mais do que uma turma (mesmo identificador)', fix:false});
  const grandes = []; for (const k of ['turmas', 'aulas', 'aval', 'hist']) Object.values(S[k]).forEach(o => { const z = JSON.stringify(o).length; if (z > 200000) grandes.push(o.id); });
  if (grandes.length) out.push({k:'tam', n:grandes.length, txt:'registos perto do limite de tamanho (256 KB)' + (Store.mode === 'cloud' ? ': podem deixar de gravar na conta' : ''), fix:false});
  return out;
}
async function arrumar() {
  await snapAntes('antes-de-arrumar');
  const tids = new Set(Object.keys(S.turmas)), aids = new Set(Object.values(S.turmas).flatMap(t => (t.alunos || []).map(a => a.id))); let n = 0;
  Object.values(S.aulas).filter(a => !tids.has(a.turmaId)).forEach(a => { delete S.aulas[a.id]; Store.del('aulas', a.id); n++; });
  Object.values(S.aval).filter(v => !tids.has(v.turmaId)).forEach(v => { delete S.aval[v.id]; Store.del('aval', v.id); n++; });
  Object.keys(S.fotos).filter(id => !aids.has(id)).forEach(id => { delete S.fotos[id]; Store.del('fotos', id); n++; });
  Object.values(S.aval).forEach(v => { let ch = false; ['af', 'comp', 'fit', 'con', 'av', 'ev', 'obs', 'iv', 'des', 'autoc', 'coav', 'quiz', 'pfit'].forEach(c => Object.keys(v[c] || {}).forEach(aid => { if (!aids.has(aid)) { delete v[c][aid]; ch = true; n++; } })); if (ch) touchAval(v); });
  render(); toast(n ? `Arrumação feita: ${n} ${n === 1 ? 'registo retirado' : 'registos retirados'}. Guardei antes uma cópia (Definições › Sincronizar › Cópias diárias).` : 'Não havia nada a arrumar.');
}

/* repor uma só turma a partir de uma cópia (ficheiro) */
let REPOR = null;
function sheetRepor() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; let d;
    try { d = JSON.parse(await (typeof copiaDecifrar === 'function' ? copiaDecifrar(await f.text()) : f.text())); } catch (e) { if (!e || e.message !== 'cancelado') toast('Não foi possível ler a cópia.', 'bad'); return; }
    const e = validarCopia(d); if (e.length) { toast('A cópia não é válida: ' + e[0] + '.', 'bad'); return; }
    REPOR = d; const ts = Object.values(d.turmas || {});
    openSheet('Repor uma turma', `<div class="form"><p class="small">Cópia de ${esc(fmtDate((d.exportado || '').slice(0, 10) || today(), {day:'numeric', month:'long', year:'numeric'}))}. A turma escolhida fica exatamente como estava na cópia (alunos, aulas, avaliações, fotografias); as outras turmas não mudam.</p>
      <div class="list">${ts.map(t => `<div class="li"><span class="who col"><b>${esc(t.nome)}</b><span class="small muted">${(t.alunos || []).length} alunos · ${Object.values(d.aulas || {}).filter(a => a.turmaId === t.id).length} aulas</span></span><button class="btn sm" data-a="repor-go" data-id="${esc(t.id)}">Repor</button></div>`).join('')}</div></div>`); };
  inp.click();
}
async function reporTurma(tid) {
  const d = REPOR; if (!d || !d.turmas[tid]) return; await snapAntes('antes-de-repor-turma');
  const t = d.turmas[tid], aids = new Set((t.alunos || []).map(a => a.id));
  Object.values(S.aulas).filter(a => a.turmaId === tid).forEach(a => { delete S.aulas[a.id]; Store.del('aulas', a.id); });
  Object.values(S.aval).filter(v => v.turmaId === tid).forEach(v => { delete S.aval[v.id]; Store.del('aval', v.id); });
  const put = (k, o) => { S[k][o.id] = clone(o); if (k === 'aval') SHADOW[o.id] = clone(o); Store.save(k, S[k][o.id]); };
  put('turmas', t); Object.values(d.aulas || {}).filter(a => a.turmaId === tid).forEach(a => put('aulas', a)); Object.values(d.aval || {}).filter(v => v.turmaId === tid).forEach(v => put('aval', v));
  Object.entries(d.fotos || {}).forEach(([id, f]) => { if (aids.has(id)) put('fotos', Object.assign({id}, f)); }); if ((d.hist || {})[tid]) put('hist', d.hist[tid]);
  REPOR = null; UI.turma = tid; closeSheet(); render(); toast(`${t.nome} reposta a partir da cópia. Guardei antes uma cópia do estado anterior.`);
}

/* diagnóstico */
const DIAG = {est:null, prob:null};
async function diagEstimar() { try { DIAG.est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (e) {} }
function vDiagnostico() {
  const prob = DIAG.prob = verificar(), kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const tam = []; for (const k of ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist']) Object.values(S[k]).forEach(o => tam.push({k, id:o.id, z:JSON.stringify(o).length}));
  tam.sort((a, b) => b.z - a.z); const tot = tam.reduce((s, x) => s + x.z, 0);
  const nome = x => x.k === 'aval' ? 'Avaliação · ' + ((S.turmas[(S.aval[x.id] || {}).turmaId] || {}).nome || '?') + ' · ' + perLabel((S.aval[x.id] || {}).p || 1) : x.k === 'turmas' ? 'Turma ' + ((S.turmas[x.id] || {}).nome || '') : x.k === 'hist' ? 'Histórico · ' + ((S.turmas[x.id] || {}).nome || '') : x.k === 'fotos' ? 'Fotografia' : x.k === 'docs' ? 'Atestado' : 'Aula';
  return `<div class="sec-h"><h2>Estado do caderno</h2></div><div class="card"><div class="diag">
      <span>Versão</span><b>${esc(VERSAO_APP)} · dados v${SCHEMA}</b>
      <span>Onde guarda</span><b>${Store.mode === 'cloud' ? 'Conta Claude (sincroniza sozinho)' : Store.mode === 'idb' ? 'Este aparelho (IndexedDB)' : Store.mode === 'local' ? 'Este aparelho (armazenamento simples)' : 'Só em memória: não guarda!'}</b>
      <span>Dados</span><b>${kb(tot)} · ${[['turmas', 'turma', 'turmas'], ['aulas', 'aula', 'aulas'], ['aval', 'avaliação', 'avaliações'], ['fotos', 'fotografia', 'fotografias']].map(([k, u, v]) => { const n = Object.keys(S[k]).length; return n + ' ' + (n === 1 ? u : v); }).join(' · ')}</b>
      ${DIAG.est ? `<span>Espaço do navegador</span><b>${kb(DIAG.est.usage || 0)} usados de ${kb(DIAG.est.quota || 0)}</b>` : ''}
      ${typeof FS !== 'undefined' && FS.on ? `<span>Aparelho</span><b>${esc(String(FS.dev).slice(-6))} · ${Object.keys(FS.meta).length} alterações registadas · ${FS.conf.length} conflitos</b>` : ''}
      ${typeof OD !== 'undefined' && OD.t ? `<span>OneDrive</span><b>${OD.ultimo ? 'última cópia ' + esc(fmtDate(OD.ultimo.slice(0, 10), {day:'numeric', month:'short'}) + ' ' + new Date(OD.ultimo).toTimeString().slice(0, 5)) : 'ligado, ainda sem cópia'}${OD.a ? ' · ligação expirada' : ''}</b>` : ''}
    </div></div>
    <div class="sec-h"><h2>Verificação dos dados</h2></div><div class="card form">${prob.length ? `<div class="list">${prob.map(x => `<div class="li"><span class="fe-i ${x.fix ? 'nx' : 'opc'}">${x.n}</span><span class="who">${esc(x.txt)}</span></div>`).join('')}</div>${prob.some(x => x.fix) ? '<button class="btn primary" data-a="diag-arrumar">Arrumar (guarda antes uma cópia)</button>' : ''}` : '<p class="small" style="margin:0"><b class="ok-t">Tudo em ordem.</b> Sem registos órfãos, datas inválidas ou registos perto do limite.</p>'}</div>
    <div class="sec-h"><h2>Maiores registos</h2></div><div class="card"><div class="list">${tam.slice(0, 5).map(x => `<div class="li"><span class="who">${esc(nome(x))}</span><span class="num-t small">${kb(x.z)}${x.z > 200000 ? ' <span class="bad-t">perto do limite</span>' : ''}</span></div>`).join('') || '<p class="hint">Sem dados.</p>'}</div></div>
    <div class="sec-h"><h2>Recuperação</h2></div><div class="card form"><p class="small" style="margin:0">Repor uma só turma (ou um engano numa turma) a partir de um ficheiro de cópia, sem mexer nas outras.</p><button class="btn" data-a="repor-open">Repor uma turma a partir de uma cópia</button></div>
    <div class="sec-h"><h2>Erros recentes</h2>${ERRLOG.length ? '<button class="link" data-a="diag-limpar">Limpar</button>' : ''}</div><div class="card">${ERRLOG.length ? `<div class="list">${ERRLOG.slice(-10).reverse().map(e => `<div class="li"><span class="who col"><span class="small">${esc(e.msg)}</span><span class="small muted">${esc(fmtDate(e.t.slice(0, 10), {day:'numeric', month:'short'}) + ' ' + e.t.slice(11, 16))} · ${esc(e.onde)}</span></span></div>`).join('')}</div>` : '<p class="small" style="margin:0">Nenhum erro registado.</p>'}
      <button class="btn sm" data-a="diag-rel" style="margin-top:8px">Descarregar relatório técnico (sem dados dos alunos)</button></div>`;
}
function diagRelatorio() {
  return JSON.stringify({app:'Caderno EF', versao:VERSAO_APP, schema:SCHEMA, gerado:new Date().toISOString(), modo:Store.mode, navegador:navigator.userAgent,
    contagens:Object.fromEntries(['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'].map(k => [k, Object.keys(S[k]).length])), alunos:Object.values(S.turmas).reduce((s, t) => s + (t.alunos || []).length, 0),
    verificacao:verificar().map(x => ({tipo:x.k, n:x.n})), erros:ERRLOG, espaco:DIAG.est ? {usado:DIAG.est.usage, quota:DIAG.est.quota} : null,
    sync:typeof FS !== 'undefined' ? {ativo:FS.on, alteracoes:Object.keys(FS.meta).length, conflitos:FS.conf.length} : null, onedrive:typeof OD !== 'undefined' ? {ligado:!!OD.t, expirado:!!OD.a} : null}, null, 1);
}
Object.assign(A, {
  'diag-arrumar': el => { if (!armed(el, 'Confirmar a arrumação')) return; arrumar(); },
  'diag-limpar': () => { ERRLOG.length = 0; try { localStorage.removeItem('ef:errlog'); } catch (e) {} render(); },
  'diag-rel': () => saveFile('caderno-ef-diagnostico-' + today() + '.json', new Blob([diagRelatorio()], {type:'application/json'})),
  'repor-open': () => sheetRepor(),
  'repor-go': el => reporTurma(el.dataset.id)
});
// Ao abrir: verifica e avisa uma vez por dia se houver problemas que se podem arrumar.
(function esperar() { if (!CFG || !S || !S.cfg) { setTimeout(esperar, 300); return; }
  diagEstimar();
  setTimeout(() => { try { const p = verificar().filter(x => x.fix || x.k === 'tam'); const k = 'ef:verif:' + today();
    if (p.length && !localStorage.getItem(k)) { localStorage.setItem(k, '1'); toast(`Encontrei ${p.reduce((s, x) => s + x.n, 0)} registos a arrumar: veja Definições › Diagnóstico.`); } } catch (e) {} }, 7000);
})();
