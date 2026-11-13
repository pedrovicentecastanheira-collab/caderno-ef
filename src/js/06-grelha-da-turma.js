/* ---------- grelha da turma: uma tabela, toque na célula, valores na barra de baixo ---------- */
const GN = {mat:'Matérias', fit:'FITescola', con:'Conhecimentos', av:'Atitudes'};
const GLV = {NI:'g0', PI:'g1', I:'g1', PE:'g2', E:'g2', PA:'g3', A:'g3'};
const GAV = ['g0', 'g1', 'g2', 'g3'];
const FITL = {vaivem:'Vaivém', ombros:'Ombros', senta:'Senta e alc.', abd:'Abdom.', flex:'Flexões', vel:'Veloc. 40 m', agil:'Agilid.', imp:'Impulsão'};
const AVL = {pont:'Pont.', mat:'Mat.', resp:'Resp.', emp:'Emp.', lid:'Lid.'};
let SEL = null, PIN = null, FOCUS = null, ORDER = [], COLS = [];

// Nível de uma matéria: o escolhido à mão ou, se houver indicadores avaliados, a média deles.
function lvOf(v, aid, m) {
  const man = ((v.af || {})[aid] || {})[m]; if (man) return {l:man};
  const iv = (v.iv || {})[aid] || {}, ls = ((v.ind || {})[m] || []).map(i => iv[i.id]).filter(x => x in LVP);
  if (!ls.length) return null;
  const avg = ls.reduce((s, x) => s + LVP[x], 0) / ls.length;
  return {l: LV.reduce((b, x) => Math.abs(LVP[x] - avg) < Math.abs(LVP[b] - avg) ? x : b, LV[0]), auto:true};
}
// O que o aluno domina e o que lhe falta, a partir dos descritivos PNEF do nível.
