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
function ageAt(nasc, ref) { if (!nasc) return null; const b = new Date(nasc + 'T12:00:00'), r = new Date(ref + 'T12:00:00'); if (isNaN(b)) return null; let a = r.getFullYear() - b.getFullYear(); const m = r.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && r.getDate() < b.getDate())) a--; return a; }
function lastBackup() { try { return localStorage.getItem('ef:lastBackup'); } catch (e) { return null; } }
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function toast(msg, kind) { const t = $('#toast'); t.textContent = msg; t.className = kind || ''; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2600); }

