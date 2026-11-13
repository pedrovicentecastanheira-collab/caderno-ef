/* ---------- boot ---------- */
(async function boot() {
  loadUI();
  await Store.init();
  if (Store.local && navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
  try { S = await Store.loadAll(); } catch (e) { S = emptyData(); toast('Não foi possível ler os dados guardados. Recarregue a página.', 'bad'); }
  if (!S.cfg.geral) S.cfg.geral = defaultCfg(); // sem versão: os dados que já existam passam por todas as migrações
  migrate(S, true);
  Object.values(S.aval).forEach(v => SHADOW[v.id] = clone(v));
  CFG = S.cfg.geral; CFG.fit = Object.assign(clone(FITREF), CFG.fit || {}); while (CFG.per.length < 3) CFG.per.push({ini:'', fim:''});
  if (!S.turmas[UI.turma]) UI.turma = Object.keys(S.turmas)[0] || null;
  if (!UI._pSet) { UI.p = periodOf(today()); }
  if (UI.p > CFG.nper) UI.p = CFG.nper;
  normTab(); if (!S.turmas[UI.turma] && UI.tab !== 'defs') UI.tab = 'inicio';
  render();
})();
