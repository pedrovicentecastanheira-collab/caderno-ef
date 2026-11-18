/* ---------- agenda e tarefas, observação por grupos, banco de perguntas partilhado, gráfico de dispersão ---------- */

/* 1. Agenda e tarefas */
const AGT = {reuniao:['Reunião', '#6250d6'], entrega:['Entrega', '#d03b3b'], tarefa:['Tarefa', '#1C55CF'], outro:['Outro', '#5A6879']};
const agLista = () => (CFG.agenda = CFG.agenda || []);
// Prazos que a app já conhece (fim de cada período) entram na agenda sem ser preciso escrevê-los.
function agAuto() {
  return CFG.per.slice(0, CFG.nper).map((x, i) => x.fim && {id:'auto:per' + (i + 1), tipo:'entrega', tit:'Fim do ' + perLabel(i + 1, true) + ': classificações e relatórios', data:x.fim, auto:true}).filter(Boolean);
}
const agTodos = () => agLista().concat(agAuto().filter(a => !agLista().some(x => x.id === a.id)));
const agDia = d => agTodos().filter(x => x.data === d).sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
function agItem(x, mostraData) {
  const [n, cor] = AGT[x.tipo] || AGT.outro, t = x.tid && S.turmas[x.tid], atras = !x.feito && x.data < today();
  return `<div class="ag-i${x.feito ? ' feito' : ''}${atras ? ' atras' : ''}" style="--ag:${cor}">${x.auto ? '<span class="ag-c"></span>' : `<input type="checkbox" data-in="ag-ok" data-id="${esc(x.id)}"${x.feito ? ' checked' : ''} aria-label="Feito: ${esc(x.tit)}">`}
    <button class="ag-t" data-a="${x.auto ? 'ag-novo' : 'ag-ed'}" data-id="${esc(x.id)}" data-d="${esc(x.data)}"><b>${esc(x.tit)}</b><span>${esc(n)}${mostraData ? ' · ' + esc(fmtDate(x.data, {weekday:'short', day:'numeric', month:'short'})) : ''}${x.hora ? ' · ' + esc(x.hora) : ''}${t ? ' · ' + esc(t.nome) : ''}${atras ? ' · em atraso' : ''}</span></button></div>`;
}
function vAgendaIni() {
  const d = today(), fim = isoDe(new Date(new Date(d + 'T12:00:00').getTime() + 13 * 864e5));
  const atras = agLista().filter(x => !x.feito && x.data < d), prox = agTodos().filter(x => x.data >= d && x.data <= fim).sort((a, b) => (a.data + (a.hora || '99')).localeCompare(b.data + (b.hora || '99')));
  const dias = [...new Set(prox.map(x => x.data))];
  return `<div class="sec-h"><h2>Agenda</h2><button class="link" data-a="ag-novo">+ Novo</button></div><div class="card agenda">
    ${atras.length ? `<div class="ag-d"><span class="eyebrow bad">Em atraso</span>${atras.map(x => agItem(x, true)).join('')}</div>` : ''}
    ${dias.length ? dias.map(dd => `<div class="ag-d"><span class="eyebrow">${dd === d ? 'Hoje' : esc(fmtDate(dd, {weekday:'long', day:'numeric', month:'short'}))}</span>${agDia(dd).map(x => agItem(x)).join('')}</div>`).join('') : (atras.length ? '' : '<p class="small muted" style="margin:0">Nada nos próximos 14 dias. Junte reuniões, entregas e tarefas para as ver aqui, no horário da semana e no calendário.</p>')}</div>`;
}
function sheetAgenda(x) {
  UI.draft = x;
  const body = `<div class="form"><div class="field"><label for="ag-tit">O quê</label><input id="ag-tit" type="text" value="${esc(x.tit || '')}" placeholder="Ex.: Conselho de turma do 7.º X"></div>
    <div class="field"><span class="lbl">Tipo</span><div class="seg block">${Object.entries(AGT).map(([k, [n]]) => `<button data-a="ag-tipo" data-k="${k}" class="${x.tipo === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label for="ag-data">Dia</label><input id="ag-data" type="date" value="${esc(x.data || today())}"></div><div class="field"><label for="ag-hora">Hora (opcional)</label><input id="ag-hora" type="time" value="${esc(x.hora || '')}"></div></div>
    <div class="field"><label for="ag-tid">Turma (opcional)</label><select id="ag-tid"><option value="">—</option>${Object.values(S.turmas).sort(byNome).map(t => `<option value="${esc(t.id)}"${x.tid === t.id ? ' selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></div>
    <div class="field"><label for="ag-nota">Notas</label><textarea id="ag-nota" rows="2">${esc(x.nota || '')}</textarea></div>
    <p class="hint" style="margin:0">Com os lembretes ligados (Definições › Lembretes), recebe um aviso meia hora antes, ou às 8h se não tiver hora.</p></div>`;
  const foot = `${agLista().some(y => y.id === x.id) ? '<button class="btn danger" data-a="ag-del">Apagar</button>' : '<button class="btn" data-a="sh-close">Cancelar</button>'}<button class="btn primary" data-a="ag-save">Guardar</button>`;
  if ($('#sheet').hidden) openSheet(agLista().some(y => y.id === x.id) ? 'Editar na agenda' : 'Novo na agenda', body, foot); else updSheet(body, foot);
}
const agLer = () => Object.assign(UI.draft, {tit:$('#ag-tit').value.trim(), data:$('#ag-data').value || today(), hora:$('#ag-hora').value, tid:$('#ag-tid').value, nota:$('#ag-nota').value.trim()});
// No Início, no horário da semana e no calendário do ano
INI_SEC.splice(1, 0, ['agenda', 'Agenda e tarefas']);
// (a secção entra no Início pelo marcador «agenda» do painel inicial, com a mesma ordem e o mesmo «esconder» das outras)
{ const _vs = vSemanaIni; vSemanaIni = function () {
  let h = _vs(); if (!h) return h;
  return h.replace(/<div class="sem-hd( hoje)?"><b>(\w+)<\/b><span>(\d+)<\/span><\/div>/g, (m0, hj, dia, n) => {
    const seg = segundaDe(today()), iso = isoDe(new Date(seg.getTime() + (DIAS.indexOf(dia) - 1) * 864e5)), xs = agDia(iso);
    return xs.length ? m0.replace('</div>', `<span class="sem-ag" title="${esc(xs.map(x => (x.hora ? x.hora + ' ' : '') + x.tit).join('\n'))}">${xs.slice(0, 3).map(x => `<i style="background:${(AGT[x.tipo] || AGT.outro)[1]}"></i>`).join('')}</span></div>`) : m0; }); }; }
{ const _vc = vCalendario; vCalendario = function (t) {
  const ds = new Set(agTodos().map(x => x.data));
  return _vc(t).replace(/class="(cd[^"]*)"( style="[^"]*" data-a="cal-dia" data-d="(\d{4}-\d{2}-\d{2})")/g, (m0, cls, rest, d) => ds.has(d) ? `class="${cls} ag"${rest}` : m0)
    .replace('<span><i class="lg-td"></i>Hoje</span>', '<span><i class="lg-td"></i>Hoje</span><span><i class="lg-ag"></i>Agenda</span>'); }; }
