/* ---------- calendário escolar, aulas reais, quem falta observar, sumários e fecho do período ---------- */
// Calendário escolar 2026/27 (continente; Despacho n.º 8368/2024 e alterações). As escolas fixam o início entre 11 e 15 de setembro;
// o secundário científico-humanístico começa a 21 de setembro. Tudo fica editável em Definições › Ano letivo.
const CAL2627 = {
  per:[{ini:'2026-09-14', fim:'2026-12-15'}, {ini:'2027-01-04', fim:'2027-03-19'}, {ini:'2027-04-05', fim:'2027-06-11'}],
  fimAno:{1:'2027-06-30', 2:'2027-06-30', 3:'2027-06-30', 4:'2027-06-30', 9:'2027-06-04', 11:'2027-06-04', 12:'2027-06-04'},
  sem:[['2026-10-05', '2026-10-05', 'Implantação da República'], ['2026-12-01', '2026-12-01', 'Restauração da Independência'], ['2026-12-08', '2026-12-08', 'Imaculada Conceição'],
    ['2026-12-16', '2027-01-01', 'Interrupção do Natal'], ['2027-02-08', '2027-02-10', 'Interrupção do Carnaval'], ['2027-03-22', '2027-04-02', 'Interrupção da Páscoa'],
    ['2027-05-27', '2027-05-27', 'Corpo de Deus'], ['2027-06-10', '2027-06-10', 'Dia de Portugal']]
};
const semAulas = d => (CFG.semAulas || []).find(x => x[0] <= d && d <= x[1]);
const fimPer = (t, p) => (p === CFG.nper && CFG.fimAno && CFG.fimAno[anoOf(t)]) || (CFG.per[p - 1] || {}).fim;
// Tempos de aula reais do período: dias do horário da turma, sem feriados nem interrupções.
function slotsReais(t, p) {
  const P = CFG.per[p - 1] || {}, fim = fimPer(t, p), hs = (t.horario || []).filter(h => h.h); if (!P.ini || !fim || !hs.length) return [];
  const out = []; for (let d = P.ini; d <= fim; d = somaDias(d, 1)) { if (semAulas(d)) continue; const w = new Date(d + 'T12:00:00').getDay(); hs.filter(h => +h.d === w).forEach(h => out.push({d, h:h.h})); }
  return out;
}
// Unidades do plano sobre as aulas reais: datas, aulas que cabem e aulas em espaços sem a matéria.
function planoReal(t, p) {
  const sl = slotsReais(t, p), pl = planOf(t, p); let i = 0;
  return {sl, us:pl.map(u => { const xs = sl.slice(i, i + u.n); i += u.n; return {u, ini:xs[0] && xs[0].d, fim:xs.length && xs[xs.length - 1].d, cabem:xs.length, fora:xs.filter(x => { const e = espOf(t, x.d); return e && !espPode(e, u.m); }).length, esp:[...new Set(xs.map(x => espOf(t, x.d)).filter(Boolean))]}; })};
}
function planoRealHtml(t, p) {
  const pl = planOf(t, p); if (!pl.length) return '';
  if (!(t.horario || []).some(h => h.h)) return `<p class="hint" style="margin:8px 0 0">Defina o horário da turma para a app contar as aulas reais (sem feriados nem interrupções).</p>`;
  const {sl, us} = planoReal(t, p), prev = pl.reduce((s, u) => s + u.n, 0), dt = d => fmtDate(d, {day:'numeric', month:'numeric'});
  const avisos = us.filter(x => x.cabem < x.u.n || x.fora).map(x => x.cabem < x.u.n ? `${x.u.m}: só cabem ${x.cabem} de ${x.u.n} aulas` : `${x.u.m}: ${x.fora} de ${x.cabem} aulas calham em espaço sem esta matéria`);
  return `<div class="pl-real"><p class="small" style="margin:8px 0 4px"><b>${sl.length} aulas reais</b> no ${perLabel(p, true)} (horário, sem feriados nem interrupções) · plano: ${prev}${prev > sl.length ? ` <span class="bad-t">(+${prev - sl.length})</span>` : ''}</p>
    <p class="small muted" style="margin:0">${us.filter(x => x.cabem).map(x => `${esc(x.u.m)} ${dt(x.ini)}–${dt(x.fim)}`).join(' · ')}</p>
    ${avisos.length ? `<div class="pl-av">${avisos.map(a => `<span>⚠ ${esc(a)}</span>`).join('')}</div>` : ''}</div>`;
}
// A rotação dos espaços passa a usar as aulas reais para dizer que unidade calha em cada semana.
const _semanasDe = semanasDe;
semanasDe = function (t, p) {
  const ws = _semanasDe(t, p); if (!(t.horario || []).some(h => h.h)) return ws;
  const {us} = planoReal(t, p);
  return ws.map(w => { const fimW = somaDias(w.mon, 6), u = us.find(x => x.ini && x.ini <= fimW && x.fim >= w.mon); const s = semAulas(w.mon) && semAulas(somaDias(w.mon, 4)); return Object.assign({}, w, {ud:u ? u.u.m : null, pausa:s ? s[2] : null}); });
};
function vCalEsc() {
  const L = CFG.semAulas || [], F = CFG.fimAno || {}, anos = [...new Set(Object.values(S.turmas).map(anoOf).filter(Boolean))].sort((x, y) => x - y);
  return `<div class="sec-h"><h2>Calendário escolar</h2></div><div class="card form">
    <p class="small" style="margin:0">Dias sem aulas (feriados, interrupções, visitas de estudo, dias da escola): contam para as aulas reais de cada período, para o plano e para a rotação dos espaços. Tudo é editável: altere as datas e os nomes diretamente.</p>
    <button class="btn${CFG.cal2627 ? '' : ' primary'}" data-a="cal-ofi">${CFG.cal2627 ? 'Repor as datas oficiais de 2026/27' : 'Preencher com o calendário oficial de 2026/27 (continente)'}</button>
    ${L.length ? `<div class="cal-l">${L.map((x, i) => `<div class="cal-r"><input type="text" data-in="cal-e" data-i="${i}" data-j="2" value="${esc(x[2])}" aria-label="Nome"><input type="date" data-in="cal-e" data-i="${i}" data-j="0" value="${esc(x[0])}" aria-label="Início"><input type="date" data-in="cal-e" data-i="${i}" data-j="1" value="${esc(x[1])}" aria-label="Fim"><button class="icon-btn" data-a="cal-rm" data-i="${i}" aria-label="Apagar">×</button></div>`).join('')}</div>` : ''}
    <div class="cal-r novo"><input type="text" id="cal-n" placeholder="Novo: ex. feriado municipal" aria-label="Nome"><input type="date" id="cal-i" aria-label="Início"><input type="date" id="cal-f" aria-label="Fim (opcional)"><button class="btn sm" data-a="cal-add">Juntar</button></div>
    <div class="field"><span class="lbl">Fim do último período por ano de escolaridade</span><p class="hint" style="margin:0 0 6px">Deixe em branco para usar a data geral do período.</p>
      <div class="cal-anos">${(anos.length ? anos : [5, 6, 7, 8, 9, 10, 11, 12]).map(a => `<label>${a}.º<input type="date" data-in="cal-fa" data-a="${a}" value="${esc(F[a] || '')}"></label>`).join('')}</div></div></div>`;
}
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'cal-e') { const r = CFG.semAulas[+el.dataset.i]; if (!r) return; const j = +el.dataset.j; if (j < 2 && !el.value) return; r[j] = el.value.trim() || 'Sem aulas'; if (r[1] < r[0]) r[1] = r[0]; CFG.semAulas.sort((a, b) => a[0].localeCompare(b[0])); Store.save('cfg', CFG); render(); }
  else if (k === 'cal-fa') { CFG.fimAno = CFG.fimAno || {}; if (el.value) CFG.fimAno[el.dataset.a] = el.value; else delete CFG.fimAno[el.dataset.a]; Store.save('cfg', CFG); } });
