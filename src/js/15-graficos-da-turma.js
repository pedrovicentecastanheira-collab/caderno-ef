/* ---------- gráficos da turma (Pauta → Gráficos) ---------- */
function vGraficos(t) {
  const p = UI.p, als = alunosOf(t), rows = als.map(al => ({al, r:calc(t, p, al)})), ms = matsOf(t, p), v = avalOf(t.id, p);
  if (!als.length) return `<div class="card empty">${ART}<h3>Sem alunos</h3></div>`;
  let h = '';
  // 1. Classificações
  if (t.ciclo === 'S') {
    const bins = [['0–4', 0, 4], ['5–9', 5, 9], ['10–11', 10, 11], ['12–13', 12, 13], ['14–15', 14, 15], ['16–17', 16, 17], ['18–20', 18, 20]];
    const d = bins.map(([l, a, b]) => { const n = rows.filter(x => x.r.FIN != null && x.r.FIN >= a && x.r.FIN <= b).length; return {label:l, v:n, tip:`${l} valores: ${n} ${n === 1 ? 'aluno' : 'alunos'}`}; });
    h += fig('Classificações finais', `${rows.filter(x => x.r.FIN != null).length} de ${rows.length} alunos com classificação`, chColumns(d, {label:'Distribuição das classificações finais'}) + tableView(['Valores', 'Alunos'], d.map(x => [x.label, x.v])));
  } else {
    const ks = t.ciclo === '1' ? ['Insuficiente', 'Suficiente', 'Bom', 'Muito Bom'] : [1, 2, 3, 4, 5];
    const d = ks.map(k => { const n = rows.filter(x => nivel(t, x.r.FIN) === k).length; return {label:String(k), v:n, tip:`${nivelLbl(t)} ${k}: ${n} ${n === 1 ? 'aluno' : 'alunos'}`}; });
    h += fig(t.ciclo === '1' ? 'Menções' : 'Níveis', `${rows.filter(x => x.r.FIN != null).length} de ${rows.length} alunos com classificação`, chColumns(d, {label:'Distribuição dos níveis'}) + tableView([nivelLbl(t), 'Alunos'], d.map(x => [x.label, x.v])));
  }
  // Mapa da turma
  if (ms.length) h += fig('Mapa da turma', 'Nível de cada aluno em cada matéria', chMapa(t, p) + legend(LVB.map((b, i) => ({name:b.name, color:`var(--lv${i + 1})`}))));
  // Aprendizagens Essenciais
  const aes = als.map(al => aeOf(t, al, p));
  if (aes[0]) {
    const A = aes[0].A, keys = [{k:0, name:'Não atinge', color:'var(--st-crit)'}, {k:1, name:'Proficiente', color:'var(--q2)'}, {k:2, name:aeTop(A), color:'var(--q4)'}, {k:'n', name:'Sem dados', color:'var(--v-none)'}];
    const rs = [['Atividades físicas', 'af'], ['Aptidão física', 'apf'], ['Conhecimentos', 'con']].map(([l, k]) => { const c = {}; aes.forEach(a => { const x = a[k] == null ? 'n' : a[k]; if (x !== 'na') c[x] = (c[x] || 0) + 1; }); return {label:l, c}; });
    h += fig(`Aprendizagens Essenciais · ${aes[0].ano}.º ano`, 'Situação de cada aluno até ao ' + perLabel(p, true) + ' (DGE, março de 2026)', chStack(rs, keys, {id:'ae'}) + legend(keys) + tableView(['Domínio', ...keys.map(k => k.name)], rs.map(r => [r.label, ...keys.map(k => r.c[k.k] || 0)])));
  }
  // 2. Estado
  const st = {}; rows.forEach(x => st[x.r.EST] = (st[x.r.EST] || 0) + 1);
  h += fig('Situação da turma', perLabel(p, true), chStack([{label:'Turma', c:st}], STK, {id:'st'}) + legend(STK.map(k => ({name:k.name + ' · ' + (st[k.k] || 0), color:k.color}))));
  // Evolução da turma ao longo do ano
  const ps = CFG.per.slice(0, CFG.nper).map((_, i) => i + 1), allr = ps.map(i => als.map(al => calc(t, i, al)));
  if (allr.filter(rs => rs.some(r => r.FIN != null || r.AF != null)).length >= 2) {
    const mk = k => allr.map(rs => { const xs = rs.map(r => r[k]).filter(x => x != null); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; });
    const ser = [{name:'Final', color:'var(--v1)', vals:mk('FIN')}, {name:'Matérias', color:'var(--v2)', vals:mk('AF')}, {name:'Apt. física', color:'var(--v3)', vals:mk('APF')}, {name:'Atitudes', color:'var(--v7)', vals:mk('AV')}];
    h += fig('Evolução da turma', 'Médias por período, escala 0–20', chLine(ps.map(i => perLabel(i)), ser, {label:'Evolução das médias da turma'}) + legend(ser));
    const pct = f => allr.map(rs => { const xs = rs.filter(f(true)); return xs.length ? Math.round(rs.filter(f(false)).length / xs.length * 100) : null; });
    const s2 = [{name:'Aptos', color:'var(--st-good)', vals:pct(all => r => all ? r.FIN != null : r.EST === 'Apto')}, {name:'Vaivém na ZS', color:'var(--v1)', vals:pct(all => r => all ? r.zones.vaivem != null : r.zones.vaivem >= 1)}];
    h += fig('Aptos e aptidão aeróbia', 'Percentagem dos alunos com dados, por período', chLine(ps.map(i => perLabel(i)), s2, {max:100, ref:50, label:'Percentagem de aptos e de alunos na Zona Saudável do vaivém'}) + legend(s2));
  }
  // 3. Médias por domínio
  const mean = k => { const xs = rows.map(x => x.r[k]).filter(x => x != null); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; };
  const dm = [['Matérias (AF)', 'AF'], ['Aptidão física', 'APF'], ['Conhecimentos', 'CON'], ['Atitudes', 'AV'], ['Final', 'FIN']].map(([l, k]) => ({label:l, v:mean(k)}));
  h += fig('Médias da turma por domínio', 'Escala 0–20; a linha marca os 10', chBars(dm, {label:'Médias por domínio'}) + tableView(['Domínio', 'Média'], dm.map(x => [x.label, x.v == null ? '—' : nf(x.v)])));
  // 4. Níveis por matéria
  if (ms.length) {
    const keys = LVB.map((b, i) => ({k:b.k, name:b.name, color:`var(--lv${i + 1})`}));
    const rs = ms.map(m => { const c = {}; rows.forEach(({al}) => { const l = (lvOf(v, al.id, m) || {}).l; const b = LVB.find(x => x.ls.includes(l)); if (b) c[b.k] = (c[b.k] || 0) + 1; }); return {label:m.replace(/\s*\(.*\)$/, ''), c}; });
    h += fig('Níveis por matéria', 'Quantos alunos em cada patamar', chStack(rs, keys, {id:'lv'}) + legend(keys) + tableView(['Matéria', ...LVB.map(b => b.name)], rs.map(r => [r.label, ...LVB.map(b => r.c[b.k] || 0)])));
  }
  // 5. FITescola
  const fr = FIT.map(f => { const c = {}; rows.forEach(({r}) => { const z = r.zones[f.k]; if (z != null) c[z] = (c[z] || 0) + 1; }); return {label:f.n, c}; }).filter(r => Object.keys(r.c).length);
  if (fr.length) h += fig('Aptidão física (FITescola)', 'Zona de cada aluno por teste', chStack(fr, ZNK, {id:'fz'}) + legend(ZNK) + tableView(['Teste', ...ZNK.map(z => z.name)], fr.map(r => [r.label, ...ZNK.map(z => r.c[z.k] || 0)])));
  // 6. Assiduidade por aula
  const aul = aulasOf(t.id).map((a, i) => ({a, n:i + 1})).filter(x => periodOf(x.a.data) === p);
  if (aul.length) {
    const d = aul.map(({a, n}) => { const ps = Object.values(a.presencas || {}), tot = ps.length, pr = ps.filter(s => s !== 'F').length; return {label:'L' + n, v:tot ? Math.round(pr / tot * 100) : 0, tip:`Lição ${n} (${fmtDate(a.data)}): ${pr}/${tot} presentes`}; });
    h += fig('Assiduidade por aula', 'Percentagem de alunos presentes', chColumns(d, {max:100, unit:'%', label:'Assiduidade por aula'}) + tableView(['Lição', '% presentes'], d.map(x => [x.label, x.v + ' %'])));
  }
  return h;
}

