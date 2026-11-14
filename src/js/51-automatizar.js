/* ---------- tirar trabalho ao professor ---------- */
// 1) aulas em falta criadas a partir do horário; 2) avaliar vários alunos de uma vez; 3) o mesmo plano para as turmas
// do mesmo ano; 4) níveis em falta propostos no fecho; 5) observações do relatório escritas a partir dos dados.

/* 1. aulas do horário que ainda não foram registadas (até hoje) */
function aulasEmFalta(t) {
  const desde = (aulasOf(t.id)[0] || {}).data || (CFG.per[0] || {}).ini, hoje = today(), out = [];
  for (let p = 1; p <= CFG.nper; p++) {
    const porDia = {}; slotsReais(t, p).forEach(s => { if (s.d >= desde && s.d <= hoje) porDia[s.d] = (porDia[s.d] || 0) + 1; });
    Object.entries(porDia).forEach(([d, n]) => { const tem = aulasOf(t.id).filter(a => a.data === d).length; for (let i = tem; i < n; i++) out.push(d); });
  }
  return out;
}
function udNoDia(t, d) { const {us} = planoReal(t, periodOf(d)), u = us.find(x => x.ini && x.ini <= d && x.fim >= d); return u ? u.u.m : udAtual(t, periodOf(d)); }
function sheetAulasFalta() {
  const t = turma(), xs = aulasEmFalta(t); UI.afSel = UI.afSel && UI.afSel.t === t.id ? UI.afSel : {t:t.id, off:{}};
  const body = `<div class="form"><p class="hint" style="margin:0">Aulas do horário de ${esc(t.nome)} ainda não registadas (sem feriados nem interrupções). São criadas com todos presentes (as dispensas ficam com D), a matéria da unidade prevista e o plano, se houver. Depois só corrige as exceções.</p>
    ${xs.length ? `<div class="list">${xs.map((d, i) => { const m = udNoDia(t, d); return `<label class="li cli"><input type="checkbox" data-in="af-sel" data-k="${d}#${i}"${UI.afSel.off[d + '#' + i] ? '' : ' checked'}> <span class="who"><b>${esc(fmtDate(d, {weekday:'long', day:'numeric', month:'long'}))}</b><span class="small muted">${m ? esc(m) : 'sem unidade prevista'}</span></span></label>`; }).join('')}</div>` : '<p>Não há aulas em falta.</p>'}</div>`;
  openSheet('Aulas por registar', body, xs.length ? `<button class="btn primary" data-a="af-go">Registar as aulas selecionadas</button>` : '');
}
function criarAula(t, d, base) {
  const pres = {}; (t.alunos || []).forEach(al => { const x = dispOn(al, d); pres[al.id] = x && x.tipo !== 'Apenas registo' ? 'D' : 'P'; });
  const m = udNoDia(t, d), a = {id:uid(), turmaId:t.id, data:d, c:Date.now(), materias:base ? base.materias.slice() : m ? [m] : [], sumario:'', presencas:pres, auto:true};
  if (base && base.plano) a.plano = clone(base.plano);
  if (a.plano) a.sumario = sumDoPlano(a);
  S.aulas[a.id] = a; Store.save('aulas', a); return a;
}

/* 2. vários alunos de uma vez (folha Observar) */
function obsGrupoHtml(t, O, p, v, als) {
  O.sel = (O.sel || []).filter(id => als.some(al => al.id === id));
  const grp = k => als.filter(al => { const l = (lvOf(v, al.id, O.m) || {}).l || aiLv(t, al.id, O.m); return l && DG[l] === k; }).map(al => al.id);
  let b = `<p class="hint" style="margin:0">Escolha os alunos e marque as competências que todos já dominam. Cada aluno fica com o seu nível calculado. Depois afine os casos diferentes em "Por aluno".</p>
    <div class="chips">${[['todos', 'Todos'], ['I', 'Grupo Introdução'], ['E', 'Grupo Elementar'], ['A', 'Grupo Avançado'], ['nenhum', 'Nenhum']].map(([k, n]) => `<button class="chip" data-a="og-sel" data-k="${k}"${['I', 'E', 'A'].includes(k) && !grp(k).length ? ' disabled' : ''}>${n}</button>`).join('')}</div>
    <div class="og-als">${als.map(al => `<button class="og-al${O.sel.includes(al.id) ? ' on' : ''}" data-a="og-al" data-id="${esc(al.id)}">${esc(nome2(al.nome))}</button>`).join('')}</div>`;
  if (!O.sel.length) return b + '<p class="note warn">Escolha pelo menos um aluno.</p>';
  const cnt = {}; O.sel.forEach(aid => Object.entries(tksOf(v, aid, O.m) || {}).forEach(([c, x]) => { if (x) cnt[c] = (cnt[c] || 0) + 1; }));
  const all = Object.fromEntries(Object.entries(cnt).filter(([, n]) => n === O.sel.length).map(([c]) => [c, true]));
  return b + `<div class="cl obs-cl">${checkList(t.ciclo, O.m, all, null, 'obs-tk', 'obs-all', cnt, O.sel.length)}</div>`;
}