/* quem falta observar: alunos sem evidências numa matéria há várias aulas em que estiveram presentes */
function semObs(t, p, m, min) {
  const v = avalOf(t.id, p), aulas = aulasOf(t.id).filter(a => periodOf(a.data) === p && (a.materias || []).includes(m) && a.data <= today());
  const any = alunosOf(t).some(al => Object.keys(evMap(v, al.id, m)).length); if (!any) return [];
  return alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0).map(al => {
    const ev = evMap(v, al.id, m), last = Object.values(ev).flat().map(x => x[0]).sort().pop() || '';
    const n = aulas.filter(a => a.data > last && ['P', 'A', 'M', undefined].includes((a.presencas || {})[al.id])).length;
    return {al, n, last};
  }).filter(x => x.n >= (min || 4)).sort((a, b) => b.n - a.n);
}

/* sumários prontos a colar no programa da escola */
function sumTexto(t, alcance) {
  const all = aulasOf(t.id), seg0 = segunda(today()), num = {}; all.forEach((a, i) => num[a.id] = i + 1);
  const xs = all.filter(a => alcance === 'tudo' || (alcance === 'semana' ? a.data >= seg0 && a.data <= somaDias(seg0, 6) : periodOf(a.data) === UI.p));
  return {xs, txt:xs.map(a => `Lição n.º ${num[a.id]} (${fmtDate(a.data, {day:'2-digit', month:'2-digit', year:'numeric'})}): ${(a.sumario || '').trim() || '[sem sumário]'}`).join('\n')};
}
function sheetSum() {
  const t = turma(), al = UI.sumAl || 'periodo', {xs, txt} = sumTexto(t, al), falta = xs.filter(a => !(a.sumario || '').trim()).length;
  const body = `<div class="form"><div class="seg block">${[['semana', 'Esta semana'], ['periodo', perLabel(UI.p, true)], ['tudo', 'O ano todo']].map(([k, n]) => `<button data-a="sum-al" data-k="${k}" class="${al === k ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>
    ${falta ? `<p class="note warn" style="margin:0">${falta} ${falta === 1 ? 'aula sem sumário' : 'aulas sem sumário'} (marcadas com [sem sumário]).</p>` : ''}
    <textarea id="sum-txt" rows="12" readonly>${esc(txt)}</textarea><p class="hint" style="margin:0">${xs.length} ${xs.length === 1 ? 'lição' : 'lições'}, uma por linha, prontas a colar no programa da escola (Inovar, GIAE ou outro).</p></div>`;
  const foot = `<button class="btn primary" data-a="sum-copy"${xs.length ? '' : ' disabled'}>Copiar</button>`;
  if ($('#sheet').hidden) openSheet('Sumários · ' + t.nome, body, foot); else updSheet(body, foot);
}

/* fecho do período: o que falta, com atalho para cada coisa */
function fechoItens(t, p) {
  const als = alunosOf(t), rs = als.map(al => ({al, r:calc(t, p, al), R:REG[regAt(al, p)] || REG.Normal})), v = avalOf(t.id, p), ms = matsOf(t, p);
  const nivF = rs.filter(x => x.R.af > 0).reduce((s, x) => s + ms.filter(m => !lvOf(v, x.al.id, m)).length, 0);
  const aulas = aulasOf(t.id).filter(a => periodOf(a.data) === p), semSum = aulas.filter(a => !(a.sumario || '').trim()).length;
  const cons = consist(t, p).filter(x => x.k === 'warn').length, obs = als.filter(al => !((v.obs || {})[al.id] || '').trim()).length;
  return [
    {k:'mat', n:nivF, t:'Níveis das matérias', d:nivF ? `${nivF} ${nivF === 1 ? 'nível em falta' : 'níveis em falta'} (${ms.length} matérias)` : 'Todos os alunos têm nível em todas as matérias.'},
    {k:'fit', n:rs.filter(x => x.R.apf > 0 && x.r.APF == null).length, t:'Aptidão física (FITescola)', d:'alunos sem resultado'},
    {k:'con', n:rs.filter(x => x.r.CON == null).length, t:'Conhecimentos', d:'alunos sem classificação'},
    {k:'av', n:rs.filter(x => x.r.AV == null).length, t:'Atitudes', d:'alunos com atitudes por lançar'},
    {k:'cons', n:cons, t:'Situações a confirmar', d:'avisos da verificação de consistência'},
    {k:'sum', n:semSum, t:'Sumários', d:'aulas sem sumário'},
    {k:'obs', n:obs, t:'Observações para o relatório', d:'alunos sem observação (opcional)', opc:true}
  ];
}
function vFecho(t) {
  const p = UI.p, fim = fimPer(t, p), dias = fim ? diasAte(fim) : null, its = fechoItens(t, p), obr = its.filter(x => !x.opc), ok = obr.filter(x => !x.n).length;
  let h = `<div class="card fecho-h"><div class="sec-h" style="margin:0"><h2 style="font-size:18px">Fecho do ${esc(perLabel(p, true))}</h2>${dias != null ? `<span class="pill ${dias < 0 ? 'inc' : dias <= 7 ? 'bad' : 'ok'}">${dias < 0 ? 'Período terminado' : dias === 0 ? 'Termina hoje' : 'Faltam ' + dias + ' dias'}</span>` : ''}</div>
    <div class="pl-b big" role="img" aria-label="${ok} de ${obr.length} pontos completos"><i style="width:${ok / obr.length * 100}%"></i></div><p class="small muted num-t" style="margin:6px 0 0">${ok} de ${obr.length} pontos completos</p></div>
    <div class="list fecho">${its.map(x => `<div class="li"><span class="fe-i ${x.n ? (x.opc ? 'opc' : 'nx') : 'ok'}">${x.n ? (x.n > 99 ? '99+' : x.n) : '✓'}</span><span class="who col"><b>${esc(x.t)}</b><span class="small muted">${x.n ? (x.k === 'mat' ? esc(x.d) : x.n + ' ' + esc(x.d)) : 'Completo.'}</span></span>${x.n ? `<button class="btn sm" data-a="fe-go" data-k="${x.k}">Resolver</button>` : ''}</div>`).join('')}</div>
    <div class="sec-h"><h2>Documentos do fecho</h2></div><div class="docs">
    ${[['xlsx', 'Pauta, sumários e presenças (Excel)'], ['doc-rel-all', 'Relatórios para os encarregados de educação'], ['doc-rel-alunos', 'Relatórios para os alunos'], ['cons-open', 'Síntese para o conselho de turma']].map(([a, n]) => `<button class="card doc" data-a="${a}"><b>${n}</b></button>`).join('')}</div>`;
  return h;
}

Object.assign(A, {
  'cal-ofi': () => { CFG.per = clone(CAL2627.per); CFG.nper = 3; CFG.fimAno = clone(CAL2627.fimAno); const L = CFG.semAulas = CFG.semAulas || [];
    CAL2627.sem.forEach(x => { if (!L.some(y => y[0] === x[0] && y[1] === x[1])) L.push(x.slice()); }); L.sort((a, b) => a[0].localeCompare(b[0])); CFG.cal2627 = true; CFG.ano = '2026/2027';
    Store.save('cfg', CFG); render(); toast('Datas oficiais de 2026/27 preenchidas: pode alterá-las. Junte o feriado municipal.'); },
  'cal-add': () => { const i = $('#cal-i').value, f = $('#cal-f').value || i, n = $('#cal-n').value.trim() || 'Sem aulas'; if (!i) { toast('Indique a data.', 'bad'); return; }
    CFG.semAulas = CFG.semAulas || []; CFG.semAulas.push([i, f < i ? i : f, n]); CFG.semAulas.sort((a, b) => a[0].localeCompare(b[0])); Store.save('cfg', CFG); render(); },
  'cal-rm': el => { CFG.semAulas.splice(+el.dataset.i, 1); Store.save('cfg', CFG); render(); },
  'sum-open': () => sheetSum(),
  'sum-al': el => { UI.sumAl = el.dataset.k; sheetSum(); },
  'sum-copy': async () => { const ta = $('#sum-txt'); try { await navigator.clipboard.writeText(ta.value); toast('Sumários copiados: cole no programa da escola.'); } catch (e) { ta.removeAttribute('readonly'); ta.select(); try { document.execCommand('copy'); toast('Sumários copiados.'); } catch (e2) { toast('Selecione o texto e copie.', 'bad'); } ta.setAttribute('readonly', ''); } },
  'obs-falta': el => { const t = turma(), m = el.dataset.m, xs = semObs(t, UI.p, m); sheetObs(today(), [m]); if (xs[0]) { UI.obs.aid = xs[0].al.id; UI.obs.modo = 'aluno'; obsRender(); } },
  'fe-go': el => { const k = el.dataset.k, hide = {mat:{mat:false, fit:true, con:true, av:true}, fit:{mat:true, fit:false, con:true, av:true}, con:{mat:true, fit:true, con:false, av:true}, av:{mat:true, fit:true, con:true, av:false}}[k];
    if (hide) { UI.tab = 'avaliar'; UI.avMode = 'grelha'; FOCUS = null; SEL = null; UI.hide = hide; UI.todo = true; }
    else if (k === 'cons') { UI.tab = 'relatorios'; UI.pview = 'pauta'; }
    else if (k === 'sum') { sheetSum(); return; }
    else if (k === 'obs') { UI.tab = 'turma'; UI.tsub = 'alunos'; }
    render(); window.scrollTo(0, 0); }
});
