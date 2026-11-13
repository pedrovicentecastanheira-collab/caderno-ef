/* ---------- files ---------- */
async function saveFile(name, blob) {
  let dl = null;
  try { dl = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null; } catch (e) {}
  if (dl) {
    try { const r = await dl.save({filename: name, data: blob}); if (r && r.status === 'saved') toast('Ficheiro guardado.'); return; }
    catch (e) { if (!e || e.code !== 'unavailable') { if (e && e.code !== 'declined') toast('O ficheiro não foi guardado.', 'bad'); return; } }
  }
  try {
    const file = new File([blob], name, {type: blob.type || 'application/octet-stream'});
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: name}); toast('Ficheiro pronto.'); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function exportXlsx() {
  const t = turma(); if (!t) return;
  if (!window.XLSX) { toast('A biblioteca do Excel ainda está a carregar. Tente daqui a pouco.', 'bad'); return; }
  const p = UI.p, ms = matsOf(t, p), als = alunosOf(t);
  const head = ['N.º', 'Nome', 'Regime', ...ms, 'Nota AF', ...FIT.map(f => f.n), 'Nota Apt. Física', 'Conhecimentos' + (t.escala === '1-5' ? ' (1-5)' : ''), 'Con. (0-20)', ...Object.values(AVN), 'Nota Atitudes', 'Nota Final', 'Estado', 'Faltas', 'Atrasos', 'Sem material', 'Dispensas'];
  const r1 = n => n == null ? '' : Math.round(n * 10) / 10;
  const rows = als.map(al => { const r = calc(t, p, al); const v = avalOf(t.id, p);
    return [al.num ?? '', al.nome, regAt(al, p), ...ms.map(m => r.lv[m] || ''), r.afOn ? r1(r.AF) : 'n/a', ...FIT.map(f => r.zones[f.k] != null ? ZN[r.zones[f.k]] : ''), r.apfOn ? r1(r.APF) : 'n/a', (v.con || {})[al.id] ?? '', r1(r.CON), ...Object.keys(AVW).map(k => r.ix[k] != null ? AVD[k][r.ix[k]] : ''), r1(r.AV), r.FIN ?? '', r.EST, r.c.F, r.c.A, r.c.M, r.c.D]; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[t.nome + ' · ' + perLabel(p, true) + ' · ' + CFG.ano], [], head, ...rows]), 'Pauta');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[(CFG.escola ? CFG.escola + ' · ' : '') + 'Educação Física · ' + t.nome + ' · ' + perLabel(p, true) + ' · ' + CFG.ano], [], ['N.º', 'Nome', t.ciclo === 'S' ? 'Classificação (0-20)' : nivelLbl(t), 'Faltas'], ...als.map(al => { const r = calc(t, p, al); return [al.num ?? '', al.nome, t.ciclo === 'S' ? (r.FIN ?? '') : (nivel(t, r.FIN) ?? ''), r.c.F]; })]), 'Pauta escola');
  const all = aulasOf(t.id); const list = all.map((a, i) => ({a, n: i + 1})).filter(x => periodOf(x.a.data) === p);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Lição', 'Data', 'Matérias', 'Sumário', 'Faltas', 'Atrasos', 'Sem material'], ...list.map(({a, n}) => { const v = Object.values(a.presencas || {}); return [n, a.data, (a.materias || []).join(', '), a.sumario || '', v.filter(s => s === 'F').length, v.filter(s => s === 'A').length, v.filter(s => s === 'M').length]; })]), 'Sumários');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['N.º', 'Nome', ...list.map(({a, n}) => 'L' + n + ' ' + a.data.slice(5))], ...als.map(al => [al.num ?? '', al.nome, ...list.map(({a}) => (a.presencas || {})[al.id] || '')]), [], ['Legenda: ' + PS.map(k => k + ' = ' + PSN[k]).join(' · ')]]), 'Presenças');
  const out = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
  saveFile(('Pauta_EF_' + t.nome + '_' + perLabel(p)).replace(/[^\wÀ-ú.-]+/g, '_') + '.xlsx', new Blob([out], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}

