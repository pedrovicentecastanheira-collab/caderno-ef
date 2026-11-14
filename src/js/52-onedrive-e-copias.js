/* ---------- cópias automáticas: OneDrive e cópias diárias no aparelho ---------- */
// OneDrive: o professor regista uma vez uma aplicação na sua conta Microsoft (gratuito) e cola aqui o "ID da aplicação".
// O caderno entra com OAuth (código + PKCE, sem servidor) e guarda na pasta própria da app no OneDrive
// (Aplicações/Caderno EF): caderno-ef.json (sempre a mais recente) e uma cópia por dia da semana (7 dias).
// Os tokens ficam só neste aparelho. No navegador, a Microsoft limita a sessão a cerca de 24 h: depois, um toque volta a ligar.
const OD_AUTH = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/', OD_G = 'https://graph.microsoft.com/v1.0/me/', OD_SC = 'Files.ReadWrite.AppFolder offline_access User.Read';
const OD = {t:null, a:false, ultimo:null, erro:null, tm:null};
const odRedirect = () => location.origin + location.pathname;
const odOn = () => Store.mode !== 'cloud' && !!(CFG && CFG.odCid) && !!OD.t;
function odLoad() { try { OD.t = JSON.parse(localStorage.getItem('ef:od') || 'null'); OD.ultimo = localStorage.getItem('ef:odUlt'); } catch (e) {} }
function odSave() { try { if (OD.t) localStorage.setItem('ef:od', JSON.stringify(OD.t)); else localStorage.removeItem('ef:od'); } catch (e) {} }
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function odEntrar() {
  const ver = b64u(crypto.getRandomValues(new Uint8Array(48))), st = b64u(crypto.getRandomValues(new Uint8Array(16)));
  const ch = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ver)));
  try { sessionStorage.setItem('ef:odpk', JSON.stringify({ver, st})); } catch (e) {}
  Store.flush(); try { await Promise.all(Object.values(Store.q)); } catch (e) {}   // só sai depois de tudo gravado
  location.href = OD_AUTH + 'authorize?' + new URLSearchParams({client_id:CFG.odCid, response_type:'code', redirect_uri:odRedirect(), response_mode:'query', scope:OD_SC, code_challenge:ch, code_challenge_method:'S256', state:st});
}
async function odToken(body) {
  const r = await fetch(OD_AUTH + 'token', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams(Object.assign({client_id:CFG.odCid, scope:OD_SC}, body))});
  const j = await r.json(); if (!r.ok) throw new Error(j.error_description || j.error || 'token');
  OD.t = Object.assign(OD.t || {}, {at:j.access_token, rt:j.refresh_token || (OD.t || {}).rt, exp:Date.now() + (j.expires_in - 60) * 1000}); odSave(); return OD.t.at;
}
// Volta do início de sessão da Microsoft: troca o código pelo token e limpa o endereço.
async function odRetorno() {
  const q = new URLSearchParams(location.search); if (!q.has('code') && !q.has('error')) return;
  history.replaceState(null, '', odRedirect() + location.hash);
  let pk = null; try { pk = JSON.parse(sessionStorage.getItem('ef:odpk') || 'null'); sessionStorage.removeItem('ef:odpk'); } catch (e) {}
  if (q.has('error')) { toast('O OneDrive não foi ligado: ' + (q.get('error_description') || q.get('error')).slice(0, 120), 'bad'); return; }
  if (!pk || pk.st !== q.get('state') || !CFG.odCid) { toast('Não foi possível confirmar o início de sessão. Tente de novo.', 'bad'); return; }
  try { OD.t = {}; await odToken({grant_type:'authorization_code', code:q.get('code'), redirect_uri:odRedirect(), code_verifier:pk.ver});
    const me = await odApi('GET', ''); OD.t.nome = me.displayName || me.userPrincipalName || ''; odSave(); OD.a = false;
    toast('OneDrive ligado: a partir de agora o caderno guarda lá uma cópia sozinho.'); await odGuardar(); }
  catch (e) { OD.t = null; odSave(); toast('Não foi possível ligar ao OneDrive. Confirme o ID da aplicação e o endereço de redirecionamento.', 'bad'); }
  render();
}
async function odAt() {
  if (!OD.t) throw new Error('sem sessão'); if (OD.t.at && OD.t.exp > Date.now()) return OD.t.at;
  if (!OD.t.rt) throw new Error('sessão expirada');
  try { return await odToken({grant_type:'refresh_token', refresh_token:OD.t.rt}); } catch (e) { OD.a = true; throw e; }
}
async function odApi(method, path, body, type) {
  const at = await odAt(), r = await fetch(OD_G + path, {method, headers:Object.assign({Authorization:'Bearer ' + at}, type ? {'Content-Type':type} : {}), body});
  if (r.status === 401) { OD.t.exp = 0; OD.a = true; throw new Error('401'); }
  if (!r.ok) throw new Error('graph ' + r.status); return r.status === 204 ? null : r.headers.get('content-type') && r.headers.get('content-type').includes('json') ? r.json() : r.text();
}
// Envio: simples até 4 MB; acima, sessão de envio em blocos (os ficheiros com fotografias podem passar disso).
async function odEnviar(nome, txt) {
  const bytes = new TextEncoder().encode(txt), p = 'drive/special/approot:/' + encodeURIComponent(nome);
  if (bytes.length < 4e6) return odApi('PUT', p + ':/content', bytes, 'application/json');
  const s = await odApi('POST', p + ':/createUploadSession', JSON.stringify({item:{'@microsoft.graph.conflictBehavior':'replace'}}), 'application/json'), B = 327680 * 10;
  for (let i = 0; i < bytes.length; i += B) { const ch = bytes.slice(i, i + B), r = await fetch(s.uploadUrl, {method:'PUT', headers:{'Content-Range':`bytes ${i}-${i + ch.length - 1}/${bytes.length}`}, body:ch}); if (!r.ok && r.status !== 202) throw new Error('envio ' + r.status); }
}
const DIAS7 = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
async function odGuardar(manual) {
  if (!odOn()) return; OD.erro = null;
  try { const txt = JSON.stringify(syncData()); await odEnviar('caderno-ef.json', txt); await odEnviar('caderno-ef-' + DIAS7[new Date().getDay()] + '.json', txt);
    OD.ultimo = new Date().toISOString(); try { localStorage.setItem('ef:odUlt', OD.ultimo); localStorage.setItem('ef:lastBackup', today()); } catch (e) {}
    if (manual) toast('Cópia guardada no OneDrive.'); }
  catch (e) { OD.erro = OD.a ? 'Ligação ao OneDrive expirada: toque em "Voltar a ligar".' : 'Não foi possível guardar no OneDrive (sem internet?). Tenta de novo mais tarde.'; if (manual) toast(OD.erro, 'bad'); }
  if (UI.tab === 'defs') render();
}
async function odRecuperar() {
  try { const x = await odApi('GET', 'drive/special/approot:/caderno-ef.json:/content'), d = typeof x === 'string' ? JSON.parse(x) : x; if (!d || d.app !== 'Caderno EF') throw new Error('ficheiro');
    const n = syncMerge(d); render(); toast(n ? `Recuperado do OneDrive: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.` : 'Este aparelho já tinha tudo o que está no OneDrive.'); }
  catch (e) { toast(OD.a ? 'Ligação expirada: volte a ligar o OneDrive.' : 'Não foi possível ler a cópia do OneDrive.', 'bad'); }
}
// Guarda sozinho: 2 minutos depois da última alteração, ao sair da app e ao abrir (se a última cópia tiver mais de 12 h).
const _odSave = Store.save.bind(Store);
Store.save = function (k, obj, keep) { _odSave(k, obj, keep); if (odOn() && !OD.a) { clearTimeout(OD.tm); OD.tm = setTimeout(() => odGuardar(), 120000); } };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && odOn() && !OD.a && OD.tm) { clearTimeout(OD.tm); OD.tm = null; odGuardar(); } });

