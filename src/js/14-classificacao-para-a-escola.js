/* ---------- classificação para a escola ---------- */
// 0–20 → nível 1–5 (2.º e 3.º ciclos) ou menção (1.º ciclo); limites editáveis em Mais.
function nivel(t, fin) {
  if (fin == null || t.ciclo === 'S') return null;
  const c = CFG.niv || [4, 10, 14, 18]; const n = fin < c[0] ? 1 : fin < c[1] ? 2 : fin < c[2] ? 3 : fin < c[3] ? 4 : 5;
  return t.ciclo === '1' ? ['Insuficiente', 'Insuficiente', 'Suficiente', 'Bom', 'Muito Bom'][n - 1] : n;
}
const nivelLbl = t => t.ciclo === '1' ? 'Menção' : 'Nível';

