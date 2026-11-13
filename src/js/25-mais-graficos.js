/* ---------- mais gráficos ---------- */
// Mapa da turma: alunos × matérias, cor pelo patamar do nível.
function chMapa(t, p) {
  const als = alunosOf(t), ms = matsOf(t, p), v = avalOf(t.id, p); if (!ms.length) return '';
  const bin = l => LVB.findIndex(b => b.ls.includes(l)) + 1;
  return `<div class="tbl-wrap"><table class="hmap"><thead><tr><th class="l">Aluno</th>${ms.map(m => `<th title="${esc(m)}">${esc(m.replace(/\s*\(.*\)$/, '').replace('Ginástica', 'Gin.').replace('Danças', 'D.'))}</th>`).join('')}</tr></thead><tbody>${als.map(al => `<tr><td class="l nm">${esc(al.num ?? '')} · ${esc(al.nome)}</td>${ms.map(m => { const x = lvOf(v, al.id, m), b = x ? bin(x.l) : 0; return `<td class="hm${b}" title="${esc(al.nome + ' · ' + m + ': ' + (x ? x.l + ' (' + LVN[x.l] + ')' : 'sem nível'))}">${x ? x.l : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
// Aluno face à média da turma: barra do aluno e traço da média.
function chCompare(rows, o = {}) {
  const W = chartW(), lw = Math.min(140, W * .34), rh = 22, gap = 14, H = rows.length * (rh + gap) + 20, bw = W - lw - 44, x = v => lw + v / 20 * bw;
  let b = [0, 5, 10, 15, 20].map(v => `<line x1="${x(v)}" x2="${x(v)}" y1="0" y2="${H - 18}" class="${v === 10 ? 'vref' : 'vgrid'}"/><text x="${x(v)}" y="${H - 4}" class="vax" text-anchor="middle">${v}</text>`).join('');
  rows.forEach((r, i) => {
    const yy = i * (rh + gap) + 6;
    b += `<text x="${lw - 8}" y="${yy + rh / 2 + 4}" class="vlab" text-anchor="end">${esc(r.label)}</text>`;
    if (r.v != null) b += `<path d="${rightRound(x(0), yy, Math.max(1, x(r.v) - x(0)), rh, 4)}" fill="var(--v1)"/><text x="${x(r.v) + 6}" y="${yy + rh / 2 + 4}" class="vval">${nf(r.v)}</text>`;
    if (r.m != null) b += `<line x1="${x(r.m)}" x2="${x(r.m)}" y1="${yy - 4}" y2="${yy + rh + 4}" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>`;
    b += `<rect x="0" y="${yy - 6}" width="${W}" height="${rh + 12}" fill="transparent" data-tip="${esc(`${r.label}: aluno ${r.v == null ? '—' : nf(r.v)} · média da turma ${r.m == null ? '—' : nf(r.m)}`)}"/>`;
  });
  return svg(W, H, o.label || 'Aluno face à média da turma', b) + `<div class="vleg"><span><i style="background:var(--v1)"></i>Aluno</span><span><i style="background:var(--ink);width:3px;height:12px;border-radius:1px"></i>Média da turma</span></div>`;
}
function compareRows(t, p, al) {
  const r = calc(t, p, al), rs = alunosOf(t).map(x => calc(t, p, x)), mean = k => { const xs = rs.map(x => x[k]).filter(x => x != null); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; };
  return [['Matérias', 'AF'], ['Aptidão física', 'APF'], ['Conhecimentos', 'CON'], ['Atitudes', 'AV'], ['Final', 'FIN']].map(([l, k]) => ({label:l, v:r[k], m:mean(k)}));
}
// FITescola ao longo do ano: um pequeno gráfico por teste, com a linha da Zona Saudável.
function chFitEvo(t, al, small) {
  const ps = CFG.per.slice(0, CFG.nper).map((_, i) => i + 1), out = [];
  FIT.filter(f => !f.bool).forEach(f => {
    const vals = ps.map(i => { const x = ((avalOf(t.id, i).fit || {})[al.id] || {})[f.k]; return x == null || x === '' ? null : +x; });
    if (vals.filter(x => x != null).length < 1) return;
    const ref = fitRef(f.k, al.sexo, ageAt(al.nasc, refDate(UI.p))), max = Math.max(...vals.filter(x => x != null), ref ? ref.zs : 0) * 1.15 || 1;
    const keep = CHW; CHW = small || Math.min(330, chartW());
    out.push(`<div class="sm"><div class="small"><b>${esc(f.n)}</b> <span class="muted">${esc(f.u)}${ref ? ` · ZS ${f.dir > 0 ? '≥' : '≤'} ${String(ref.zs).replace('.', ',')}` : ''}</span></div>${chLine(ps.map(i => perLabel(i)), [{name:f.n, color:'var(--v3)', vals}], {h:140, max:Math.ceil(max), ref:ref ? ref.zs : -1, label:f.n + ' ao longo do ano'})}</div>`);
    CHW = keep;
  });
  return out.length ? `<div class="smg">${out.join('')}</div>` : '';
}

