/* ---------- matérias de cada ciclo ---------- */
// Matérias de cada ciclo pelos Anexos de 2026: nucleares primeiro, depois alternativas. Os Jogos Tradicionais Populares ficam no 2.º ciclo (5.º ano).
const MATN = c => c === '2' ? [...AE26M[c].n, 'Jogos Tradicionais Populares'] : AE26M[c].n;
const MATS = {'1':PNEF['1'].map(x=>x.m), '2':[...MATN('2'), ...AE26M['2'].a], '3':[...MATN('3'), ...AE26M['3'].a], 'S':[...MATN('S'), ...AE26M['S'].a]};
const isAlt = (ciclo, m) => !!(AE26M[ciclo] && AE26M[ciclo].a.includes(m));
