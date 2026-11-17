/* ---------- sincronizar entre aparelhos ---------- */
// Três caminhos, do mais simples ao mais manual:
// 1) a versão na conta Claude, que já guarda tudo na conta e é igual em qualquer aparelho;
// 2) enviar e receber um ficheiro de sincronização: junta registo a registo e fica a versão mais recente de cada um;
// 3) no computador (Chrome ou Edge), ligar o caderno a um ficheiro numa pasta do Google Drive ou do OneDrive:
//    grava-o sozinho a cada alteração e, ao abrir, junta o que lá estiver de mais recente.
const SYNC = {h:null, ok:false, t:null, quando:null};
let syncData = () => { Store.flush(); return {app:'Caderno EF', versao:1, sync:true, exportado:new Date().toISOString(), cfg:S.cfg, turmas:S.turmas, aulas:S.aulas, aval:S.aval, fotos:S.fotos, docs:S.docs, hist:S.hist}; };
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
// Junta uma cópia: em cada turma, aula, avaliação, fotografia, documento e definições fica a versão mais recente.
function syncMerge(d) {
  migrate(d); let n = 0;
  for (const k of ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist']) Object.values(d[k] || {}).forEach(o => { if (!o || !o.id) return; const cur = S[k][o.id];
    if (!cur || (o._u || 0) > (cur._u || 0)) { S[k][o.id] = o; if (k === 'aval') SHADOW[o.id] = clone(o); Store.save(k, o, true); n++; } });
  const g = d.cfg && d.cfg.geral; if (g && (g._u || 0) > (CFG._u || 0)) { S.cfg.geral = g; CFG = g; CFG.fit = Object.assign(clone(FITREF), CFG.fit || {}); while (CFG.per.length < 3) CFG.per.push({ini:'', fim:''}); Store.save('cfg', CFG, true); n++; }
  if (!S.turmas[UI.turma]) UI.turma = Object.keys(S.turmas)[0] || null;
  return n;
}
const syncAgora = () => { SYNC.quando = new Date().toISOString(); lsSet('ef:lastSync', SYNC.quando); lsSet('ef:lastBackup', today()); };
async function syncReceber(file) {
  let d; try { d = JSON.parse(await file.text()); } catch (e) { toast('Este ficheiro não é uma cópia do Caderno EF.', 'bad'); return; }
  if (!d || d.app !== 'Caderno EF') { toast('Este ficheiro não é uma cópia do Caderno EF.', 'bad'); return; }
  const n = syncMerge(d); syncAgora(); render(); toast(n ? `Sincronizado: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.` : 'Já estava tudo igual.');
}
/* ficheiro ligado (File System Access API) */
const fsOk = () => typeof window.showSaveFilePicker === 'function' && Store.mode === 'idb';
async function syncHandleGet() { try { return await idbReq(Store.tx().get('sync:handle')); } catch (e) { return null; } }
async function syncHandleSet(h) { try { await idbReq(h ? Store.tx(true).put(h, 'sync:handle') : Store.tx(true).delete('sync:handle')); } catch (e) {} }
async function syncPerm(ask) { if (!SYNC.h) return false; try { const o = {mode:'readwrite'}; let p = await SYNC.h.queryPermission(o); if (p !== 'granted' && ask) p = await SYNC.h.requestPermission(o); SYNC.ok = p === 'granted'; } catch (e) { SYNC.ok = false; } return SYNC.ok; }
async function syncLer() {
  try { const f = await SYNC.h.getFile(); if (!f.size) return 0; const d = JSON.parse(await f.text()); return d && d.app === 'Caderno EF' ? syncMerge(d) : 0; } catch (e) { return 0; }
}
async function syncEscrever() {
  if (!SYNC.h || !SYNC.ok) return; try { const w = await SYNC.h.createWritable(); await w.write(JSON.stringify(syncData())); await w.close(); syncAgora(); } catch (e) { SYNC.ok = false; toast('Não foi possível gravar o ficheiro de sincronização. Volte a ligá-lo em Definições › Sincronizar.', 'bad'); }
}
async function syncLigado(ask) {
  if (!await syncPerm(ask)) { render(); return; }
  const n = await syncLer(); await syncEscrever(); render(); if (n) toast(`Sincronizado com o ficheiro: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.`);
}
// Depois de cada alteração, grava o ficheiro ligado (no máximo de 8 em 8 segundos).
const _save = Store.save.bind(Store);
Store.save = function (k, obj, keep) { _save(k, obj, keep); if (SYNC.h && SYNC.ok) { clearTimeout(SYNC.t); SYNC.t = setTimeout(syncEscrever, 8000); } };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && SYNC.h && SYNC.ok) { clearTimeout(SYNC.t); syncEscrever(); } else if (document.visibilityState === 'visible' && SYNC.h && SYNC.ok) syncLigado(false); });
(function esperar() { if (!CFG || !S || !S.cfg) { setTimeout(esperar, 300); return; }
  SYNC.quando = lsGet('ef:lastSync');
  if (fsOk()) syncHandleGet().then(h => { if (h) { SYNC.h = h; syncLigado(false); } });
})();

