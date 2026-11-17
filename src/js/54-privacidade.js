/* ---------- privacidade e segurança dos dados dos alunos ---------- */
// 1) código de acesso (LOCK) com bloqueio automático; 2) cópias cifradas (AES-GCM, chave derivada da palavra-passe
// do professor; sem ela ninguém as lê, nem a Microsoft); 3) arquivar uma turma num ficheiro e retirá-la do caderno;
// 4) exportação sem nomes para o grupo de EF; 5) informação de privacidade.
const te = new TextEncoder(), tdec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function derivar(pass, salt, uso) {
  const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  return uso === 'bits' ? crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, base, 256)
    : crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
}

/* 1. código de acesso */
const LOCK = {cfg:null, bloq:false, saiu:0, erros:0, ate:0};
function pinCfg() { try { return JSON.parse(localStorage.getItem('ef:pin') || 'null'); } catch (e) { return null; } }
async function pinHash(pin, salt) { return b64(await derivar(pin, salt, 'bits')); }
function bloquear() {
  if (!pinCfg() || LOCK.bloq) return; LOCK.bloq = true; LOCK.dig = ''; document.body.classList.add('bloq');
  let el = $('#lock'); if (!el) { el = document.createElement('div'); el.id = 'lock'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  lockRender();
}
function lockRender() {
  const el = $('#lock'), espera = LOCK.ate > Date.now() ? Math.ceil((LOCK.ate - Date.now()) / 1000) : 0;
  el.innerHTML = `<div class="lk">${typeof LOGO === 'string' ? LOGO : ''}<h1>Caderno EF</h1><p class="small muted">${espera ? `Demasiadas tentativas: aguarde ${espera} s.` : 'Introduza o código de acesso'}</p>
    <div class="lk-dots">${[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, (pinCfg() || {}).n || 4)).map(i => `<i class="${i < (LOCK.dig || '').length ? 'on' : ''}"></i>`).join('')}</div>
    <div class="lk-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(x => x === '' ? '<span></span>' : `<button data-a="lk-d" data-v="${x}"${espera ? ' disabled' : ''}>${x}</button>`).join('')}</div>
    <button class="link" data-a="lk-esq">Esqueci-me do código</button></div>`;
  el.hidden = false;
}
async function pinTentar() {
  const c = pinCfg(); if (!c) return desbloquear();
  if (LOCK.dig.length < c.n) return;
  if (await pinHash(LOCK.dig, unb64(c.salt)) === c.hash) { LOCK.erros = 0; desbloquear(); return; }
  LOCK.erros++; LOCK.dig = ''; if (LOCK.erros >= 5) { LOCK.ate = Date.now() + 30000 * Math.pow(2, LOCK.erros - 5); setTimeout(lockRender, 30500); }
  lockRender(); const el = $('#lock .lk-dots'); if (el) { el.classList.add('erro'); setTimeout(() => el.classList.remove('erro'), 400); }
}
function desbloquear() { LOCK.bloq = false; document.body.classList.remove('bloq'); const el = $('#lock'); if (el) { el.hidden = true; el.innerHTML = ''; } if (CFG) render(); }
document.addEventListener('visibilitychange', () => {
  const c = pinCfg(); if (!c) return;
  if (document.visibilityState === 'hidden') LOCK.saiu = Date.now();
  else if (LOCK.saiu && Date.now() - LOCK.saiu > (c.min ?? 5) * 60000) bloquear();
});
if (pinCfg()) bloquear();   // ao abrir, antes de mostrar os dados

/* 2. cópias cifradas */
const CIF = {key:null, salt:null};
async function cifraChave() {
  if (CIF.key) return CIF.key; const c = (CFG && CFG.cifra) || null; if (!c) return null;
  try { const k = Store.mode === 'idb' ? await idbReq(Store.tx().get('sec:key')) : null; if (k && k.salt === c.salt) { CIF.key = k.key; CIF.salt = c.salt; } } catch (e) {}
  return CIF.key;
}
async function cifraDefinir(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), key = await derivar(pass, salt), s = b64(salt);
  const ver = await crypto.subtle.encrypt({name:'AES-GCM', iv:new Uint8Array(12)}, key, te.encode('caderno-ef'));
  CFG.cifra = {salt:s, ver:b64(ver)}; Store.save('cfg', CFG); CIF.key = key; CIF.salt = s;
  if (Store.mode === 'idb') await idbReq(Store.tx(true).put({salt:s, key}, 'sec:key'));
}
async function copiaCifrar(txt) {
  if (!(CFG && CFG.cifra && CFG.cifraOn)) return txt; const key = await cifraChave(); if (!key) { toast('Cópias cifradas: indique a palavra-passe em Definições › Privacidade.', 'bad'); throw new Error('sem chave'); }
  const iv = crypto.getRandomValues(new Uint8Array(12)), ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, te.encode(txt));
  return JSON.stringify({app:'Caderno EF', enc:1, salt:CIF.salt, iv:b64(iv), ct:b64(ct)});
}
async function copiaDecifrar(txt) {
  let o; try { o = JSON.parse(txt); } catch (e) { return txt; } if (!o || o.enc !== 1) return txt;
  let key = (CIF.salt === o.salt) ? await cifraChave() : null;
  if (!key) { const pass = await pedirPass('Esta cópia está cifrada. Escreva a palavra-passe das cópias.'); if (!pass) throw new Error('cancelado'); key = await derivar(pass, unb64(o.salt)); }
  try { return tdec.decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(o.iv)}, key, unb64(o.ct))); }
  catch (e) { toast('Palavra-passe errada: não foi possível abrir a cópia.', 'bad'); throw e; }
}
function pedirPass(msg) {
  return new Promise(res => { LOCK.res = res;
    openSheet('Palavra-passe das cópias', `<div class="form"><p>${esc(msg)}</p><input type="password" id="pp-pass" autocomplete="current-password" aria-label="Palavra-passe"></div>`, `<button class="btn primary" data-a="pp-ok">Abrir</button>`);
    setTimeout(() => { const i = $('#pp-pass'); if (i) i.focus(); }, 50); });
}
// As cópias que saem do aparelho passam pela cifra (se ativa): OneDrive, ficheiro ligado, enviar e cópia de segurança.
const _odEnv2 = odEnviar;
odEnviar = async function (nome, txt) { return _odEnv2(nome, await copiaCifrar(txt)); };
syncEscrever = async function () { if (!SYNC.h || !SYNC.ok) return; try { const w = await SYNC.h.createWritable(); await w.write(await copiaCifrar(JSON.stringify(syncData()))); await w.close(); syncAgora(); } catch (e) { SYNC.ok = false; toast('Não foi possível gravar o ficheiro de sincronização. Volte a ligá-lo em Definições › Sincronizar.', 'bad'); } };
syncLer = async function () { try { const f = await SYNC.h.getFile(); if (!f.size) return 0; const d = JSON.parse(await copiaDecifrar(await f.text())); return d && d.app === 'Caderno EF' ? syncMerge(d) : 0; } catch (e) { return 0; } };
syncReceber = async function (file) {
  let d; try { d = JSON.parse(await copiaDecifrar(await file.text())); } catch (e) { if (e && e.message !== 'cancelado') toast('Este ficheiro não é uma cópia do Caderno EF (ou a palavra-passe está errada).', 'bad'); return; }
  if (!d || d.app !== 'Caderno EF') { toast('Este ficheiro não é uma cópia do Caderno EF.', 'bad'); return; }
  const n = syncMerge(d); syncAgora(); render(); toast(n ? `Sincronizado: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.` : 'Já estava tudo igual.');
};
odRecuperar = async function () {
  try { const x = await odApi('GET', 'drive/special/approot:/caderno-ef.json:/content'), d = JSON.parse(await copiaDecifrar(typeof x === 'string' ? x : JSON.stringify(x)));
    if (!d || d.app !== 'Caderno EF') throw new Error('ficheiro'); const n = syncMerge(d); render(); toast(n ? `Recuperado do OneDrive: ${n} ${n === 1 ? 'registo atualizado' : 'registos atualizados'}.` : 'Este aparelho já tinha tudo o que está no OneDrive.'); }
  catch (e) { if (!e || e.message !== 'cancelado') toast(OD.a ? 'Ligação expirada: volte a ligar o OneDrive.' : 'Não foi possível ler a cópia do OneDrive.', 'bad'); }
};
A['sync-env'] = async () => { try { saveFile('caderno-ef-sincronizar-' + today() + '.json', new Blob([await copiaCifrar(JSON.stringify(syncData()))], {type:'application/json'})); syncAgora(); render(); } catch (e) {} };
A.backup = async () => { Store.flush(); try { const data = {app:'Caderno EF', versao:1, exportado:new Date().toISOString(), cfg:S.cfg, turmas:S.turmas, aulas:S.aulas, aval:S.aval, fotos:S.fotos, docs:S.docs, hist:S.hist};
  saveFile('caderno-ef-copia-' + today() + '.json', new Blob([await copiaCifrar(JSON.stringify(data, null, 1))], {type:'application/json'})); try { localStorage.setItem('ef:lastBackup', today()); } catch (e) {} } catch (e) {} };

