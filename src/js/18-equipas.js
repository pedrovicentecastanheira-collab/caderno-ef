/* ---------- equipas ---------- */
function sheetEquipas() {
  const t = turma(), ms = matsOf(t, UI.p), aHoje = aulasOf(t.id).filter(a => a.data === today()).pop();
  UI.eq = Object.assign({n:2, crit:'rand', mix:true, pres:!!aHoje}, UI.eq || {});
  const E = UI.eq; E.res = null;
  openSheet('Equipas', `<div class="form">
    <div class="grid2"><div class="field"><label for="eq-n">Número de equipas</label><select id="eq-n" data-in="eq" data-k="n">${[2, 3, 4, 5, 6, 7, 8].map(n => `<option${E.n === n ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label for="eq-c">Critério</label><select id="eq-c" data-in="eq" data-k="crit"><option value="rand"${E.crit === 'rand' ? ' selected' : ''}>Aleatório</option><option value="fin"${E.crit === 'fin' ? ' selected' : ''}>Equilibrado pela nota final</option>${ms.map(m => `<option value="m:${esc(m)}"${E.crit === 'm:' + m ? ' selected' : ''}>Equilibrado pelo nível em ${esc(m)}</option>`).join('')}</select></div></div>
    <label class="pin"><input type="checkbox" data-in="eq" data-k="mix"${E.mix ? ' checked' : ''}> Misturar rapazes e raparigas por igual</label>
    ${aHoje ? `<label class="pin"><input type="checkbox" data-in="eq" data-k="pres"${E.pres ? ' checked' : ''}> Deixar de fora quem faltou à aula de hoje</label>` : ''}
    <div id="eq-out">${eqHtml()}</div></div>`, `<button class="btn" data-a="eq-copy">Copiar</button><button class="btn primary" data-a="eq-go">Baralhar de novo</button>`);
}
function eqMake() {
  const t = turma(), E = UI.eq, aHoje = aulasOf(t.id).filter(a => a.data === today()).pop();
  let als = alunosOf(t); if (E.pres && aHoje) als = als.filter(al => (aHoje.presencas || {})[al.id] !== 'F');
  const v = avalOf(t.id, UI.p), score = al => { if (E.crit === 'fin') { const r = calc(t, UI.p, al); return r.FIN ?? r.AF ?? 10; } if (E.crit.startsWith('m:')) { const x = lvOf(v, al.id, E.crit.slice(2)); return x ? LVP[x.l] : 11; } return 0; };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const groups = E.mix ? [als.filter(a => a.sexo === 'F'), als.filter(a => a.sexo === 'M'), als.filter(a => a.sexo !== 'F' && a.sexo !== 'M')] : [als];
  const teams = Array.from({length:E.n}, () => ({al:[], sum:0, g:[0, 0, 0]})), avg = tm => tm.al.length ? tm.sum / tm.al.length : 0;
  // Do melhor para o pior (ou baralhado), cada aluno vai para a equipa com menos alunos do seu grupo (sexo),
  // depois com menos alunos e, se equilibrado, com a soma mais baixa: equipas parecidas em número, sexo e nível.
  groups.forEach((g, gi) => { g = shuffle(g.slice()); if (E.crit !== 'rand') g.sort((a, b) => score(b) - score(a));
    g.forEach(al => { const tm = shuffle(teams.slice()).sort((x, y) => x.g[gi] - y.g[gi] || x.al.length - y.al.length || (E.crit === 'rand' ? 0 : avg(x) - avg(y)))[0]; tm.al.push(al); tm.g[gi]++; tm.sum += score(al); }); });
  // Afinação: trocar alunos do mesmo sexo entre equipas enquanto a diferença entre a melhor e a pior média diminuir.
  if (E.crit !== 'rand') {
    const gOf = al => E.mix ? (al.sexo === 'F' ? 0 : al.sexo === 'M' ? 1 : 2) : 0, spread = () => { const a = teams.map(avg); return Math.max(...a) - Math.min(...a); };
    for (let it = 0; it < 100; it++) {
      const cur = spread(); let best = null;
      teams.forEach((A, ai) => teams.forEach((B, bi) => { if (bi <= ai) return; A.al.forEach((x, i) => B.al.forEach((y, j) => {
        if (gOf(x) !== gOf(y)) return; const d = score(y) - score(x); A.al[i] = y; B.al[j] = x; A.sum += d; B.sum -= d;
        const sp = spread(); if (!best || sp < best.sp) best = {sp, A, B, i, j, d};
        A.al[i] = x; B.al[j] = y; A.sum -= d; B.sum += d; })); }));
      if (!best || best.sp >= cur - 1e-9) break;
      const {A, B, i, j, d} = best, x = A.al[i]; A.al[i] = B.al[j]; B.al[j] = x; A.sum += d; B.sum -= d;
    }
  }
  E.res = teams.map(tm => tm.al.map(al => al.id)); E.sc = E.crit !== 'rand' ? teams.map(tm => tm.al.length ? tm.sum / tm.al.length : null) : null;
}
function eqHtml() {
  const t = turma(), E = UI.eq; if (!E.res || E.res.length !== E.n) eqMake();
  const al = id => (t.alunos || []).find(x => x.id === id);
  return `<div class="eqs">${E.res.map((ids, i) => `<div class="eq"><div class="eq-h"><i style="background:var(--v${i + 1})"></i><b>Equipa ${i + 1}</b><span class="muted small">${ids.length} alunos${E.sc && E.sc[i] != null ? ' · média ' + (E.crit.startsWith('m:') ? LV.reduce((b, x) => Math.abs(LVP[x] - E.sc[i]) < Math.abs(LVP[b] - E.sc[i]) ? x : b, 'NI') : nf(E.sc[i])) : ''}</span></div>${ids.map(id => { const a = al(id); return a ? `<div class="eq-a">${avatar(a, 'sm')}<span>${esc(a.nome)}</span></div>` : ''; }).join('')}</div>`).join('')}</div>`;
}

