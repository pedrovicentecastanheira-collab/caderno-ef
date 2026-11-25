/* ---------- aviso: turmas cujo nome não indica o ano e que ficaram com um ano provavelmente errado ---------- */
// Versões anteriores tiravam o ano do primeiro número do nome: "A1" ou "E1" ficavam como 1.º ano (1.º ciclo).
// Se a turma está num ano do 1.º ciclo e o nome não o confirma, pede-se ao professor que confirme.
const anoDuvidoso = t => !!t && !t.anoOk && (t.alunos || []).length > 0 && +t.ano >= 1 && +t.ano <= 4 && guessAno(t.nome) == null;
{ const _al = alertsOf; alertsOf = function (t, p) { const out = _al(t, p);
  if (anoDuvidoso(t)) out.unshift({k:'warn', txt:`Confirme o ano de escolaridade: a turma ${t.nome} está como ${t.ano}.º ano (${CICLOS[t.ciclo] || ''}). Toque para corrigir.`, a:'turma-ano'});
  return out; }; }
{ const _ag = A['alert-go']; A['alert-go'] = el => { if (el.dataset.k === 'turma-ano') { A['turma-edit']({dataset:{id:UI.turma}}); return; } _ag(el); }; }
// Ao guardar a turma pelo formulário, o ano escolhido fica confirmado (o aviso desaparece mesmo que seja 1.º–4.º ano).
{ const _ts = A['turma-save']; if (_ts) A['turma-save'] = el => { const id = UI.draft && UI.draft.id; _ts(el); const t = id && S.turmas[id]; if (t && !t.anoOk) { t.anoOk = true; Store.save('turmas', t); } }; }