/* 3. arquivar uma turma: ficheiro com tudo o que lhe pertence, depois sai do caderno */
function turmaPacote(t) {
  const aids = new Set((t.alunos || []).map(a => a.id)), docs = new Set((t.alunos || []).flatMap(a => (a.disp || []).map(d => d.doc)).filter(Boolean)), pick = (o, f) => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => f(k, v)));
  return {app:'Caderno EF', versao:1, arquivo:true, exportado:new Date().toISOString(), cfg:{}, turmas:{[t.id]:t}, aulas:pick(S.aulas, (k, a) => a.turmaId === t.id), aval:pick(S.aval, (k, v) => v.turmaId === t.id),
    fotos:pick(S.fotos, k => aids.has(k)), docs:pick(S.docs, k => docs.has(k)), hist:pick(S.hist, k => k === t.id)};
}
async function arquivar(t) {
  const P = turmaPacote(t), txt = await copiaCifrar(JSON.stringify(P)), nome = 'arquivo-' + norm(t.nome).replace(/[^a-z0-9]+/g, '-') + '-' + (CFG.ano || today().slice(0, 4)).replace('/', '-') + '.json';
  await saveFile(nome, new Blob([txt], {type:'application/json'}));
  if (typeof odOn === 'function' && odOn()) { try { await _odEnv2(nome, txt); } catch (e) {} }
  for (const k of ['aulas', 'aval', 'fotos', 'docs', 'hist']) for (const id of Object.keys(P[k])) { delete S[k][id]; Store.del(k, id); }
  delete S.turmas[t.id]; Store.del('turmas', t.id); UI.turma = Object.keys(S.turmas)[0] || null; render();
  toast(`${t.nome} arquivada no ficheiro ${nome}${typeof odOn === 'function' && odOn() ? ' e no OneDrive' : ''}. Para a repor, use "Receber de outro aparelho" com esse ficheiro.`);
}
// Repor um arquivo: as eliminações registadas não impedem a reposição.
const _syncMerge3 = syncMerge;
syncMerge = function (d) { if (d && d.arquivo && typeof FS !== 'undefined') ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'].forEach(k => Object.keys(d[k] || {}).forEach(id => { delete FS.tomb[fsKey(k, id)]; })); return _syncMerge3(d); };

/* 4. exportação sem nomes (para o grupo de EF): código, sexo, idade, níveis, zonas e classificação */
function csvAnonimo(p) {
  const L = [['Turma', 'Código', 'Sexo', 'Idade', 'Matéria', 'Nível', 'Aptidão física (0-20)', 'Vaivém', 'Conhecimentos', 'Atitudes', 'Final', 'Situação'].join(';')];
  Object.values(S.turmas).sort(byNome).forEach(t => alunosOf(t).forEach((al, i) => { const r = calc(t, p, al), cod = 'A' + String(i + 1).padStart(2, '0'), ms = Object.keys(r.lv).length ? Object.entries(r.lv) : [['', '']];
    ms.forEach(([m, l]) => L.push([t.nome, cod, al.sexo || '', r.age ?? '', m, l, r.APF == null ? '' : f1(r.APF), r.zones.vaivem == null ? '' : ZN[r.zones.vaivem], r.CON == null ? '' : f1(r.CON), r.AV == null ? '' : f1(r.AV), r.FIN ?? '', r.EST].map(x => /[;"\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(';'))); }));
  return '﻿' + L.join('\r\n');
}

function vPrivacidade() {
  const c = pinCfg(), cf = CFG.cifra, ts = Object.values(S.turmas).sort(byNome);
  return `<div class="sec-h"><h2>Código de acesso</h2></div><div class="card form">
    <p class="small" style="margin:0">${c ? `<b class="ok-t">Ativo</b> neste aparelho · bloqueia ${c.min === 0 ? 'sempre que sai da app' : 'ao fim de ' + c.min + ' minutos fora da app'}.` : 'Peça um código (4 a 6 algarismos) para abrir o caderno neste aparelho. Os dados dos alunos ficam protegidos se perder o telemóvel ou o emprestar.'}</p>
    ${c ? `<div class="field"><label for="pin-min">Bloquear</label><select id="pin-min" data-in="pin-min">${[[0, 'Sempre que sai da app'], [1, 'Após 1 minuto fora'], [5, 'Após 5 minutos fora'], [15, 'Após 15 minutos fora']].map(([v, n]) => `<option value="${v}"${(c.min ?? 5) === v ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="btn-row"><button class="btn" data-a="pin-novo">Mudar o código</button><button class="btn ghost" data-a="pin-tirar">Retirar o código</button><button class="btn" data-a="pin-bloq">Bloquear agora</button></div>`
      : `<button class="btn primary" data-a="pin-novo">Definir código de acesso</button>`}</div>
    <div class="sec-h"><h2>Cópias cifradas</h2></div><div class="card form">
    <p class="small" style="margin:0">Com a cifra ativa, as cópias que saem deste aparelho (OneDrive, ficheiro ligado, enviar, cópia de segurança, arquivos) ficam ilegíveis sem a sua palavra-passe, mesmo para a Microsoft. <b>Se esquecer a palavra-passe, as cópias cifradas não podem ser abertas.</b> Use a mesma palavra-passe em todos os aparelhos.</p>
    ${cf && !CIF.key ? '<p class="note warn" style="margin:0">A cifra foi ativada noutro aparelho. Introduza aqui a mesma palavra-passe para este aparelho poder fazer e abrir as cópias.</p><button class="btn primary" data-a="cif-entrar">Introduzir a palavra-passe</button>' : cf ? `<label class="cli"><input type="checkbox" data-in="cif-on"${CFG.cifraOn ? ' checked' : ''}> <span>Cifrar as cópias</span></label><button class="btn sm ghost" data-a="cif-def">Mudar a palavra-passe</button>` : '<button class="btn primary" data-a="cif-def">Definir a palavra-passe das cópias</button>'}</div>
    <div class="sec-h"><h2>Arquivar uma turma</h2></div><div class="card form"><p class="small" style="margin:0">No fim do ano, guarde num ficheiro tudo o que pertence a uma turma (alunos, aulas, avaliações, fotografias, atestados) e retire-a do caderno. Pode repô-la com "Receber de outro aparelho". O ficheiro fica cifrado se a cifra estiver ativa.</p>
      ${ts.length ? `<div class="sync-url"><select id="arq-t" aria-label="Turma a arquivar">${ts.map(t => `<option value="${esc(t.id)}">${esc(t.nome)}</option>`).join('')}</select><button class="btn" data-a="arq-go">Arquivar e retirar</button></div>` : '<p class="hint">Sem turmas.</p>'}</div>
    <div class="sec-h"><h2>Partilhar resultados sem nomes</h2></div><div class="card form"><p class="small" style="margin:0">Tabela (CSV, abre no Excel) com os resultados de todas as turmas, com códigos em vez de nomes: turma, sexo, idade, níveis, aptidão física e classificação. Para o grupo de EF ou para estudos, sem dados pessoais identificáveis.</p><button class="btn" data-a="anon-csv">Exportar resultados sem nomes (${esc(perLabel(UI.p, true))})</button></div>
    <div class="sec-h"><h2>Onde estão os dados</h2></div><div class="card"><ul class="small priv">
      <li><b>Neste aparelho</b>: ${Store.mode === 'cloud' ? 'na versão da conta Claude, os dados ficam na sua área privada da conta (só o professor os vê).' : 'no armazenamento do navegador (IndexedDB). Não vão para nenhum servidor do Caderno EF: não existe servidor.'}</li>
      <li><b>Cópias</b>: só onde as enviar (OneDrive da sua conta Microsoft, ficheiros que guardar ou partilhar). Com a cifra ativa, ilegíveis sem a sua palavra-passe.</li>
      <li><b>Que dados</b>: nomes, número, sexo, data de nascimento e n.º de processo dos alunos; presenças, avaliações, aptidão física, observações, medidas de suporte, lesões e atestados que registar; fotografias, se as juntar.</li>
      <li><b>Quem vê</b>: só o professor. O modo aluno mostra a cada aluno apenas a sua própria informação.</li>
      <li><b>Quanto tempo</b>: até arquivar ou apagar. Recomenda-se arquivar as turmas no fim do ano letivo e apagar os arquivos quando já não forem necessários (regras da escola e RGPD).</li></ul></div>`;
}
Object.assign(A, {
  'lk-d': el => { const v = el.dataset.v; if (v === '⌫') LOCK.dig = (LOCK.dig || '').slice(0, -1); else if ((LOCK.dig || '').length < 6) LOCK.dig = (LOCK.dig || '') + v; lockRender(); pinTentar(); },
  'lk-esq': el => { if (!armed(el, 'Apagar os dados deste aparelho?')) return;
    openSheet('Esqueceu-se do código?', `<div class="form"><p>Por segurança, o código não pode ser recuperado. Pode <b>apagar os dados deste aparelho</b> e depois repô-los a partir de uma cópia (OneDrive, ficheiro de sincronização ou cópia de segurança).</p><p class="note warn">Só faça isto se tiver uma cópia recente. O que não estiver numa cópia perde-se.</p></div>`, `<button class="btn danger" data-a="lk-apagar">Apagar os dados deste aparelho</button>`);
    $('#sheet').style.zIndex = 90; },
  'lk-apagar': async el => { if (!armed(el, 'Toque de novo para apagar tudo')) return; try { localStorage.clear(); if (window.indexedDB) indexedDB.deleteDatabase('caderno-ef'); } catch (e) {} location.reload(); },
  'pin-novo': () => openSheet('Código de acesso', `<div class="form"><div class="field"><label for="pin-a">Novo código (4 a 6 algarismos)</label><input id="pin-a" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password"></div><div class="field"><label for="pin-b">Repita o código</label><input id="pin-b" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password"></div><p class="hint">O código fica só neste aparelho. Se o esquecer, terá de apagar os dados deste aparelho e repô-los de uma cópia.</p></div>`, `<button class="btn primary" data-a="pin-guardar">Guardar</button>`),
  'pin-guardar': async () => { const a = $('#pin-a').value, b = $('#pin-b').value; if (!/^\d{4,6}$/.test(a)) { toast('O código tem de ter 4 a 6 algarismos.', 'bad'); return; } if (a !== b) { toast('Os códigos não coincidem.', 'bad'); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)), old = pinCfg(); localStorage.setItem('ef:pin', JSON.stringify({salt:b64(salt), hash:await pinHash(a, salt), n:a.length, min:old ? old.min : 5})); closeSheet(); render(); toast('Código de acesso definido.'); },
  'pin-tirar': el => { if (!armed(el, 'Retirar o código?')) return; localStorage.removeItem('ef:pin'); render(); toast('Código retirado.'); },
  'pin-bloq': () => bloquear(),
  'cif-def': () => openSheet('Palavra-passe das cópias', `<div class="form"><div class="field"><label for="cif-a">Palavra-passe (8 ou mais caracteres)</label><input id="cif-a" type="password" autocomplete="new-password"></div><div class="field"><label for="cif-b">Repita a palavra-passe</label><input id="cif-b" type="password" autocomplete="new-password"></div><p class="note warn">Guarde-a num sítio seguro: sem ela, as cópias cifradas não podem ser abertas, nem por si nem por ninguém.</p></div>`, `<button class="btn primary" data-a="cif-guardar">Guardar e ativar</button>`),
  'cif-guardar': async () => { const a = $('#cif-a').value, b = $('#cif-b').value; if (a.length < 8) { toast('Use pelo menos 8 caracteres.', 'bad'); return; } if (a !== b) { toast('As palavras-passe não coincidem.', 'bad'); return; }
    await cifraDefinir(a); CFG.cifraOn = true; Store.save('cfg', CFG); closeSheet(); render(); toast('Cópias cifradas ativadas.'); },
  'cif-entrar': async () => { const pass = await pedirPass('Escreva a palavra-passe das cópias definida no outro aparelho.'); if (!pass) return; const c = CFG.cifra;
    try { const key = await derivar(pass, unb64(c.salt)); await crypto.subtle.decrypt({name:'AES-GCM', iv:new Uint8Array(12)}, key, unb64(c.ver)); CIF.key = key; CIF.salt = c.salt;
      if (Store.mode === 'idb') await idbReq(Store.tx(true).put({salt:c.salt, key}, 'sec:key')); render(); toast('Palavra-passe confirmada neste aparelho.'); } catch (e) { toast('Palavra-passe errada.', 'bad'); } },
  'pp-ok': () => { const v = $('#pp-pass').value, r = LOCK.res; LOCK.res = null; closeSheet(); if (r) r(v); },
  'arq-go': el => { const t = S.turmas[$('#arq-t').value]; if (!t || !armed(el, 'Arquivar ' + t.nome + '?')) return; arquivar(t); },
  'anon-csv': () => saveFile('resultados-sem-nomes-' + perLabel(UI.p).replace(/\W+/g, '') + '-' + today() + '.csv', new Blob([csvAnonimo(UI.p)], {type:'text/csv;charset=utf-8'}))
});
const _shClose = A['sh-close']; A['sh-close'] = el => { if (LOCK.res) { const r = LOCK.res; LOCK.res = null; r(null); } $('#sheet').style.zIndex = ''; return _shClose(el); };
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'pin-min') { const c = pinCfg(); if (c) { c.min = +el.value; localStorage.setItem('ef:pin', JSON.stringify(c)); } }
  else if (k === 'cif-on') { CFG.cifraOn = el.checked; Store.save('cfg', CFG); render(); } });

(function esperar() { if (!CFG) { setTimeout(esperar, 300); return; } cifraChave(); })();