function vSync() {
  const cloud = Store.mode === 'cloud', q = SYNC.quando ? fmtDate(SYNC.quando.slice(0, 10), {day:'numeric', month:'long'}) + ' às ' + SYNC.quando.slice(11, 16) : 'nunca';
  let h = `<div class="sec-h"><h2>Sincronizar</h2></div>
    <div class="card sync-st ${cloud ? 'ok' : 'warn'}"><b>${cloud ? 'Este caderno sincroniza sozinho' : 'Este caderno só existe neste aparelho'}</b><p class="small" style="margin:4px 0 0">${cloud ? 'Está guardado na sua conta Claude: é o mesmo no telemóvel e no computador, sempre que o abrir com a sua conta.' : 'O que registar aqui não aparece noutro aparelho até sincronizar. Escolha uma das formas abaixo.'}</p></div>`;
  if (!cloud) h += `<div class="card form"><b>1. Usar a versão sincronizada (recomendado)</b><p class="small" style="margin:0">A versão do Caderno EF na sua conta Claude guarda tudo na conta e abre igual no telemóvel (app Claude ou claude.ai) e no computador. Para levar o que já tem:</p>
      <ol class="small sync-ol"><li>Toque em <b>Enviar para o outro aparelho</b> (abaixo) e guarde o ficheiro.</li><li>Abra o Caderno EF na sua conta Claude${CFG.syncUrl ? '' : ' (guarde aqui o endereço para o abrir com um toque)'}.</li><li>Lá, em Definições › Sincronizar, toque em <b>Receber de outro aparelho</b> e escolha o ficheiro.</li></ol>
      <div class="sync-url"><input type="url" id="sync-url" data-in="sync-url" placeholder="Endereço da versão na conta Claude" value="${esc(CFG.syncUrl || '')}" aria-label="Endereço da versão sincronizada">${CFG.syncUrl ? `<a class="btn" href="${esc(CFG.syncUrl)}" target="_blank" rel="noopener">Abrir</a>` : ''}</div></div>`;
  h += `<div class="card form"><b>${cloud ? '' : '2. '}Enviar e receber entre aparelhos</b><p class="small" style="margin:0">Envia um ficheiro com tudo (pelo Drive, email ou WhatsApp). Ao receber, junta registo a registo e fica a versão mais recente de cada turma, aula e avaliação: nada se perde dos dois lados. Os registos apagados num aparelho têm de ser apagados também no outro.</p>
    <div class="btn-row"><button class="btn primary" data-a="sync-env">Enviar para o outro aparelho</button><button class="btn" data-a="sync-rec">Receber de outro aparelho</button></div>
    <p class="hint" style="margin:0">Última sincronização neste aparelho: ${esc(q)}.</p></div>`;
  if (fsOk()) h += `<div class="card form"><b>3. Ficheiro ligado (computador)</b><p class="small" style="margin:0">Escolha um ficheiro numa pasta do Google Drive ou do OneDrive deste computador: o caderno grava-o sozinho a cada alteração e, ao abrir, junta o que lá estiver de mais recente. No telemóvel, receba esse mesmo ficheiro com <b>Receber de outro aparelho</b>.</p>
    ${SYNC.h ? `<p class="small" style="margin:0"><b>Ligado a:</b> ${esc(SYNC.h.name)} · ${SYNC.ok ? '<span class="ok-t">a sincronizar</span>' : '<span class="bad-t">precisa de autorização</span>'}</p><div class="btn-row">${SYNC.ok ? '<button class="btn" data-a="sync-fs-go">Sincronizar agora</button>' : '<button class="btn primary" data-a="sync-fs-auth">Autorizar e sincronizar</button>'}<button class="btn ghost" data-a="sync-fs-off">Desligar</button></div>` : '<button class="btn" data-a="sync-fs">Ligar a um ficheiro</button>'}</div>`;
  return h;
}
Object.assign(A, {
  'sync-env': () => { saveFile('caderno-ef-sincronizar-' + today() + '.json', new Blob([JSON.stringify(syncData())], {type:'application/json'})); syncAgora(); render(); },
  'sync-rec': () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json'; i.onchange = () => { if (i.files[0]) syncReceber(i.files[0]); }; i.click(); },
  'sync-fs': async () => { try { const h = await window.showSaveFilePicker({suggestedName:'caderno-ef-sincronizar.json', types:[{description:'Caderno EF', accept:{'application/json':['.json']}}]}); SYNC.h = h; await syncHandleSet(h); await syncLigado(true); toast('Ficheiro ligado: o caderno passa a gravá-lo sozinho.'); } catch (e) { if (e && e.name !== 'AbortError') toast('Não foi possível ligar o ficheiro.', 'bad'); } },
  'sync-fs-auth': () => syncLigado(true),
  'sync-fs-go': () => syncLigado(false),
  'sync-fs-off': async () => { SYNC.h = null; SYNC.ok = false; await syncHandleSet(null); render(); toast('Ficheiro desligado.'); }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'sync-url') { const v = el.value.trim(); CFG.syncUrl = /^https:\/\//.test(v) ? v : ''; Store.save('cfg', CFG); render(); } });
