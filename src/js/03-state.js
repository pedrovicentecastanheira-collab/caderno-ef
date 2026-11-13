/* ---------- state ---------- */
let S = emptyData();
let CFG = null;
const UI = {turma:null, tab:'inicio', p:1, avTab:'mat', avMode:'grelha', glay:null, gcol:null, hide:{mat:false, fit:false, con:false, av:false}, todo:false, sort:null, mat:null, fit:'vaivem', fitref:'vaivem', draft:null};
let IMP = null, FOTOS = null, DFOTO, UNDO = null;
function loadUI() { try { Object.assign(UI, JSON.parse(localStorage.getItem('ef:ui') || '{}'), {draft:null}); } catch (e) {} }
function saveUI() { try { const {draft, ...rest} = UI; localStorage.setItem('ef:ui', JSON.stringify(rest)); } catch (e) {} }

function defaultCfg() {
  return {id:'geral', ano:'2026/2027', nper:3,
    per:[{ini:'2026-09-14', fim:'2026-12-18'}, {ini:'2027-01-05', fim:'2027-03-26'}, {ini:'2027-04-12', fim:'2027-06-18'}],
    fit: clone(FITREF)};
}
function perLabel(p, long) { const s = CFG.nper === 2 ? 'semestre' : 'período'; return long ? p + '.º ' + s : p + '.º ' + (CFG.nper === 2 ? 'S' : 'P'); }
function periodOf(d) { for (let i = 0; i < CFG.nper; i++) { if (d <= CFG.per[i].fim) return i + 1; } return CFG.nper; }
function refDate(p) { const f = CFG.per[p - 1].fim, t = today(); return t < f ? t : f; }
const turma = () => S.turmas[UI.turma] || null;
const alunosOf = t => (t.alunos || []).slice().sort((a, b) => (a.num || 999) - (b.num || 999) || a.nome.localeCompare(b.nome, 'pt'));
function aulasOf(tid) { return Object.values(S.aulas).filter(a => a.turmaId === tid).sort((a, b) => a.data.localeCompare(b.data) || (a.c || 0) - (b.c || 0)); }
function avalOf(tid, p) { const id = tid + '_' + p; return S.aval[id] || {id, turmaId:tid, p, materias:[], af:{}, fit:{}, con:{}, av:{}}; }
function touchAval(v) { histRecord(v); S.aval[v.id] = v; Store.save('aval', v); }
function matsOf(t, p) {
  const set = new Set(avalOf(t.id, p).materias || []);
  aulasOf(t.id).forEach(a => { if (periodOf(a.data) === p) (a.materias || []).forEach(m => set.add(m)); });
  Object.values(avalOf(t.id, p).af || {}).forEach(o => Object.keys(o).forEach(m => set.add(m)));
  const order = MATS[t.ciclo] || GR; return [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function counts(t, p, aid) {
  const c = {P:0, F:0, A:0, M:0, D:0, n:0};
  aulasOf(t.id).forEach(a => { if (periodOf(a.data) !== p) return; const s = (a.presencas || {})[aid]; if (s) { c[s]++; c.n++; } });
  return c;
}
const idxFromCount = n => n >= 4 ? 0 : n >= 2 ? 1 : n === 1 ? 2 : 3;

function fitRef(k, sexo, age) {
  const r = CFG.fit[k] && CFG.fit[k][sexo]; if (!r || age == null || age < 10) return null;
  const i = Math.min(age, 18) - 10; const zs = r.zs[i], za = r.za[i];
  if (zs == null || zs === '') return null;
  return {zs:+zs, za:(za == null || za === '') ? null : +za};
}
function autoZone(f, al, age, val) {
  if (val == null || val === '') return null;
  if (f.bool) return val === 'S' ? 1 : val === 'N' ? 0 : null;
  const r = fitRef(f.k, al.sexo, age); if (!r) return null;
  const v = +val;
  if (f.dir > 0) { if (r.za != null && v >= r.za) return 2; return v >= r.zs ? 1 : 0; }
  if (r.za != null && v <= r.za) return 2; return v <= r.zs ? 1 : 0;
}
function hasAuto(f, al, age) { return f.bool || !!fitRef(f.k, al.sexo, age); }
function zoneOf(f, al, age, v) {
  const r = (v.fit || {})[al.id] || {};
  const a = hasAuto(f, al, age) ? autoZone(f, al, age, r[f.k]) : null;
  if (a != null) return a;
  const m = r[f.k + '_z']; return (m == null || m === '') ? null : +m;
}

function calc(t, p, al) {
  const v = avalOf(t.id, p); const R = REG[regAt(al, p)] || REG.Normal; const afOn = R.af > 0, apfOn = R.apf > 0;
  const lv = {}; new Set([...Object.keys((v.af || {})[al.id] || {}), ...Object.keys(v.ind || {})]).forEach(m => { const x = lvOf(v, al.id, m); if (x) lv[m] = x.l; });
  const ls = Object.values(lv).filter(x => x in LVP);
  const AF = ls.length ? ls.reduce((s, x) => s + LVP[x], 0) / ls.length : null;
  const age = ageAt(al.nasc, refDate(p)); let pts = 0, any = false; const zones = {};
  FIT.forEach(f => { const z = zoneOf(f, al, age, v); zones[f.k] = z; if (z != null) { any = true; pts += f.pts[z] || 0; } });
  const APF = any ? Math.max(0, Math.min(20, pts + 5)) : null;
  const cr = (v.con || {})[al.id]; const CON = (cr == null || cr === '' || isNaN(cr)) ? null : (t.escala === '1-5' ? cr * 4 : +cr);
  const c = counts(t, p, al.id); const o = (v.av || {})[al.id] || {};
  const ix = {pont: o.pont ?? idxFromCount(c.F + c.A), mat: o.mat ?? idxFromCount(c.M), resp: o.resp ?? null, emp: o.emp ?? null, lid: o.lid ?? null};
  const AV = Object.keys(AVW).every(k => ix[k] != null) ? Object.keys(AVW).reduce((s, k) => s + AVW[k] * AVS[ix[k]], 0) : null;
  let FIN = null, EST = 'Incompleto';
  if ((!afOn || AF != null) && (!apfOn || APF != null) && CON != null && AV != null) {
    const raw = (afOn ? AF * R.af : 0) + (apfOn ? APF * R.apf : 0) + CON * R.con + AV * R.av;
    const fail = (afOn && AF < 10) || (apfOn && APF < 10) || CON < 10 || AV < 10;
    FIN = fail ? Math.min(Math.round(raw), 9) : Math.round(raw); EST = fail ? 'Não apto' : 'Apto';
  }
  return {AF, APF, CON, AV, FIN, EST, zones, ix, c, lv, age, afOn, apfOn, missing: [afOn && AF == null && 'AF', apfOn && APF == null && 'Apt. Física', CON == null && 'Conhecimentos', AV == null && 'Atitudes'].filter(Boolean)};
}