/* 3. o mesmo plano para as turmas do mesmo ano */
const turmasAno = t => Object.values(S.turmas).filter(x => x.id !== t.id && anoOf(x) === anoOf(t) && x.ciclo === t.ciclo).sort(byNome);
function proxAulaLivre(t) { for (let p = periodOf(today()); p <= CFG.nper; p++) { const s = slotsReais(t, p).find(x => x.d >= today() && !aulasOf(t.id).some(a => a.data === x.d && a.plano)); if (s) return s.d; } return null; }
function sheetPartPlano(tipo) {
  const t = turma(), ts = turmasAno(t); UI.ppSel = {tipo, ids:ts.map(x => x.id)};
  const quem = tipo === 'periodo' ? `o plano do ${perLabel(UI.p, true)}` : 'este plano de aula';
  const body = `<div class="form"><p class="hint" style="margin:0">Aplicar ${quem} às outras turmas do ${anoOf(t)}.º ano. ${tipo === 'periodo' ? 'As datas, as aulas reais e os espaços de cada turma são calculados pelo horário e pela rotação de cada uma. Substitui o plano do período que lá estiver.' : 'Fica na próxima aula de cada turma (pelo horário) que ainda não tenha plano; se essa aula não existir, é criada.'}</p>
    ${ts.length ? ts.map(x => { const nx = tipo === 'aula' ? proxAulaLivre(x) : null; return `<label class="cli"><input type="checkbox" data-in="pp-sel" data-id="${esc(x.id)}" checked> <span><b>${esc(x.nome)}</b>${tipo === 'aula' ? ` <span class="small muted">${nx ? 'próxima aula: ' + esc(fmtDate(nx, {weekday:'short', day:'numeric', month:'short'})) : 'sem horário definido'}</span>` : planOf(x, UI.p).length ? ' <span class="small muted">já tem plano: será substituído</span>' : ''}</span></label>`; }).join('') : `<p>Não há outras turmas do ${anoOf(t)}.º ano.</p>`}</div>`;
  openSheet('Usar noutras turmas', body, ts.length ? `<button class="btn primary" data-a="pp-go">Aplicar</button>` : '');
}

