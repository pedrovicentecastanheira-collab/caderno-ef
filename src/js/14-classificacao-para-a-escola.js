/* ---------- classificação para a escola ---------- */
// 0–20 → nível 1–5 (2.º e 3.º ciclos) ou menção (1.º ciclo); limites editáveis em Mais.
// Intervalos exclusivos da conversão 0–20 → nível 1–5 (a classificação final é um número inteiro): 0–3, 4–9, 10–13, 14–17, 18–20.
function nivelFaixas() { const c = (CFG.niv || [4, 10, 14, 18]).map(x => Math.ceil(+x)), lim = [0, ...c, 21]; return lim.slice(0, 5).map((a, i) => { const b = lim[i + 1] - 1; return a >= b ? String(a) : `${a}–${b}`; }); }
function nivel(t, fin) {
  if (fin == null || t.ciclo === 'S') return null;
  const c = CFG.niv || [4, 10, 14, 18]; const n = fin < c[0] ? 1 : fin < c[1] ? 2 : fin < c[2] ? 3 : fin < c[3] ? 4 : 5;
  return t.ciclo === '1' ? ['Insuficiente', 'Insuficiente', 'Suficiente', 'Bom', 'Muito Bom'][n - 1] : n;
}
const nivelLbl = t => t.ciclo === '1' ? 'Menção' : 'Nível';