/* cópias diárias dentro do aparelho (últimos 7 dias), para voltar atrás num engano */
async function snapLista() { if (Store.mode !== 'idb') return []; try { return (await idbReq(Store.tx().getAllKeys())).filter(k => String(k).startsWith('snap:')).sort().reverse(); } catch (e) { return []; } }
async function snapFazer() {
  if (Store.mode !== 'idb' || !Object.keys(S.turmas || {}).length) return; const k = 'snap:' + today(), ks = await snapLista(); if (ks.includes(k)) return;
  try { await idbReq(Store.tx(true).put(JSON.parse(JSON.stringify(syncData())), k)); for (const old of ks.slice(6)) await idbReq(Store.tx(true).delete(old)); } catch (e) {}
}
(function esperar() { if (!CFG || !S || !S.cfg) { setTimeout(esperar, 300); return; }
  odLoad(); odRetorno();
  setTimeout(snapFazer, 5000);
  if (odOn() && (!OD.ultimo || Date.now() - new Date(OD.ultimo) > 12 * 3600e3)) setTimeout(() => odGuardar(), 6000);
})();

function vCopias() {
  if (Store.mode === 'cloud') return `<div class="sec-h"><h2>Cópias automáticas</h2></div><div class="card"><p class="small" style="margin:0">Este caderno está guardado na sua conta Claude: as cópias são automáticas e não precisa de configurar nada.</p></div>`;
  const ult = OD.ultimo ? fmtDate(OD.ultimo.slice(0, 10), {day:'numeric', month:'long'}) + ' às ' + new Date(OD.ultimo).toTimeString().slice(0, 5) : 'ainda não';
  let h = `<div class="sec-h"><h2>Cópia automática no OneDrive</h2></div><div class="card form">`;
  if (OD.t) h += `<p class="small" style="margin:0"><b class="ok-t">Ligado</b>${OD.t.nome ? ' · ' + esc(OD.t.nome) : ''} · última cópia: ${esc(ult)}</p>
      ${OD.a || OD.erro ? `<p class="note warn" style="margin:0">${esc(OD.erro || 'A ligação ao OneDrive expirou.')}</p>` : ''}
      <p class="hint" style="margin:0">Guarda sozinho 2 minutos depois de cada alteração, ao sair e ao abrir, na pasta OneDrive › Aplicações › Caderno EF (a mais recente e uma por dia da semana).</p>
      <div class="btn-row">${OD.a ? '<button class="btn primary" data-a="od-entrar">Voltar a ligar</button>' : '<button class="btn primary" data-a="od-agora">Guardar agora</button>'}<button class="btn" data-a="od-rec">Recuperar do OneDrive</button><button class="btn ghost" data-a="od-sair">Desligar</button></div>`;
  else h += `<p class="small" style="margin:0">O caderno guarda sozinho uma cópia no seu OneDrive. É preciso registar uma vez uma aplicação na sua conta Microsoft (gratuito, cerca de 10 minutos) e colar aqui o ID que ela lhe dá.</p>
      <details class="desc"><summary>Como registar (uma vez)</summary><ol class="small sync-ol">
        <li>No computador, abra <b>entra.microsoft.com</b> e entre com a sua conta Microsoft (Hotmail/Outlook).</li>
        <li>Vá a <b>Identidade › Aplicações › Registos de aplicações › Novo registo</b>.</li>
        <li>Nome: <b>Caderno EF</b>. Tipos de conta: <b>Apenas contas Microsoft pessoais</b>.</li>
        <li>URI de redirecionamento: escolha <b>Aplicação de página única (SPA)</b> e escreva <code>${esc(odRedirect())}</code></li>
        <li>Carregue em <b>Registar</b> e copie o <b>ID da aplicação (cliente)</b>.</li>
        <li>Cole-o abaixo e toque em <b>Ligar ao OneDrive</b>. Na primeira vez, a Microsoft pergunta se autoriza o acesso à pasta do Caderno EF: aceite.</li></ol>
        <p class="hint">Se usar o caderno noutro endereço (por exemplo, terminado em /app/), junte também esse endereço como URI de redirecionamento no mesmo registo. Se a Microsoft pedir para criar uma conta Azure gratuita antes de deixar registar, é esse o caminho.</p></details>
      <div class="sync-url"><input type="text" id="od-cid" data-in="od-cid" placeholder="ID da aplicação (ex.: 1a2b3c4d-…)" value="${esc(CFG.odCid || '')}" aria-label="ID da aplicação"><button class="btn primary" data-a="od-entrar"${CFG.odCid ? '' : ' disabled'}>Ligar ao OneDrive</button></div>`;
  h += `</div>`;
  if (Store.mode === 'idb') h += `<div class="sec-h"><h2>Cópias diárias neste aparelho</h2></div><div class="card form" id="snap-box"><p class="small" style="margin:0">Todos os dias o caderno guarda uma cópia aqui (últimos 7 dias), para poder voltar atrás se apagar ou alterar algo por engano. Não substitui a cópia fora do aparelho.</p><button class="btn sm" data-a="snap-ver">Ver as cópias</button></div>`;
  return h;
}
Object.assign(A, {
  'od-entrar': () => { const v = (($('#od-cid') || {}).value || CFG.odCid || '').trim(); if (!/^[0-9a-f-]{36}$/i.test(v)) { toast('O ID da aplicação tem o formato 1a2b3c4d-1234-…: copie-o do registo.', 'bad'); return; } CFG.odCid = v; Store.save('cfg', CFG); odEntrar(); },
  'od-agora': () => odGuardar(true),
  'od-rec': el => { if (!armed(el, 'Juntar a cópia do OneDrive?')) return; odRecuperar(); },
  'od-sair': el => { if (!armed(el, 'Confirmar')) return; OD.t = null; OD.a = false; odSave(); render(); toast('OneDrive desligado neste aparelho.'); },
  'snap-ver': async () => { const ks = await snapLista(); $('#snap-box').innerHTML = ks.length ? `<p class="small" style="margin:0">Voltar ao estado do caderno nesse dia (substitui tudo neste aparelho):</p><div class="list">${ks.map(k => `<div class="li"><span class="who">${esc(fmtDate(k.slice(5), {weekday:'long', day:'numeric', month:'long'}))}</span><button class="btn sm" data-a="snap-rest" data-k="${esc(k)}">Voltar a este dia</button></div>`).join('')}</div>` : '<p class="small">Ainda não há cópias diárias: a primeira é feita hoje.</p>'; },
  'snap-rest': async el => { if (!armed(el, 'Substituir tudo?')) return; try { const d = await idbReq(Store.tx().get(el.dataset.k)); if (!d) return; A._pending = d; await A['restore-go'](); toast('Caderno reposto como estava em ' + fmtDate(el.dataset.k.slice(5), {day:'numeric', month:'long'}) + '.'); } catch (e) { toast('Não foi possível repor a cópia.', 'bad'); } }
});
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.in === 'od-cid') { const b = el.parentNode.querySelector('[data-a="od-entrar"]'); if (b) b.disabled = !/^[0-9a-f-]{36}$/i.test(el.value.trim()); } });
