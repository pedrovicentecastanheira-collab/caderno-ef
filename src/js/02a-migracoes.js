/* ---------- versão dos dados e migrações ---------- */
// Cada mudança na estrutura dos dados tem um número e um passo de conversão: cópias antigas abrem sempre bem.
const SCHEMA = 3;
const MIGRATIONS = [
  // 1 → 2: turma com ano de escolaridade; aluno com lista de lesões e dispensas.
  {v:2, run(D, touch) {
    Object.values(D.turmas || {}).forEach(t => {
      let ch = false;
      if (t.ano == null) { t.ano = guessAno(t.nome); ch = true; }
      (t.alunos || []).forEach(al => { if (!Array.isArray(al.disp)) { al.disp = []; ch = true; } });
      if (ch) touch('turmas', t);
    });
  }},
  // 2 → 3: competências oficiais dos Anexos de 2026. "Judo/Luta" passa a "Luta" (Luta e Judo são agora matérias distintas)
  // e as competências assinaladas com a numeração antiga apagam-se (os níveis atribuídos mantêm-se).
  {v:3, run(D, touch) {
    ['turmas', 'aulas', 'aval'].forEach(k => Object.keys(D[k] || {}).forEach(id => {
      const s = JSON.stringify(D[k][id]), ren = s.includes('"Judo/Luta');
      const o = ren ? (D[k][id] = JSON.parse(s.split('"Judo/Luta"').join('"Luta"'))) : D[k][id];
      let ch = ren;
      if (k === 'aval' && o.comp) {
        const t = (D.turmas || {})[o.turmaId], c = t ? t.ciclo : '3';
        Object.values(o.comp).forEach(pm => Object.keys(pm || {}).forEach(m => { if (AE26[c] && AE26[c][m]) { delete pm[m]; ch = true; } }));
      }
      if (ch) touch(k, o);
    }));
  }}
];
// Aplica as migrações em falta a um conjunto de dados (os guardados ou uma cópia importada).
function migrate(D, persist) {
  D.cfg = D.cfg || {}; const cfg = D.cfg.geral, from = (cfg && cfg.schema) || 1, touched = [];
  MIGRATIONS.filter(m => m.v > from).forEach(m => m.run(D, (k, o) => touched.push([k, o])));
  if (cfg) cfg.schema = SCHEMA;
  if (persist) { touched.forEach(([k, o]) => Store.save(k, o, true)); if (cfg && from < SCHEMA) Store.save('cfg', cfg, true); }
  return from;
}