/* 4. níveis em falta propostos: evidências e competências, avaliação inicial ou período anterior */
function propostaNivel(t, p, al, m) {
  const v = avalOf(t.id, p), tk = Object.assign({}, tksOf(v, al.id, m) || {}), ev = evMap(v, al.id, m);
  Object.keys(ev).forEach(c => { if (evState(ev[c]) === 'dom') tk[c] = true; });
  if (Object.values(tk).some(Boolean) && compsOf(t.ciclo, m).length) return {l:lvFromTicks(t.ciclo, m, tk), fonte:'competências assinaladas e evidências'};
  if (p > 1) { const x = lvOf(avalOf(t.id, p - 1), al.id, m); if (x) return {l:x.l, fonte:perLabel(p - 1, true)}; }
  const ai = aiLv(t, al.id, m); if (ai) return {l:ai, fonte:'avaliação inicial'};
  return {l:null, fonte:'sem dados'};
}
function sheetPropostas() {
  const t = turma(), p = UI.p, v = avalOf(t.id, p), ms = matsOf(t, p), rows = [];
  alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0).forEach(al => ms.forEach(m => { if (!lvOf(v, al.id, m)) rows.push({al, m, pr:propostaNivel(t, p, al, m)}); }));
  rows.sort((a, b) => (b.pr.l ? 1 : 0) - (a.pr.l ? 1 : 0));
  UI.prop = rows.map(r => ({aid:r.al.id, m:r.m, l:r.pr.l}));
  const body = `<div class="form"><p class="hint" style="margin:0">Para cada nível em falta, a proposta vem das competências e evidências registadas, do período anterior ou da avaliação inicial. Reveja e altere antes de aceitar; as linhas sem proposta ficam por preencher.</p>
    ${rows.length ? `<div class="tbl-wrap"><table class="prop-t"><thead><tr><th class="l">Aluno</th><th class="l">Matéria</th><th>Proposta</th><th class="l">De onde vem</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="l">${esc(nome2(r.al.nome))}</td><td class="l">${esc(r.m)}</td><td><select data-in="prop" data-i="${i}" aria-label="Nível de ${esc(r.al.nome)} em ${esc(r.m)}"><option value="">—</option>${LV.map(l => `<option${r.pr.l === l ? ' selected' : ''}>${l}</option>`).join('')}</select></td><td class="l small muted">${esc(r.pr.fonte)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Não há níveis em falta.</p>'}</div>`;
  openSheet('Níveis em falta · ' + perLabel(p, true), body, rows.length ? `<button class="btn primary" data-a="prop-go">Aceitar as propostas</button>` : '');
}

/* 5. observação do relatório escrita a partir dos dados do período */
function obsAuto(t, p, al) {
  const r = calc(t, p, al), v = avalOf(t.id, p), f = al.sexo === 'F', o = (m, fm) => f ? fm : m, nome = al.nome.split(' ')[0], fr = [];
  if (r.c.F === 0 && r.c.A <= 1) fr.push(`${nome} foi ${o('assíduo', 'assídua')} e ${o('pontual', 'pontual')}${r.c.M ? '' : ' e trouxe sempre o material'}.`);
  else if (r.c.F >= 3) fr.push(`${nome} faltou a ${r.c.F} aulas, o que condicionou a sua evolução.`);
  else fr.push(`${nome} teve ${r.c.F ? r.c.F + (r.c.F === 1 ? ' falta' : ' faltas') : 'uma assiduidade regular'}${r.c.A ? ' e ' + r.c.A + (r.c.A === 1 ? ' atraso' : ' atrasos') : ''}.`);
  const lv = Object.entries(r.lv), bons = lv.filter(([, l]) => LVI(l) >= LVI('E')).map(([m]) => m), med = lv.filter(([, l]) => LVI(l) >= LVI('I') && LVI(l) < LVI('E')).map(([m]) => m), fracos = lv.filter(([, l]) => LVI(l) < LVI('I')).map(([m]) => m);
  const lista = xs => xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0];
  if (bons.length) fr.push(`Revela bom desempenho em ${lista(bons)}.`);
  if (med.length) fr.push(`Em ${lista(med)} já cumpre o nível Introdução e está a progredir.`);
  if (fracos.length) fr.push(`Em ${lista(fracos)} ainda não atingiu o nível Introdução.`);
  const alvo = [...fracos, ...med, ...bons].map(m => ({m, d:desafioPlus(t, p, al, m)})).find(x => x.d && x.d.alvo);
  if (alvo) fr.push(`Próximo passo em ${alvo.m}: ${alvo.d.alvo.charAt(0).toLowerCase() + alvo.d.alvo.slice(1)}`);
  if (r.apfOn) { const fora = FIT.filter(x => r.zones[x.k] === 0).map(x => x.n.toLowerCase()), tem = FIT.some(x => r.zones[x.k] != null);
    if (tem && !fora.length) fr.push('Encontra-se na Zona Saudável nos testes de aptidão física realizados.');
    else if (fora.length) fr.push(`Deve melhorar a aptidão física (${lista(fora)})${pfitOf(t, al) ? ', seguindo o plano individual de treino que lhe foi entregue' : ''}.`); }
  const pp = papeisDe(t, p, al.id); if (Object.keys(pp).length) fr.push(`Desempenhou com responsabilidade o papel de ${lista(Object.keys(pp).map(x => x.toLowerCase()))}.`);
  if (r.AV != null) fr.push(r.AV >= 15.5 ? `Mostra empenho, respeito pelas regras e pelos colegas.` : r.AV >= 11.5 ? `Deve manter o empenho e a cooperação nas aulas.` : `Precisa de melhorar o empenho e o cumprimento das regras.`);
  return fr.join(' ').replace(/\.\./g, '.');
}

