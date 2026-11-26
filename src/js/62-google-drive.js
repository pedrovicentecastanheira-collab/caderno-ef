/* ---------- cópia automática no Google Drive ---------- */
// Alternativa ao OneDrive para contas Gmail pessoais. O professor cria uma vez um "ID de cliente OAuth" (gratuito, sem cartão)
// em console.cloud.google.com e cola-o aqui. O caderno entra pela página da Google (fluxo de navegador, sem servidor) e
// guarda na pasta "Caderno EF" do Drive: um ficheiro por aparelho (dev-<aparelho>.json, que os outros aparelhos juntam
// campo a campo), caderno-ef.json (o mais recente) e uma cópia por dia da semana. Só vê os ficheiros que ele próprio criou
// (permissão drive.file). A Google dá sessões de 1 hora: ao abrir o caderno, renova sozinha sem pedir nada (se ainda tiver
// sessão Google no navegador); se não conseguir, aparece "Voltar a ligar".
const GD_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth', GD_API = 'https://www.googleapis.com/drive/v3/', GD_UP = 'https://www.googleapis.com/upload/drive/v3/files';
const GD_SC = 'https://www.googleapis.com/auth/drive.file email', GD_PASTA = 'Caderno EF';
const GD = {t:null, a:false, ultimo:null, erro:null, tm:null, ids:{}};
const gdOn = () => Store.mode !== 'cloud' && !!(CFG && CFG.gdCid) && !!GD.t;
function gdLoad() { try { GD.t = JSON.parse(localStorage.getItem('ef:gd') || 'null'); GD.ultimo = localStorage.getItem('ef:gdUlt'); GD.ids = JSON.parse(localStorage.getItem('ef:gdids') || '{}'); } catch (e) {} }
function gdSave() { try { if (GD.t) localStorage.setItem('ef:gd', JSON.stringify(GD.t)); else localStorage.removeItem('ef:gd'); localStorage.setItem('ef:gdids', JSON.stringify(GD.ids)); } catch (e) {} }
async function gdEntrar(silencioso) {
  const st = b64u(crypto.getRandomValues(new Uint8Array(16)));
  try { sessionStorage.setItem('ef:gdst', JSON.stringify({st, silencioso:!!silencioso})); if (silencioso) localStorage.setItem('ef:gdtent', String(Date.now())); } catch (e) {}
  Store.flush(); try { await Promise.race([Promise.all(Object.values(Store.q)), new Promise(r => setTimeout(r, 3000))]); } catch (e) {}   // só sai depois de tudo gravado (no máximo 3 s)
  const p = {client_id:CFG.gdCid, redirect_uri:odRedirect(), response_type:'token', scope:GD_SC, include_granted_scopes:'true', state:st};
  if (silencioso) { p.prompt = 'none'; if (GD.t && GD.t.email) p.login_hint = GD.t.email; } else p.prompt = 'consent';
  location.href = GD_AUTH + '?' + new URLSearchParams(p);
}
// Volta da página da Google: o token vem depois do "#".
async function gdRetorno() {
  const h = new URLSearchParams(location.hash.slice(1)); if (!h.has('access_token') && !(h.has('error') && h.has('state'))) return;
  let pk = null; try { pk = JSON.parse(sessionStorage.getItem('ef:gdst') || 'null'); sessionStorage.removeItem('ef:gdst'); } catch (e) {}
  if (!pk || pk.st !== h.get('state')) return;   // não é nosso
  history.replaceState(null, '', odRedirect() + location.search);
  if (h.has('error')) { if (pk.silencioso) { GD.a = true; render(); return; } toast('O Google Drive não foi ligado: ' + (h.get('error_description') || h.get('error')).slice(0, 120), 'bad'); return; }
  const novo = !GD.t;
  GD.t = Object.assign(GD.t || {}, {at:h.get('access_token'), exp:Date.now() + ((+h.get('expires_in') || 3600) - 60) * 1000}); GD.a = false; gdSave();
  try { if (!GD.t.email) { const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {headers:{Authorization:'Bearer ' + GD.t.at}}); if (r.ok) { const j = await r.json(); GD.t.email = j.email || ''; gdSave(); } } } catch (e) {}
  if (novo) toast('Google Drive ligado: a partir de agora o caderno guarda lá uma cópia sozinho.');
  await gdGuardar(); render();
}
async function gdApi(method, url, body, type) {
  if (!GD.t || !GD.t.at || GD.t.exp < Date.now()) { GD.a = true; throw new Error('sessão expirada'); }
  const r = await fetch(url, {method, headers:Object.assign({Authorization:'Bearer ' + GD.t.at}, type ? {'Content-Type':type} : {}), body});
  if (r.status === 401) { GD.t.exp = 0; GD.a = true; gdSave(); throw new Error('401'); }
  if (!r.ok) throw new Error('drive ' + r.status);
  const ct = r.headers.get('content-type') || ''; return ct.includes('json') ? r.json() : r.text();
}
const gdQ = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
async function gdPasta() {
  if (GD.ids._pasta) return GD.ids._pasta;
  const L = await gdApi('GET', GD_API + 'files?' + new URLSearchParams({q:`name='${gdQ(GD_PASTA)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields:'files(id)', spaces:'drive'}));
  let id = (L.files || [])[0] && L.files[0].id;
  if (!id) id = (await gdApi('POST', GD_API + 'files?fields=id', JSON.stringify({name:GD_PASTA, mimeType:'application/vnd.google-apps.folder'}), 'application/json')).id;
  GD.ids._pasta = id; gdSave(); return id;
}
async function gdIdDe(nome, criar) {
  if (GD.ids[nome]) return GD.ids[nome];
  const pasta = await gdPasta(), L = await gdApi('GET', GD_API + 'files?' + new URLSearchParams({q:`name='${gdQ(nome)}' and '${pasta}' in parents and trashed=false`, fields:'files(id)'}));
  let id = (L.files || [])[0] && L.files[0].id;
  if (!id && criar) id = (await gdApi('POST', GD_API + 'files?fields=id', JSON.stringify({name:nome, parents:[pasta], mimeType:'application/json'}), 'application/json')).id;
  if (id) { GD.ids[nome] = id; gdSave(); } return id;
}
async function gdEnviar(nome, txt) {
  txt = typeof copiaCifrar === 'function' ? await copiaCifrar(txt) : txt;
  const envia = async () => { const id = await gdIdDe(nome, true); return gdApi('PATCH', GD_UP + '/' + id + '?uploadType=media&fields=id', txt, 'application/json'); };
  try { return await envia(); } catch (e) { if (/drive 404/.test(e.message)) { delete GD.ids[nome]; gdSave(); return envia(); } throw e; }   // apagado no Drive: cria de novo
}
async function gdLer(id) { const x = await gdApi('GET', GD_API + 'files/' + id + '?alt=media'); const txt = typeof x === 'string' ? x : JSON.stringify(x); return JSON.parse(typeof copiaDecifrar === 'function' ? await copiaDecifrar(txt) : txt); }
// Junta os ficheiros dos outros aparelhos que mudaram desde a última vez.
async function gdPuxar() {
  if (!gdOn() || GD.a || typeof FS === 'undefined' || !FS.on) return 0; let n = 0;
  try { const pasta = await gdPasta(), L = await gdApi('GET', GD_API + 'files?' + new URLSearchParams({q:`'${pasta}' in parents and trashed=false and name contains 'dev-'`, fields:'files(id,name,modifiedTime)', pageSize:'200'}));
    const vistos = JSON.parse(localStorage.getItem('ef:gdvistos') || '{}');
    for (const f of (L.files || []).filter(f => /^dev-.+\.json$/.test(f.name) && f.name !== 'dev-' + FS.dev + '.json')) {
      if (vistos[f.name] === f.modifiedTime) continue;
      const d = await gdLer(f.id); if (d && d.app === 'Caderno EF') n += syncMerge(d); vistos[f.name] = f.modifiedTime; }
    localStorage.setItem('ef:gdvistos', JSON.stringify(vistos)); }
  catch (e) {}
  if (n) { render(); toast(`Sincronizado com o Google Drive: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.`); }
  return n;
}
async function gdGuardar(manual) {
  if (!gdOn()) return; GD.erro = null;
  try { await gdPuxar(); const txt = JSON.stringify(syncData());
    if (typeof FS !== 'undefined' && FS.on) await gdEnviar('dev-' + FS.dev + '.json', txt);
    await gdEnviar('caderno-ef.json', txt); await gdEnviar('caderno-ef-' + DIAS7[new Date().getDay()] + '.json', txt);
    GD.ultimo = new Date().toISOString(); try { localStorage.setItem('ef:gdUlt', GD.ultimo); localStorage.setItem('ef:lastBackup', today()); } catch (e) {}
    if (manual) toast('Cópia guardada no Google Drive.'); }
  catch (e) { GD.erro = GD.a ? 'A ligação ao Google Drive expirou: toque em "Voltar a ligar".' : 'Não foi possível guardar no Google Drive (sem internet?). Tenta de novo mais tarde.'; if (manual) toast(GD.erro, 'bad'); }
  if (UI.tab === 'defs') render();
}
async function gdRecuperar() {
  try { const id = await gdIdDe('caderno-ef.json', false); if (!id) { toast('Ainda não há nenhuma cópia no Google Drive.', 'bad'); return; }
    const d = await gdLer(id); if (!d || d.app !== 'Caderno EF') throw new Error('ficheiro');
    const n = syncMerge(d) + await gdPuxar(); render(); toast(n ? `Recuperado do Google Drive: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.` : 'Este aparelho já tinha tudo o que está no Google Drive.'); }
  catch (e) { toast(GD.a ? 'A ligação expirou: volte a ligar o Google Drive.' : 'Não foi possível ler a cópia do Google Drive.', 'bad'); }
}
// Guarda sozinho 2 minutos depois da última alteração e ao sair; junta os outros aparelhos ao voltar à app e de 5 em 5 minutos.
{ const _s = Store.save.bind(Store); Store.save = function (k, obj, keep) { _s(k, obj, keep); if (gdOn() && !GD.a) { clearTimeout(GD.tm); GD.tm = setTimeout(() => gdGuardar(), 120000); } }; }
document.addEventListener('visibilitychange', () => {
  if (!gdOn() || GD.a) return;
  if (document.visibilityState === 'hidden' && GD.tm) { clearTimeout(GD.tm); GD.tm = null; gdGuardar(); }
  else if (document.visibilityState === 'visible') setTimeout(gdPuxar, 1500);
});
setInterval(() => { if (document.visibilityState === 'visible' && gdOn() && !GD.a) gdPuxar(); }, 5 * 60000);

function vGoogleDrive() {
  if (Store.mode === 'cloud') return '';
  const ult = GD.ultimo ? fmtDate(GD.ultimo.slice(0, 10), {day:'numeric', month:'long'}) + ' às ' + new Date(GD.ultimo).toTimeString().slice(0, 5) : 'ainda não';
  let h = `<div class="sec-h"><h2>Cópia automática no Google Drive</h2></div><div class="card form">`;
  if (GD.t) h += `<p class="small" style="margin:0"><b class="ok-t">Ligado</b>${GD.t.email ? ' · ' + esc(GD.t.email) : ''} · última cópia: ${esc(ult)}</p>
      ${GD.a || GD.erro ? `<p class="note warn" style="margin:0">${esc(GD.erro || 'A ligação ao Google Drive expirou.')}</p>` : ''}
      <p class="hint" style="margin:0">Guarda sozinho 2 minutos depois de cada alteração e ao sair, na pasta <b>Caderno EF</b> do seu Google Drive. Os outros aparelhos ligados à mesma conta juntam as alterações deste.</p>
      <div class="btn-row">${GD.a ? '<button class="btn primary" data-a="gd-entrar">Voltar a ligar</button>' : '<button class="btn primary" data-a="gd-agora">Guardar agora</button>'}<button class="btn" data-a="gd-rec">Recuperar do Google Drive</button><button class="btn" data-a="gd-sair">Desligar</button></div>`;
  else h += `<p class="small" style="margin:0">O caderno guarda sozinho uma cópia no seu Google Drive e junta as alterações do telemóvel e do computador. É preciso criar uma vez um «ID de cliente» na sua conta Google (gratuito, sem cartão, cerca de 10 minutos) e colá-lo aqui.</p>
      <details class="desc"><summary>Como criar o ID de cliente (uma vez)</summary><ol class="small sync-ol">
        <li>No computador, abra <b>console.cloud.google.com</b> e entre com a sua conta Gmail. Aceite os termos.</li>
        <li>No topo, <b>Selecionar projeto › Novo projeto</b>. Nome: <b>Caderno EF</b>. Criar e selecionar o projeto.</li>
        <li>Na pesquisa do topo escreva <b>Google Drive API</b> e carregue em <b>Ativar</b>.</li>
        <li>Na pesquisa escreva <b>Google Auth Platform</b> (ou «Ecrã de consentimento OAuth») e carregue em <b>Começar</b>: nome da app <b>Caderno EF</b>, o seu email; público <b>Externo</b>; aceite e crie.</li>
        <li>Em <b>Público</b> (Audience), em <b>Utilizadores de teste</b>, junte o seu próprio email Gmail.</li>
        <li>Em <b>Clientes › Criar cliente</b>: tipo <b>Aplicação Web</b>, nome <b>Caderno EF</b>. Em <b>Origens JavaScript autorizadas</b> junte <code>${esc(location.origin)}</code>; em <b>URIs de redirecionamento autorizados</b> junte <code>${esc(odRedirect())}</code>. Criar.</li>
        <li>Copie o <b>ID de cliente</b> (termina em <i>.apps.googleusercontent.com</i>), cole-o abaixo e toque em <b>Ligar ao Google Drive</b>. A Google avisa que a app não está verificada: toque em <b>Continuar</b> (a app é sua) e autorize o acesso aos ficheiros do Caderno EF.</li>
      </ol><p class="hint">Use o mesmo ID em todos os aparelhos. Se abrir o caderno noutro endereço (por exemplo, terminado em /app/), junte também esse endereço aos URIs de redirecionamento.</p></details>
      <div class="sync-url"><input type="text" id="gd-cid" data-in="gd-cid" placeholder="ID de cliente (…apps.googleusercontent.com)" value="${esc(CFG.gdCid || '')}" aria-label="ID de cliente Google"><button class="btn primary" data-a="gd-entrar">Ligar ao Google Drive</button></div>`;
  return h + '</div>';
}
{ const _vc = vCopias; vCopias = function () { return vGoogleDrive() + _vc(); }; }
Object.assign(A, {
  'gd-entrar': () => {
    // Dentro de outra página (por exemplo, a versão no Claude) a Google não deixa entrar: tem de ser no endereço próprio do caderno.
    let dentro = false; try { dentro = window.top !== window.self; } catch (e) { dentro = true; }
    if (dentro || !/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) { toast('Para ligar o Google Drive abra o caderno no seu endereço próprio (…github.io/caderno-ef/) no navegador, não dentro do Claude.', 'bad'); return; }
    const v = (($('#gd-cid') || {}).value || CFG.gdCid || '').replace(/\s+/g, '');
    if (!v) { toast('Cole primeiro o ID de cliente que copiou da consola da Google.', 'bad'); $('#gd-cid') && $('#gd-cid').focus(); return; }
    if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(v)) { toast(/GOCSPX/.test(v) ? 'Isso é a «chave secreta» do cliente: copie antes o «ID de cliente», que termina em .apps.googleusercontent.com.' : 'O ID de cliente termina em .apps.googleusercontent.com: copie-o da consola da Google.', 'bad'); return; }
    if (v !== CFG.gdCid) { CFG.gdCid = v; Store.save('cfg', CFG); } toast('A abrir a página da Google…'); gdEntrar(false); },
  'gd-agora': () => gdGuardar(true),
  'gd-rec': el => { if (!armed(el, 'Juntar a cópia do Google Drive?')) return; gdRecuperar(); },
  'gd-sair': el => { if (!armed(el, 'Desligar?')) return; GD.t = null; GD.a = false; GD.ids = {}; gdSave(); try { localStorage.removeItem('ef:gdvistos'); } catch (e) {} render(); toast('Google Drive desligado neste aparelho.'); }
});
// Arranque: volta da Google, ou renova a sessão sozinha (no máximo uma tentativa a cada 10 minutos) e junta/guarda.
(function esperar() { if (!CFG || !S || !S.cfg) { setTimeout(esperar, 300); return; }
  gdLoad(); gdRetorno();
  if (!gdOn() || /access_token=/.test(location.hash)) return;
  if (GD.t.exp < Date.now()) { const ult = +(localStorage.getItem('ef:gdtent') || 0); if (Date.now() - ult > 600000) setTimeout(() => gdEntrar(true), 2500); else GD.a = true; return; }
  setTimeout(() => { gdPuxar(); if (!GD.ultimo || Date.now() - new Date(GD.ultimo) > 12 * 3600e3) gdGuardar(); }, 4000);
})();
