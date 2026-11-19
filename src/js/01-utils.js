/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => isoOf(new Date());
const fmtDate = (iso, o) => { try { return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', o || {weekday:'short', day:'numeric', month:'short'}); } catch (e) { return iso; } };
const f1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('pt-PT');
const parseNum = s => { if (s == null) return null; s = String(s).trim().replace(',', '.'); if (s === '') return null; const v = Number(s); return isNaN(v) ? null : v; };
// Idade usada em toda a app: a idade a 31 de dezembro do ano em que começa o ano letivo (a das tabelas do FITescola).
// Vem do campo "idade a 31 de dezembro" (al.i31) ou, para alunos registados com data de nascimento, é calculada a partir dela.
const anoRef = () => { const m = /(\d{4})/.exec((typeof CFG !== 'undefined' && CFG && CFG.ano) || ''); return m ? +m[1] : (typeof CFG !== 'undefined' && CFG && CFG.per && CFG.per[0] && CFG.per[0].ini ? +CFG.per[0].ini.slice(0, 4) : new Date().getFullYear()); };
function idadeDe(al) { if (!al) return null; if (al.i31 != null && al.i31 !== '' && !isNaN(+al.i31)) return +al.i31; return al.nasc ? ageAt(al.nasc, anoRef() + '-12-31') : null; }
const temIdade = al => idadeDe(al) != null;
const parseIdade = v => { const n = parseInt(String(v ?? '').trim(), 10); return n >= 3 && n <= 30 ? n : null; };
function ageAt(nasc, ref) { if (!nasc) return null; const b = new Date(nasc + 'T12:00:00'), r = new Date(ref + 'T12:00:00'); if (isNaN(b)) return null; let a = r.getFullYear() - b.getFullYear(); const m = r.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && r.getDate() < b.getDate())) a--; return a; }
function lastBackup() { try { return localStorage.getItem('ef:lastBackup'); } catch (e) { return null; } }
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function toast(msg, kind) { const t = $('#toast'); t.textContent = msg; t.className = kind || ''; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2600); }