// Lembretes
{ const _ll = lembList; lembList = function () { const out = _ll(), now = new Date(), hm = now.getHours() * 60 + now.getMinutes(), d = today();
  agDia(d).filter(x => !x.feito).forEach(x => { const at = x.hora ? minDe(x.hora) - 30 : 8 * 60; out.push({k:'ag:' + d + ':' + x.id, when:at, due:hm >= at, title:(x.hora ? x.hora + ' · ' : 'Hoje · ') + x.tit, body:[(AGT[x.tipo] || AGT.outro)[0], x.tid && S.turmas[x.tid] && S.turmas[x.tid].nome].filter(Boolean).join(' · ')}); });
  return out.sort((a, b) => a.when - b.when); }; }

/* 2. Observação por grupos ou estações (modo aula) */
const GO = {m:null, g:'I'};
function goGrupos(t, a, m) {
  const {g} = difGrupos(t, a, m), out = ['I', 'E', 'A'].filter(k => g[k].length).map(k => ({k, n:DGN[k], als:g[k], nv:k}));
  const E = UI.eq || {}; (E.res || []).forEach((ids, i) => { const als = ids.map(id => (t.alunos || []).find(x => x.id === id)).filter(Boolean); if (als.length) out.push({k:'eq' + i, n:'Equipa ' + (i + 1), als, nv:null}); });
  out.push({k:'todos', n:'Turma toda', als:alunosOf(t).filter(al => !['F', 'D'].includes((a.presencas || {})[al.id])), nv:null});
  return out;
}
function goDia(v, aid, m, cid, d) { const l = evMap(v, aid, m)[cid] || []; const x = l.find(y => y[0] === d); return x ? x[1] : null; }
function sheetGrupos(open) {
  const t = turma(), a = S.aulas[UI.maula] || {data:today(), materias:matsOf(t, UI.p), presencas:{}}, ms = (a.materias || []).length ? a.materias : matsOf(t, UI.p);
  if (!ms.length) { toast('Escolha primeiro a matéria da aula.'); return; }
  if (!ms.includes(GO.m)) GO.m = ms[0]; const m = GO.m, gs = goGrupos(t, a, m); if (!gs.some(g => g.k === GO.g)) GO.g = gs[0].k;
  const G = gs.find(g => g.k === GO.g), nv = G.nv || DG[nivelTurma(t, m)] || 'I', cs = compsNivel(compsOf(t.ciclo, m), nv).filter(c => !geralC(c)).slice(0, 8), v = avalOf(t.id, periodOf(a.data)), d = a.data;
  const cel = (al, c) => { const s = goDia(v, al.id, m, c.id, d), hs = evState(evMap(v, al.id, m)[c.id]); return `<td><button class="go-c ${s === 1 ? 'ok' : s === 0 ? 'no' : ''}" data-a="go-c" data-aid="${esc(al.id)}" data-c="${esc(c.id)}" aria-label="${esc(nome2(al.nome))}: ${esc(c.txt)}">${s === 1 ? '✓' : s === 0 ? '✗' : ''}${hs ? `<i class="go-h ${hs}"></i>` : ''}</button></td>`; };
  const body = `<div class="go">${ms.length > 1 ? `<div class="chips">${ms.map(x => `<button class="chip ${x === m ? 'on' : ''}" data-a="go-m" data-m="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    <div class="chips">${gs.map(g => `<button class="chip ${g.k === GO.g ? 'on' : ''}" data-a="go-g" data-k="${g.k}">${esc(g.n)} <span class="num-t">${g.als.length}</span></button>`).join('')}</div>
    <p class="hint" style="margin:0">Toque numa célula: ✓ conseguiu → ✗ ainda não → limpar. Toque no número de uma competência para dar ✓ a todo o grupo de uma vez. Nível observado: <b>${esc(DGN[nv].replace('Grupo ', ''))}</b>.</p>
    ${cs.length && G.als.length ? `<div class="tbl-wrap"><table class="go-t"><thead><tr><th class="l">Aluno</th>${cs.map((c, i) => `<th><button class="go-col" data-a="go-col" data-c="${esc(c.id)}" title="${esc(c.txt)}">${i + 1}</button></th>`).join('')}</tr></thead>
      <tbody>${G.als.map(al => `<tr><td class="go-n">${avatar(al, 'sm')}<span>${esc(nome2(al.nome))}</span></td>${cs.map(c => cel(al, c)).join('')}</tr>`).join('')}</tbody></table></div>
      <ol class="go-leg">${cs.map(c => `<li>${esc(cAluno(t.ciclo, m, c))}</li>`).join('')}</ol>` : '<p class="muted">Sem alunos ou competências neste grupo.</p>'}</div>`;
  if (open || $('#sheet').hidden) openSheet('Observar por grupos · ' + fmtDate(d, {day:'numeric', month:'short'}), body, '<button class="btn primary" data-a="sh-close">Feito</button>'); else updSheet(body, '<button class="btn primary" data-a="sh-close">Feito</button>');
}
function goMarcar(aid, cid) {
  const t = turma(), a = S.aulas[UI.maula] || {data:today()}, v = avalOf(t.id, periodOf(a.data)), s = goDia(v, aid, GO.m, cid, a.data);
  if (s == null) evAdd(t, a.data, aid, GO.m, cid, 1); else evAdd(t, a.data, aid, GO.m, cid, 0); // ✓ → ✗ ; ✗ → limpar (o mesmo valor no mesmo dia retira)
}
{ const _vma = vModoAula; vModoAula = function (t) { return _vma(t).replace('<button class="btn primary" data-a="ma-obs">Observar competências</button>', '<button class="btn primary" data-a="ma-obs">Observar competências</button><button class="btn primary" data-a="go-open">Observar por grupos</button>'); }; }

/* 4. Banco de perguntas (próprias e partilhadas com o grupo) */
function qbSync() { for (let i = QB.length - 1; i >= 0; i--) if (QB[i].u) QB.splice(i, 1); (CFG.perg || []).forEach(q => QB.push(Object.assign({}, q, {u:true}))); }
{ const _sm = sheetModo; sheetModo = function () { qbSync(); _sm();
  if (KI && KI.act === 'quiz') { const f = $('#sheet .form'); if (f) f.insertAdjacentHTML('beforeend', qAnaliseHtml(turma()) + `<button class="btn" data-a="qb-open">Banco de perguntas (${(CFG.perg || []).length} próprias)</button>`); } }; }
{ const _kr = kiRender; kiRender = function () { qbSync(); return _kr(); }; }
{ const _ks = kiSave; kiSave = function () {
  const r = KI && KI.act === 'quiz' ? KI.qs.filter(id => QB.some(q => q.id === id)).map(id => [id, KI.r[id] === 0 ? 1 : 0]) : null;
  _ks(); if (!r) return; const v = avalOf(KI.t, UI.p); v.quizQ = v.quizQ || {}; r.forEach(([id, ok]) => { const o = v.quizQ[id] = v.quizQ[id] || [0, 0]; o[0] += ok; o[1]++; }); touchAval(v); }; }
function qAnaliseHtml(t) {
  const Q = avalOf(t.id, UI.p).quizQ || {}, xs = Object.entries(Q).map(([id, [ok, n]]) => ({q:QB.find(x => x.id === id), ok, n})).filter(x => x.q && x.n).sort((a, b) => a.ok / a.n - b.ok / b.n);
  if (!xs.length) return '';
  return `<div class="card"><b>Por pergunta · ${esc(perLabel(UI.p, true))}</b><p class="hint" style="margin:2px 0 6px">As que a turma mais falha aparecem primeiro: são as que vale a pena rever na aula.</p>${xs.slice(0, 8).map(x => { const p = Math.round(x.ok / x.n * 100); return `<div class="qa-r"><span class="small">${esc(x.q.q)}</span><span class="pl-b"><i style="width:${p}%;background:${p < 50 ? 'var(--bad)' : p < 75 ? 'var(--warn)' : 'var(--ok)'}"></i></span><b class="num-t">${p}%</b></div>`; }).join('')}</div>`;
}
function sheetBanco() {
  const t = turma(), ano = anoOf(t) || 7, P = CFG.perg || [], base = QB.filter(q => !q.u).length;
  const body = `<div class="form"><p class="small" style="margin:0">${base} perguntas de base e <b>${P.length}</b> suas. As suas entram nos questionários dos anos indicados e vão no pacote do grupo (Definições › Grupo de EF), para os colegas as receberem.</p>
    <button class="btn primary" data-a="qb-novo">+ Nova pergunta</button>
    ${P.length ? `<div class="list">${P.map(q => `<button class="li" data-a="qb-ed" data-id="${esc(q.id)}"><span class="who"><div class="nm">${esc(q.q)}</div><div class="meta">${q.a[0]}.º a ${q.a[1]}.º ano${q.tema ? ' · ' + esc(q.tema) : ''}${q.autor ? ' · ' + esc(q.autor) : ''} · certa: ${esc(q.o[0])}</div></span><span class="end muted">›</span></button>`).join('')}</div>` : ''}
    <details class="vtab"><summary>Ver as perguntas de base do ${ano}.º ano</summary><ul class="small">${qbAno(ano).filter(q => !q.u).map(q => `<li>${esc(q.q)} <span class="muted">(${esc(q.o[0])})</span></li>`).join('')}</ul></details></div>`;
  if ($('#sheet').hidden) openSheet('Banco de perguntas', body, ''); else updSheet(body, '');
}
function sheetPergunta(q) {
  UI.draft = q; const ano = anoOf(turma()) || 7;
  const body = `<div class="form"><div class="field"><label for="qb-q">Pergunta</label><textarea id="qb-q" rows="2">${esc(q.q || '')}</textarea></div>
    <div class="field"><label for="qb-o0">Resposta certa</label><input id="qb-o0" type="text" value="${esc(q.o[0] || '')}"></div>
    ${[1, 2, 3].map(i => `<div class="field"><label for="qb-o${i}">Resposta errada ${i}</label><input id="qb-o${i}" type="text" value="${esc(q.o[i] || '')}"></div>`).join('')}
    <div class="grid2"><div class="field"><label for="qb-a0">Do ano</label><input id="qb-a0" type="number" min="1" max="12" value="${q.a[0] || ano}"></div><div class="field"><label for="qb-a1">Ao ano</label><input id="qb-a1" type="number" min="1" max="12" value="${q.a[1] || ano}"></div></div>
    <div class="field"><label for="qb-tema">Tema (opcional)</label><input id="qb-tema" type="text" value="${esc(q.tema || '')}" placeholder="Ex.: Voleibol, Saúde, Regras"></div>
    <p class="hint" style="margin:0">A ordem das respostas é baralhada para cada aluno e a correção é automática.</p></div>`;
  const ja = (CFG.perg || []).some(x => x.id === q.id), foot = `${ja ? '<button class="btn danger" data-a="qb-del">Apagar</button>' : '<button class="btn" data-a="qb-open">Voltar</button>'}<button class="btn primary" data-a="qb-save">Guardar</button>`;
  updSheet(body, foot);
}
PKG_PARTES.push(['perg', 'Banco de perguntas dos questionários']);
{ const _b = pkgBuild; pkgBuild = function () { return Object.assign(_b(), {perg:(CFG.perg || []).map(q => Object.assign({autor:CFG.prof || ''}, q))}); }; }
{ const _r = pkgResumo; pkgResumo = function (k, P) { if (k === 'perg') return (P.perg || []).length ? P.perg.length + ' perguntas' : null; return _r(k, P); }; }
{ const _a = pkgApply; pkgApply = function (P, sel) {
  if (sel.perg && P.perg) { const L = CFG.perg = CFG.perg || []; P.perg.forEach(q => { if (q && q.q && Array.isArray(q.o) && q.o.length >= 2 && !L.some(x => x.id === q.id || norm(x.q) === norm(q.q))) L.push({id:q.id || 'u' + uid(), q:String(q.q), o:q.o.map(String).slice(0, 4), a:Array.isArray(q.a) ? q.a : [5, 12], tema:q.tema || '', autor:q.autor || ''}); }); qbSync(); }
  return _a(P, sel); }; }

/* 5. Gráfico de dispersão */
const DVAR = {fin:['Classificação final', 20], af:['Matérias (AF)', 20], apf:['Aptidão física', 20], con:['Conhecimentos', 20], av:['Atitudes', 20], ass:['Assiduidade (%)', 100], falt:['Faltas', null], atr:['Atrasos', null], vai:['Vaivém (percursos)', null]};
function dVal(k, t, p, al) {
  const r = calc(t, p, al), c = counts(t, p, al.id), n = c.n;
  return ({fin:r.FIN, af:r.AF, apf:r.APF, con:r.CON, av:r.AV, ass:n ? Math.round((c.P + c.A + c.M + c.D) / n * 100) : null, falt:n ? c.F : null, atr:n ? c.A : null, vai:((avalOf(t.id, p).fit || {})[al.id] || {}).vaivem ?? null})[k];
}
function chScatter(pts, o) {
  const W = chartW(), H = o.h || 260, L = 40, R = 14, T = 12, B = 36, iw = W - L - R, ih = H - T - B;
  const mx = o.xmax || Math.max(1, ...pts.map(p => p.x)), my = o.ymax || Math.max(1, ...pts.map(p => p.y)), tx = niceTicks(mx), ty = niceTicks(my), X = tx[tx.length - 1], Y = ty[ty.length - 1];
  const x = v => L + v / X * iw, y = v => T + ih - v / Y * ih;
  let b = ty.map(v => `<line x1="${L}" x2="${L + iw}" y1="${y(v)}" y2="${y(v)}" class="vgrid"/><text x="${L - 6}" y="${y(v) + 4}" class="vax" text-anchor="end">${v}</text>`).join('')
    + tx.map(v => `<text x="${x(v)}" y="${T + ih + 16}" class="vax" text-anchor="middle">${v}</text>`).join('')
    + `<text x="${L + iw / 2}" y="${H - 4}" class="vax" text-anchor="middle">${esc(o.xl)}</text><text x="12" y="${T + ih / 2}" class="vax" text-anchor="middle" transform="rotate(-90 12 ${T + ih / 2})">${esc(o.yl)}</text>`;
  if (o.reg) { const [a, c] = o.reg, x0 = 0, x1 = X; const cl = v => Math.max(0, Math.min(Y, v)); b += `<line x1="${x(x0)}" y1="${y(cl(a + c * x0))}" x2="${x(x1)}" y2="${y(cl(a + c * x1))}" class="vref"/>`; }
  pts.forEach(p => { b += `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="${p.fora ? 7 : 6}" fill="${p.cor}" fill-opacity=".8" stroke="${p.fora ? 'var(--ink)' : 'var(--surface)'}" stroke-width="${p.fora ? 2 : 1.5}" data-tip="${esc(p.tip)}" data-a="aluno-edit" data-id="${esc(p.id)}" style="cursor:pointer"/>`; });
  return svg(W, H, o.label || '', b + `<line x1="${L}" x2="${L + iw}" y1="${T + ih}" y2="${T + ih}" class="vbase"/>`);
}
function vDispersao(t) {
  const als = alunosOf(t); if (als.length < 4) return '';
  const kx = UI.dx || 'ass', ky = UI.dy || 'fin', p = UI.p;
  const pts = als.map(al => ({al, x:dVal(kx, t, p, al), y:dVal(ky, t, p, al)})).filter(o => o.x != null && o.y != null);
  const sel = (k, cur) => `<select data-in="dispx" data-k="${k}" aria-label="${k === 'dx' ? 'Eixo horizontal' : 'Eixo vertical'}">${Object.entries(DVAR).map(([v, [n]]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  let h = `<div class="sec-h"><h2>Relações na turma</h2></div><div class="card disp"><div class="disp-s"><label>Vertical ${sel('dy', ky)}</label><label>Horizontal ${sel('dx', kx)}</label></div>`;
  if (pts.length < 4) return h + '<p class="small muted">Ainda há poucos alunos com estes dois dados neste período.</p></div>';
  const n = pts.length, mxv = pts.reduce((s, o) => s + o.x, 0) / n, myv = pts.reduce((s, o) => s + o.y, 0) / n;
  const sxx = pts.reduce((s, o) => s + (o.x - mxv) ** 2, 0), syy = pts.reduce((s, o) => s + (o.y - myv) ** 2, 0), sxy = pts.reduce((s, o) => s + (o.x - mxv) * (o.y - myv), 0);
  const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0, c = sxx ? sxy / sxx : 0, a = myv - c * mxv;
  const res = pts.map(o => o.y - (a + c * o.x)), sd = Math.sqrt(res.reduce((s, e) => s + e * e, 0) / n) || 1;
  const pp = pts.map((o, i) => ({x:o.x, y:o.y, id:o.al.id, fora:Math.abs(res[i]) > 1.5 * sd && Math.abs(r) >= .3, cor:o.al.sexo === 'F' ? 'var(--v6)' : o.al.sexo === 'M' ? 'var(--v1)' : 'var(--v7)', tip:`${o.al.nome}: ${DVAR[kx][0]} ${nf(o.x)} · ${DVAR[ky][0]} ${nf(o.y)}`}));
  const forca = Math.abs(r) >= .7 ? 'forte' : Math.abs(r) >= .4 ? 'moderada' : Math.abs(r) >= .2 ? 'fraca' : 'quase nenhuma';
  const fora = pp.map((o, i) => o.fora ? {al:pts[i].al, acima:res[i] > 0} : null).filter(Boolean);
  h += chScatter(pp, {xl:DVAR[kx][0], yl:DVAR[ky][0], xmax:DVAR[kx][1], ymax:DVAR[ky][1], reg:Math.abs(r) >= .2 ? [a, c] : null, label:`${DVAR[ky][0]} em função de ${DVAR[kx][0]}`})
    + legend([{name:'Raparigas', color:'var(--v6)'}, {name:'Rapazes', color:'var(--v1)'}])
    + `<p class="small" style="margin:6px 0 0">${Math.abs(r) < .2 ? '<b>Quase não há relação</b>' : `Relação <b>${forca}${r > 0 ? ' e positiva' : ' e negativa'}</b>`} (r = ${(Math.round(r * 100) / 100 || 0).toLocaleString('pt-PT', {minimumFractionDigits:2, maximumFractionDigits:2})}, ${n} alunos).${Math.abs(r) >= .2 ? ` Em média, ${r > 0 ? 'mais' : 'menos'} ${esc(DVAR[kx][0].toLowerCase())} anda a par de ${r > 0 ? 'mais' : 'menos'} ${esc(DVAR[ky][0].toLowerCase())}.` : ''} Relação não quer dizer causa.</p>`
    + (fora.length ? `<p class="small" style="margin:4px 0 0"><b>Fora do padrão</b> (contorno escuro): ${fora.map(f => `${esc(f.al.nome)} (${f.acima ? 'acima' : 'abaixo'} do esperado)`).join(', ')}.</p>` : '')
    + tableView(['Aluno', DVAR[ky][0], DVAR[kx][0]], pts.map(o => [o.al.nome, nf(o.y), nf(o.x)]));
  return h + '</div>';
}
{ const _g = vGraficos; vGraficos = function (t) { const h = _g(t), i = h.indexOf('<div class="sec-h"><h2>Comparar turmas'); const d = vDispersao(t); return i < 0 ? h + d : h.slice(0, i) + d + h.slice(i); }; }

Object.assign(A, {
  'ag-novo': el => { const d = el && el.dataset && el.dataset.d; sheetAgenda({id:'ag' + uid(), tipo:'tarefa', tit:'', data:d || today(), hora:'', tid:UI.tab === 'inicio' ? '' : (UI.turma || '')}); },
  'ag-ed': el => { const x = agLista().find(y => y.id === el.dataset.id); if (x) sheetAgenda(clone(x)); },
  'ag-tipo': el => { agLer(); UI.draft.tipo = el.dataset.k; sheetAgenda(UI.draft); },
  'ag-save': () => { const x = agLer(); if (!x.tit) { toast('Escreva o que é.', 'bad'); $('#ag-tit').focus(); return; } const L = agLista(), i = L.findIndex(y => y.id === x.id); if (i >= 0) L[i] = x; else L.push(x);
    L.sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || ''))); Store.save('cfg', CFG); closeSheet(); render(); toast('Guardado na agenda.'); },
  'ag-del': el => { if (!armed(el, 'Apagar?')) return; CFG.agenda = agLista().filter(y => y.id !== UI.draft.id); Store.save('cfg', CFG); closeSheet(); render(); },
  'go-open': () => { GO.g = null; sheetGrupos(true); },
  'go-m': el => { GO.m = el.dataset.m; sheetGrupos(); },
  'go-g': el => { GO.g = el.dataset.k; sheetGrupos(); },
  'go-c': el => { goMarcar(el.dataset.aid, el.dataset.c); sheetGrupos(); },
  'go-col': el => { const t = turma(), a = S.aulas[UI.maula] || {data:today(), materias:[], presencas:{}}, G = goGrupos(t, a, GO.m).find(g => g.k === GO.g), v = avalOf(t.id, periodOf(a.data)); let n = 0;
    G.als.forEach(al => { if (goDia(v, al.id, GO.m, el.dataset.c, a.data) == null) { evAdd(t, a.data, al.id, GO.m, el.dataset.c, 1); n++; } }); sheetGrupos(); toast(n ? `✓ para ${n} ${n === 1 ? 'aluno' : 'alunos'}.` : 'Todos já tinham registo hoje.'); },
  'qb-open': () => { closeSheet(); sheetBanco(); },
  'qb-novo': () => sheetPergunta({id:'u' + uid(), q:'', o:['', '', '', ''], a:[], tema:''}),
  'qb-ed': el => { const q = (CFG.perg || []).find(x => x.id === el.dataset.id); if (q) sheetPergunta(clone(q)); },
  'qb-save': () => { const q = UI.draft, o = [0, 1, 2, 3].map(i => $('#qb-o' + i).value.trim()).filter((x, i) => x || i === 0);
    q.q = $('#qb-q').value.trim(); q.o = o; let a0 = +$('#qb-a0').value || 5, a1 = +$('#qb-a1').value || a0; if (a1 < a0) [a0, a1] = [a1, a0]; q.a = [a0, a1]; q.tema = $('#qb-tema').value.trim();
    if (!q.q || !q.o[0] || q.o.length < 2) { toast('Escreva a pergunta, a resposta certa e pelo menos uma errada.', 'bad'); return; }
    const L = CFG.perg = CFG.perg || [], i = L.findIndex(x => x.id === q.id); if (i >= 0) L[i] = q; else L.push(q); Store.save('cfg', CFG); qbSync(); sheetBanco(); toast('Pergunta guardada.'); },
  'qb-del': el => { if (!armed(el, 'Apagar?')) return; CFG.perg = (CFG.perg || []).filter(x => x.id !== UI.draft.id); Store.save('cfg', CFG); qbSync(); sheetBanco(); }
});
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'ag-ok') { const x = agLista().find(y => y.id === el.dataset.id); if (x) { x.feito = el.checked; Store.save('cfg', CFG); render(); } }
  else if (k === 'dispx') { UI[el.dataset.k] = el.value; render(); } });
