/* ---------- retrato do aluno ---------- */
// Radar dos quatro domínios: aluno (área) e média da turma (contorno tracejado).
function chRadar(axes, o = {}) {
  const W = Math.min(o.w || 340, chartW()), H = W * .8, cx = W / 2, cy = H / 2 + 2, R = Math.min(W / 2 - 84, H / 2 - 26), n = axes.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = (v || 0) / 20 * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  let b = [5, 10, 15, 20].map(v => `<polygon points="${axes.map((_, i) => pt(i, v).join(',')).join(' ')}" fill="none" class="${v === 10 ? 'vref' : 'vgrid'}"/>`).join('');
  axes.forEach((x, i) => { const [ex, ey] = pt(i, 20), [lx, ly] = pt(i, 22.5); b += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" class="vgrid"/><text x="${lx}" y="${ly + 4}" class="vlab" text-anchor="${Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'}">${esc(x.label)}</text>`; });
  b += `<text x="${cx + 4}" y="${pt(0, 10)[1] + 11}" class="vax">10</text>`;
  b += `<polygon points="${axes.map((x, i) => pt(i, x.m).join(',')).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  b += `<polygon points="${axes.map((x, i) => pt(i, x.v).join(',')).join(' ')}" fill="var(--v1)" fill-opacity=".22" stroke="var(--v1)" stroke-width="2" stroke-linejoin="round"/>`;
  axes.forEach((x, i) => { const [px, py] = pt(i, x.v); b += `<circle cx="${px}" cy="${py}" r="4.5" fill="var(--v1)" stroke="var(--surface)" stroke-width="2"/><circle cx="${px}" cy="${py}" r="14" fill="transparent" data-tip="${esc(`${x.label}: aluno ${x.v == null ? 'sem dados' : nf(x.v)} · turma ${x.m == null ? '—' : nf(x.m)}`)}"/>`; });
  return svg(W, H, o.label || 'Retrato do aluno por domínio', b) + `<div class="vleg"><span><i style="background:var(--v1)"></i>Aluno</span><span><i style="background:transparent;border:1.5px dashed var(--ink)"></i>Média da turma</span></div>`;
}
// Barras de competências dominadas por matéria.
function compBars(t, p, al) {
  const v = avalOf(t.id, p), r = calc(t, p, al), ms = Object.keys(r.lv);
  const rows = ms.map(m => { const x = compSplit(t.ciclo, m, r.lv[m], tksOf(v, al.id, m)), tot = compsOf(t.ciclo, m).length; return {m, l:r.lv[m], d:x ? x.dom.length : null, tot}; });
  if (!rows.length) return '<p class="hint">Sem matérias avaliadas neste período.</p>';
  return `<div class="cbars">${rows.map(x => { const b = LVB.findIndex(z => z.ls.includes(x.l)) + 1, pc = x.tot ? Math.round(x.d / x.tot * 100) : 0; return `<div class="cbar"><div class="cb-h"><b>${esc(x.m)}</b><span class="muted small">${esc(x.l)} · ${x.tot ? `${x.d} de ${x.tot} competências` : 'sem descritivo'}</span></div><span class="cb-b" role="img" aria-label="${esc(x.m)}: ${x.d ?? 0} de ${x.tot} competências"><i style="width:${pc}%;background:var(--lv${b || 1})"></i></span></div>`; }).join('')}</div>`;
}
function retrato(t, p, al) {
  const rows = compareRows(t, p, al).filter(x => x.label !== 'Final');
  return `<div class="retrato"><div>${chRadar(rows.map(x => ({label:x.label, v:x.v, m:x.m})), {w:330})}</div><div><div class="small" style="font-weight:600;margin-bottom:6px">Competências dominadas por matéria</div>${compBars(t, p, al)}</div></div>`;
}

