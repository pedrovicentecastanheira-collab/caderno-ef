/* ---------- calendário do ano ---------- */
const SUBC = {JDC:1, GIN:2, ATL:3, ARE:4, PAT:5, RAQ:6, OUT:7, JOG:8};
function vCalendario(t) {
  const ps = CFG.per.slice(0, CFG.nper).filter(x => x.ini && x.fim); if (!ps.length) return '<div class="card empty"><p>Defina as datas dos períodos em Mais → Ano letivo.</p></div>';
  const ano = anoOf(t) || 7, byDay = {}; aulasOf(t.id).forEach((a, i) => (byDay[a.data] = byDay[a.data] || []).push({a, n:i + 1}));
  const inPer = iso => ps.some(x => iso >= x.ini && iso <= x.fim), td = today();
  const start = new Date(ps[0].ini + 'T12:00:00'), end = new Date(ps[ps.length - 1].fim + 'T12:00:00'), months = [];
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(new Date(d));
  const used = new Set();
  let h = `<div class="card cal"><div class="cal-days"><span></span>${Array.from({length:31}, (_, i) => `<span class="cd-n">${(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}</span>`).join('')}</div>`;
  months.forEach(m => {
    const y = m.getFullYear(), mo = m.getMonth(), nd = new Date(y, mo + 1, 0).getDate();
    h += `<div class="cal-row"><span class="cal-m">${esc(m.toLocaleDateString('pt-PT', {month:'short'}).replace('.', ''))}</span>`;
    for (let d = 1; d <= 31; d++) {
      if (d > nd) { h += '<span></span>'; continue; }
      const iso = y + '-' + pad(mo + 1) + '-' + pad(d), wd = new Date(y, mo, d).getDay(), au = byDay[iso], st = [];
      let cls = 'cd' + (wd === 0 || wd === 6 ? ' we' : '') + (inPer(iso) ? '' : ' off') + (iso === td ? ' td' : '');
      ps.forEach((x, i) => { if (iso === x.ini) cls += ' pst'; });
      let tip = fmtDate(iso, {weekday:'short', day:'numeric', month:'short'});
      if (au) {
        const subs = [...new Set(au.flatMap(x => (x.a.materias || []).map(mm => subOf(mm, ano, true))))]; subs.forEach(s => used.add(s));
        const cs = subs.length ? subs.map(s => `var(--v${SUBC[s] || 7})`) : ['var(--muted)'];
        st.push(`background:${cs.length === 1 ? cs[0] : `linear-gradient(135deg, ${cs[0]} 50%, ${cs[1]} 50%)`}`); cls += ' au';
        if (au.some(x => /avalia|fitescola|vaiv[ée]m|teste/i.test(x.a.sumario || ''))) cls += ' ev';
        tip += ' · ' + au.map(x => 'Lição ' + x.n + ((x.a.materias || []).length ? ': ' + x.a.materias.join(', ') : '')).join(' / ');
      }
      h += `<button class="${cls}" style="${st.join(';')}" data-a="cal-dia" data-d="${iso}" title="${esc(tip)}" aria-label="${esc(tip)}"></button>`;
    }
    h += '</div>';
  });
  h += `</div><div class="vleg">${[...used].sort((a, b) => SUBC[a] - SUBC[b]).map(s => `<span><i style="background:var(--v${SUBC[s]})"></i>${esc(SUBN[s])}</span>`).join('')}<span><i class="lg-ev"></i>Avaliação ou teste</span><span><i class="lg-td"></i>Hoje</span><span><i class="lg-off"></i>Fora dos períodos</span></div>
    <p class="hint">Toque num dia: abre a aula desse dia ou regista uma nova com essa data.</p>`;
  // Aulas por subdomínio em cada período
  const keys = Object.keys(SUBC).map(s => ({k:s, name:SUBN[s], color:`var(--v${SUBC[s]})`})), rs = ps.map((x, i) => { const c = {}; aulasOf(t.id).filter(a => periodOf(a.data) === i + 1).forEach(a => (a.materias || []).forEach(mm => { const s = subOf(mm, ano, true); c[s] = (c[s] || 0) + 1; })); return {label:perLabel(i + 1, true), c}; });
  if (rs.some(r => Object.keys(r.c).length)) h += fig('Aulas por subdomínio', 'Em cada período (uma aula com duas matérias conta para ambas)', chStack(rs, keys.filter(k => rs.some(r => r.c[k.k])), {id:'cal'}) + legend(keys.filter(k => rs.some(r => r.c[k.k]))) + tableView(['Período', ...keys.filter(k => rs.some(r => r.c[k.k])).map(k => k.name)], rs.map(r => [r.label, ...keys.filter(k => rs.some(x => x.c[k.k])).map(k => r.c[k.k] || 0)])));
  return h;
}