Object.assign(A, {
  'af-open': () => sheetAulasFalta(),
  'af-go': () => { const t = turma(), xs = aulasEmFalta(t); let n = 0; xs.forEach((d, i) => { if (!UI.afSel.off[d + '#' + i]) { criarAula(t, d); n++; } }); closeSheet(); render(); toast(`${n} ${n === 1 ? 'aula registada' : 'aulas registadas'}: corrija só as faltas e os sumários.`); },
  'og-al': el => { const O = UI.obs, id = el.dataset.id, i = (O.sel = O.sel || []).indexOf(id); i >= 0 ? O.sel.splice(i, 1) : O.sel.push(id); obsRender(); },
  'og-sel': el => { const t = turma(), O = UI.obs, p = periodOf(O.d), v = avalOf(t.id, p), als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0), k = el.dataset.k;
    O.sel = k === 'todos' ? als.map(a => a.id) : k === 'nenhum' ? [] : als.filter(al => { const l = (lvOf(v, al.id, O.m) || {}).l || aiLv(t, al.id, O.m); return l && DG[l] === k; }).map(a => a.id); obsRender(); },
  'pp-per': () => sheetPartPlano('periodo'),
  'pp-aula': () => { const a = A['aula-save'](true); if (!a) return; UI.ppAula = a.id; sheetPartPlano('aula'); },
  'pp-go': () => { const t = turma(), ids = [...document.querySelectorAll('#sheet [data-in="pp-sel"]')].filter(x => x.checked).map(x => x.dataset.id); let n = 0;
    ids.forEach(id => { const x = S.turmas[id];
      if (UI.ppSel.tipo === 'periodo') { x.plano = x.plano || {}; x.plano[UI.p] = clone(planOf(t, UI.p)); Store.save('turmas', x); n++; }
      else { const base = S.aulas[UI.ppAula], d = proxAulaLivre(x); if (!base || !d) return; const ex = aulasOf(x.id).find(a => a.data === d);
        if (ex) { ex.plano = clone(base.plano || null); ex.materias = base.materias.slice(); if (!ex.sumario) ex.sumario = sumDoPlano(ex); S.aulas[ex.id] = ex; Store.save('aulas', ex); } else criarAula(x, d, base); n++; } });
    closeSheet(); render(); toast(n ? `Aplicado a ${n} ${n === 1 ? 'turma' : 'turmas'}.` : 'Nada aplicado.'); },
  'prop-open': () => sheetPropostas(),
  'prop-go': () => { const t = turma(), v = avalOf(t.id, UI.p); let n = 0; v.af = v.af || {};
    (UI.prop || []).forEach(x => { if (x.l) { v.af[x.aid] = v.af[x.aid] || {}; v.af[x.aid][x.m] = x.l; n++; } }); touchAval(v); closeSheet(); render(); toast(`${n} ${n === 1 ? 'nível lançado' : 'níveis lançados'}.`); },
  'obs-auto': el => { const t = turma(), al = alunosOf(t).find(x => x.id === el.dataset.id), ta = $('#a-relobs'); if (!al || !ta) return;
    if (ta.value.trim() && !armed(el, 'Substituir o texto?')) return; ta.value = obsAuto(t, UI.p, al); ta.dispatchEvent(new Event('change', {bubbles:true})); },
  'obs-auto-all': () => { const t = turma(), v = avalOf(t.id, UI.p); v.obs = v.obs || {}; let n = 0;
    alunosOf(t).forEach(al => { if (!(v.obs[al.id] || '').trim()) { v.obs[al.id] = obsAuto(t, UI.p, al); n++; } }); touchAval(v); render(); toast(`${n} ${n === 1 ? 'observação escrita' : 'observações escritas'}: reveja-as na ficha de cada aluno.`); }
});
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'af-sel') { UI.afSel.off[el.dataset.k] = !el.checked; }
  else if (k === 'prop') { const x = (UI.prop || [])[+el.dataset.i]; if (x) x.l = el.value || null; } });
