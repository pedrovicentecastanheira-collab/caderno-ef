/* ---------- sincronização por campo (aparelhos sem a conta Claude) ---------- */
// Cada campo alterado (ex.: nível do Rui em Voleibol no 1.º período) fica com a hora da alteração (FS.meta).
// As eliminações ficam registadas (FS.tomb). Ao juntar uma cópia de outro aparelho, fica o valor mais recente de
// cada campo: dois aparelhos a mexer em alunos diferentes já não se anulam. Se o mesmo campo mudou nos dois desde a
// última vez que se juntaram, fica o mais recente e regista-se um conflito para o professor confirmar.
// Turmas, aulas, avaliações e definições juntam-se campo a campo; fotografias, documentos e histórico, registo a registo.
const FS_KINDS = ['turmas', 'aulas', 'aval', 'cfg'], FS_SEP = '␟';
const FS = {on:false, dev:null, meta:{}, tomb:{}, seen:{}, conf:[], js:{}, merging:false, t:null};
const fsKey = (k, id) => k + FS_SEP + id;
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
// Folhas de um objeto: caminho → valor em texto (as listas contam como uma folha).
function folhas(o, pre, out) {
  Object.keys(o || {}).forEach(k => { if (k === '_u' && !pre) return; const v = o[k], p = pre ? pre + FS_SEP + k : k;
    if (isObj(v) && Object.keys(v).length) folhas(v, p, out); else out[p] = JSON.stringify(v === undefined ? null : v); });
  return out;
}
function getPath(o, parts) { for (const p of parts) { if (!isObj(o) || !(p in o)) return undefined; o = o[p]; } return o; }
function setPath(o, parts, v) {
  for (let i = 0; i < parts.length - 1; i++) { if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
  if (v === undefined) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = v;
}
function fsInit() {
  FS.on = Store.mode !== 'cloud'; if (!FS.on) return;
  try { FS.dev = localStorage.getItem('ef:dev'); if (!FS.dev) { FS.dev = uid(); localStorage.setItem('ef:dev', FS.dev); } } catch (e) { FS.dev = FS.dev || uid(); }
  FS_KINDS.forEach(k => Object.values(S[k] || {}).forEach(o => { if (o && o.id) FS.js[fsKey(k, o.id)] = clone(o); }));
}
async function fsLoad() {
  try { let x = null; if (Store.mode === 'idb') x = await idbReq(Store.tx().get('sync:meta')); else x = JSON.parse(localStorage.getItem('ef:syncmeta') || 'null');
    if (x) Object.assign(FS, {meta:x.meta || {}, tomb:x.tomb || {}, seen:x.seen || {}, conf:x.conf || []}); } catch (e) {}
}
function fsGuardar() {
  clearTimeout(FS.t); FS.t = setTimeout(async () => {
    // compacta: as marcas com mais de 180 dias já foram juntadas por todos os aparelhos
    const lim = Date.now() - 180 * 864e5; Object.keys(FS.meta).forEach(p => { if (FS.meta[p] < lim) delete FS.meta[p]; }); Object.keys(FS.tomb).forEach(p => { if (FS.tomb[p] < lim) delete FS.tomb[p]; });
    const x = {meta:FS.meta, tomb:FS.tomb, seen:FS.seen, conf:FS.conf.slice(-100)};
    try { if (Store.mode === 'idb') await idbReq(Store.tx(true).put(x, 'sync:meta')); else localStorage.setItem('ef:syncmeta', JSON.stringify(x)); } catch (e) {}
  }, 800);
}
// Regista a hora de cada campo que mudou desde a última gravação deste registo.
function fsMarcar(k, obj) {
  if (!FS.on || !obj || !obj.id) return; const key = fsKey(k, obj.id);
  if (!FS_KINDS.includes(k)) { delete FS.tomb[key]; return; }
  const a = folhas(FS.js[key] || {}, '', {}), b = folhas(obj, '', {}), now = Date.now(); let ch = false;
  if (!FS.merging) { new Set([...Object.keys(a), ...Object.keys(b)]).forEach(p => { if (a[p] !== b[p]) { FS.meta[key + FS_SEP + p] = now; ch = true; } }); if (FS.tomb[key]) { delete FS.tomb[key]; ch = true; } }
  FS.js[key] = clone(obj); if (ch) fsGuardar();
}
const _fsSave = Store.save.bind(Store), _fsDel = Store.del.bind(Store);
Store.save = function (k, obj, keep) { try { fsMarcar(k, obj); } catch (e) {} return _fsSave(k, obj, keep); };
Store.del = function (k, id) { if (FS.on && !FS.merging) { FS.tomb[fsKey(k, id)] = Date.now(); delete FS.js[fsKey(k, id)]; fsGuardar(); } return _fsDel(k, id); };
// As cópias levam as marcas de cada campo e as eliminações.
const _syncData = syncData;
syncData = function () { const d = _syncData(); if (FS.on) Object.assign(d, {sync2:true, dev:FS.dev, at:Date.now(), meta:FS.meta, tomb:FS.tomb}); return d; };

// Junta uma cópia campo a campo. Devolve o número de registos alterados.
function fsMerge(d) {
  migrate(d); const rdev = d.dev || '?', seen = FS.seen[rdev] || 0, rmeta = d.meta || {}, rtomb = d.tomb || {}, mudou = new Set(), now = Date.now();
  const porReg = {}; Object.keys(rmeta).forEach(p => { const i = p.indexOf(FS_SEP, p.indexOf(FS_SEP) + 1), key = i < 0 ? p : p.slice(0, i); (porReg[key] = porReg[key] || []).push(p); });
  const maxMeta = (M, key) => Object.keys(M).filter(p => p === key || p.startsWith(key + FS_SEP)).reduce((m, p) => Math.max(m, M[p]), 0);
  FS.merging = true;
  try {
    for (const k of ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist', 'cfg']) {
      Object.values(d[k] || {}).forEach(R => {
        if (!R || !R.id) return; const key = fsKey(k, R.id), L = S[k][R.id];
        if (!L) {   // registo que não existe aqui: entra, a não ser que tenha sido apagado aqui depois
          if (FS.tomb[key] && FS.tomb[key] >= Math.max(maxMeta(rmeta, key), R._u || 0)) return;
          S[k][R.id] = clone(R); Object.keys(rmeta).forEach(p => { if (p.startsWith(key + FS_SEP)) FS.meta[p] = Math.max(FS.meta[p] || 0, rmeta[p]); });
          delete FS.tomb[key]; mudou.add(k + '\u0000' + R.id); return;
        }
        if (!FS_KINDS.includes(k)) { if ((R._u || 0) > (L._u || 0)) { S[k][R.id] = clone(R); mudou.add(k + '\u0000' + R.id); } return; }
        (porReg[key] || []).forEach(p => {
          const rt = rmeta[p], lt = FS.meta[p] || 0; if (rt <= lt) return;
          const parts = p.split(FS_SEP).slice(2), rv = getPath(R, parts), lv = getPath(L, parts);
          if (JSON.stringify(rv) === JSON.stringify(lv)) { FS.meta[p] = rt; return; }
          if (lt > seen && rt > seen && lt) FS.conf.push({p, ficou:rv, outro:lv, de:rdev, t:now});   // mudou nos dois: fica o mais recente
          setPath(L, parts, rv === undefined ? undefined : clone(rv)); FS.meta[p] = rt; mudou.add(k + '\u0000' + R.id);
        });
        // conflito ao contrário: o valor daqui é mais recente, mas o outro aparelho também o tinha alterado
        (porReg[key] || []).forEach(p => { const rt = rmeta[p], lt = FS.meta[p] || 0; if (lt > rt && rt > seen && lt > seen) { const parts = p.split(FS_SEP).slice(2), rv = getPath(R, parts), lv = getPath(L, parts);
          if (JSON.stringify(rv) !== JSON.stringify(lv) && !FS.conf.some(c => c.p === p && c.t === now)) FS.conf.push({p, ficou:lv, outro:rv, de:rdev, t:now}); } });
      });
    }
    // eliminações feitas no outro aparelho
    Object.entries(rtomb).forEach(([key, ts]) => { const i = key.indexOf(FS_SEP), k = key.slice(0, i), id = key.slice(i + 1), L = S[k] && S[k][id];
      if (!L) { FS.tomb[key] = Math.max(FS.tomb[key] || 0, ts); return; }
      if (ts > Math.max(maxMeta(FS.meta, key), FS_KINDS.includes(k) ? 0 : (L._u || 0))) { delete S[k][id]; Store.del(k, id); delete FS.js[key]; FS.tomb[key] = ts; mudou.add('x'); } });
    mudou.forEach(x => { const [k, id] = x.split('\u0000'); if (!id || !S[k][id]) return; const o = S[k][id]; if (k === 'aval') SHADOW[o.id] = clone(o); Store.save(k, o, true); });
  } finally { FS.merging = false; }
  if (d.cfg && d.cfg.geral) { CFG = S.cfg.geral; CFG.fit = Object.assign(clone(FITREF), CFG.fit || {}); while (CFG.per.length < 3) CFG.per.push({ini:'', fim:''}); }
  if (d.at) FS.seen[rdev] = Math.max(FS.seen[rdev] || 0, d.at);
  if (!S.turmas[UI.turma]) UI.turma = Object.keys(S.turmas)[0] || null;
  fsGuardar(); return mudou.size;
}
const _syncMerge = syncMerge;
syncMerge = function (d) { return FS.on && d && d.sync2 ? fsMerge(d) : _syncMerge(d); };

/* conflitos: o que ficou e o que se pode repor */
function confRotulo(p) {
  const [k, id, ...r] = p.split(FS_SEP), al = aid => { for (const t of Object.values(S.turmas)) { const a = (t.alunos || []).find(x => x.id === aid); if (a) return a.nome; } return 'aluno'; };
  if (k === 'aval') { const [tid, per] = [id.slice(0, id.lastIndexOf('_')), id.slice(id.lastIndexOf('_') + 1)], t = S.turmas[tid], base = (t ? t.nome : 'turma') + ' · ' + perLabel(+per || 1);
    const o = {af:'nível', comp:'competência', fit:'FITescola', con:'conhecimentos', av:'atitudes', obs:'observação', ev:'evidência', des:'desafio'}[r[0]] || r[0];
    return `${base} · ${r[1] ? al(r[1]) + ' · ' : ''}${o}${r[2] ? ' em ' + r[2] : ''}`; }
  if (k === 'aulas') { const a = S.aulas[id]; return `Aula de ${a ? fmtDate(a.data, {day:'numeric', month:'short'}) : '?'} · ${r[0] === 'presencas' && r[1] ? 'presença de ' + al(r[1]) : r.join(' › ')}`; }
  if (k === 'turmas') { const t = S.turmas[id]; return `${t ? t.nome : 'Turma'} · ${r.join(' › ')}`; }
  return 'Definições · ' + r.join(' › ');
}
const confValor = v => v === undefined || v === null ? '(vazio)' : typeof v === 'string' ? v : Array.isArray(v) ? v.length + ' registos' : typeof v === 'object' ? '(vários)' : String(v);
function vConflitos() {
  if (!FS.on || !FS.conf.length) return '';
  return `<div class="sec-h"><h2>Conflitos de sincronização (${FS.conf.length})</h2><button class="link" data-a="conf-ok-all">Aceitar todos</button></div><div class="card"><p class="hint" style="margin:0 0 6px">Estes campos foram alterados nos dois aparelhos antes de se juntarem. Ficou a alteração mais recente; pode repor a outra.</p>
    ${FS.conf.slice(-30).reverse().map((c, i) => { const j = FS.conf.length - 1 - i; return `<div class="conf"><b>${esc(confRotulo(c.p))}</b><span class="small">Ficou: <b>${esc(confValor(c.ficou))}</b> · outro valor: ${esc(confValor(c.outro))}</span><span class="btn-row"><button class="btn sm" data-a="conf-ok" data-i="${j}">Manter</button><button class="btn sm ghost" data-a="conf-troca" data-i="${j}">Repor o outro</button></span></div>`; }).join('')}</div>`;
}
Object.assign(A, {
  'conf-ok': el => { FS.conf.splice(+el.dataset.i, 1); fsGuardar(); render(); },
  'conf-ok-all': () => { FS.conf = []; fsGuardar(); render(); toast('Conflitos aceites.'); },
  'conf-troca': el => { const c = FS.conf[+el.dataset.i]; if (!c) return; const [k, id, ...parts] = c.p.split(FS_SEP), o = k === 'cfg' ? S.cfg[id] : S[k][id];
    if (o) { setPath(o, parts, c.outro === undefined ? undefined : clone(c.outro)); if (k === 'aval') touchAval(o); else Store.save(k, o); }
    FS.conf.splice(+el.dataset.i, 1); fsGuardar(); render(); toast('Valor reposto: segue para os outros aparelhos na próxima sincronização.'); }
});

/* OneDrive: cada aparelho guarda o seu ficheiro (dev-<aparelho>.json) e junta os dos outros */
async function odPuxar() {
  if (!odOn() || OD.a || !FS.on) return 0; let n = 0;
  try { const L = await odApi('GET', 'drive/special/approot/children?$select=name,lastModifiedDateTime&$top=200'), vistos = JSON.parse(localStorage.getItem('ef:odvistos') || '{}');
    for (const f of (L.value || []).filter(f => /^dev-.+\.json$/.test(f.name) && f.name !== 'dev-' + FS.dev + '.json')) {
      if (vistos[f.name] === f.lastModifiedDateTime) continue;
      const x = await odApi('GET', 'drive/special/approot:/' + encodeURIComponent(f.name) + ':/content'), d = typeof x === 'string' ? JSON.parse(await odDecifrar(x)) : JSON.parse(await odDecifrar(JSON.stringify(x)));
      if (d && d.app === 'Caderno EF') n += syncMerge(d); vistos[f.name] = f.lastModifiedDateTime; }
    localStorage.setItem('ef:odvistos', JSON.stringify(vistos)); }
  catch (e) {}
  if (n) { render(); toast(`Sincronizado com o OneDrive: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.`); }
  return n;
}
const odDecifrar = async txt => typeof copiaDecifrar === 'function' ? copiaDecifrar(txt) : txt;
const _odGuardar = odGuardar;
odGuardar = async function (manual) { if (FS.on) await odPuxar(); await _odGuardar(manual); };
const _odEnviar = odEnviar;
odEnviar = async function (nome, txt) { const r = await _odEnviar(nome, txt); if (nome === 'caderno-ef.json' && FS.on) await _odEnviar('dev-' + FS.dev + '.json', txt); return r; };
setInterval(() => { if (document.visibilityState === 'visible') odPuxar(); }, 5 * 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(odPuxar, 1500); });

(function esperar() { if (!CFG || !S || !S.cfg) { setTimeout(esperar, 200); return; } fsInit(); if (FS.on) fsLoad().then(() => setTimeout(odPuxar, 3000)); })();
