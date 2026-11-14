/* ---------- storage ---------- */
// Três modos: 'cloud' (conta Claude, sincroniza entre aparelhos), 'idb' (IndexedDB neste aparelho, centenas de MB)
// e 'local' (localStorage, só se o IndexedDB não existir). Na primeira abertura com IndexedDB, os dados do localStorage passam para lá.
const KINDS = ['cfg', 'turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist'];
const emptyData = () => Object.fromEntries(KINDS.map(k => [k, {}]));
const LSKEY = new RegExp('^ef:(' + KINDS.join('|') + '):(.+)$');
const idbReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const Store = {
  mode: 'memory', db: null, idb: null, uid: null, q: {}, t: {}, pend: {},
  async init() {
    if (window.claude && typeof window.claude.use === 'function') {
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (db && user) { const id = await user.id(); if (id) { this.db = db; this.uid = id; this.mode = 'cloud'; return; } }
      } catch (e) {}
    }
    try {
      if (!window.indexedDB) throw new Error('sem IndexedDB');
      const r = indexedDB.open('caderno-ef', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv');
      this.idb = await idbReq(r); this.mode = 'idb'; await this.migrateLocal(); return;
    } catch (e) {}
    try { localStorage.setItem('ef:probe', '1'); localStorage.removeItem('ef:probe'); this.mode = 'local'; } catch (e) { this.mode = 'memory'; }
  },
  tx(rw) { return this.idb.transaction('kv', rw ? 'readwrite' : 'readonly').objectStore('kv'); },
  // Copia ef:<tipo>:<id> do localStorage para o IndexedDB e só depois os apaga.
  async migrateLocal() {
    const keys = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (LSKEY.test(k || '')) keys.push(k); } } catch (e) { return; }
    if (!keys.length) return;
    const st = this.tx(true); keys.forEach(k => { try { st.put(JSON.parse(localStorage.getItem(k)), k.slice(3)); } catch (e) {} });
    await new Promise((res, rej) => { st.transaction.oncomplete = res; st.transaction.onerror = () => rej(st.transaction.error); });
    keys.forEach(k => localStorage.removeItem(k));
  },
  col(k) { return this.db.doc('data/users/' + this.uid + '/app').collection(k); },
  async loadAll() {
    const out = emptyData();
    if (this.mode === 'cloud') {
      // Cada leitura devolve no máximo 1000 documentos: lê por páginas (pela ordem do id) até ao fim.
      for (const k of KINDS) {
        let last = null;
        for (let pg = 0; pg < 50; pg++) {
          const q = last == null ? this.col(k) : this.col(k).where('id', '>', last), snap = await q.limit(1000).get();
          snap.docs.forEach(d => { if (d.exists) { out[k][d.id] = clone(d.data()); last = d.id; } });
          if (snap.docs.length < 1000) break;
        }
      }
    } else if (this.mode === 'idb') {
      const st = this.tx(), [keys, vals] = await Promise.all([idbReq(st.getAllKeys()), idbReq(st.getAll())]);
      keys.forEach((key, i) => { const j = key.indexOf(':'), k = key.slice(0, j); if (out[k]) out[k][key.slice(j + 1)] = vals[i]; });
    } else if (this.mode === 'local') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); const m = LSKEY.exec(key || '');
        if (m) { try { out[m[1]][m[2]] = JSON.parse(localStorage.getItem(key)); } catch (e) {} }
      }
    }
    return out;
  },
  save(k, obj, keepStamp) {
    if (k === 'aulas') AULAS_V++;
    if (!keepStamp) obj._u = Date.now();
    const key = k + ':' + obj.id; clearTimeout(this.t[key]);
    const run = () => { delete this.pend[key]; return this._write(k, obj.id, () => clone(obj)); };
    this.pend[key] = run; this.t[key] = setTimeout(run, 450);
  },
  del(k, id) { if (k === 'aulas') AULAS_V++; const key = k + ':' + id; clearTimeout(this.t[key]); delete this.pend[key]; return this._write(k, id, null); },
  flush() { Object.keys(this.pend).forEach(key => { clearTimeout(this.t[key]); const fn = this.pend[key]; fn && fn(); }); },
  get local() { return this.mode === 'idb' || this.mode === 'local'; },
  _write(k, id, get) {
    const key = k + ':' + id; const prev = this.q[key] || Promise.resolve();
    const p = prev.then(async () => {
      const body = get ? get() : null;
      if (this.mode === 'cloud') {
        const ref = this.col(k).doc(id);
        const go = () => body ? ref.set(body) : ref.delete();
        try { await go(); } catch (e) { if (e && e.code === 'unavailable') { await sleep(500 + Math.random() * 700); await go(); } else throw e; }
      } else if (this.mode === 'idb') {
        await idbReq(body ? this.tx(true).put(body, key) : this.tx(true).delete(key));
      } else if (this.mode === 'local') {
        if (body) localStorage.setItem('ef:' + key, JSON.stringify(body)); else localStorage.removeItem('ef:' + key);
      }
    }).catch(e => { const c = e && (e.code || e.name);
      toast(c === 'invalid_argument' ? 'Não foi possível guardar: este registo ficou demasiado grande para a conta (limite de 256 KB). Faça uma cópia de segurança e fale com o suporte do Caderno EF.'
        : c === 'quota_exceeded' || c === 'QuotaExceededError' ? 'Não foi possível guardar: o espaço disponível está cheio. Faça uma cópia de segurança e apague dados antigos (turmas de anos anteriores).'
        : c === 'resource_exhausted' ? 'Muitas gravações seguidas: aguarde uns segundos, o caderno volta a tentar.' : 'Não foi possível guardar. Verifique a ligação e tente de novo.', 'bad'); });
    this.q[key] = p; return p;
  }
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Store.flush(); });
