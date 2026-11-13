/* ---------- horário semanal ---------- */
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function hojeSlots() { const d = new Date().getDay(); return Object.values(S.turmas).flatMap(t => (t.horario || []).filter(h => +h.d === d && h.h).map(h => ({t, h:h.h}))).sort((a, b) => a.h.localeCompare(b.h)); }
function vHoje() {
  const sl = hojeSlots(); if (!sl.length) return '';
  const now = new Date(), hm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  return `<div class="card hoje"><span class="eyebrow">Hoje · ${esc(fmtDate(today(), {weekday:'long', day:'numeric', month:'long'}))}</span><div class="chips">${sl.map(x => { const feita = aulasOf(x.t.id).some(a => a.data === today()); return `<button class="chip ${feita ? '' : x.h <= hm ? 'on' : ''}" data-a="hoje-go" data-id="${esc(x.t.id)}">${esc(x.h)} · ${esc(x.t.nome)}${feita ? ' ✓' : ''}</button>`; }).join('')}</div></div>`;
}
function vHorarioSemana() {
  const sl = Object.values(S.turmas).flatMap(t => (t.horario || []).filter(h => h.h).map(h => ({t, d:+h.d, h:h.h})));
  if (!sl.length) return '<p class="hint">Defina o horário em cada turma (Mais → turma → Horário).</p>';
  const hs = [...new Set(sl.map(x => x.h))].sort(), ds = [1, 2, 3, 4, 5, 6].filter(d => d < 6 || sl.some(x => x.d === 6));
  return `<div class="tbl-wrap"><table><thead><tr><th>Hora</th>${ds.map(d => `<th>${DIAS[d]}</th>`).join('')}</tr></thead><tbody>${hs.map(h => `<tr><td><b>${h}</b></td>${ds.map(d => `<td>${sl.filter(x => x.d === d && x.h === h).map(x => esc(x.t.nome)).join('<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

