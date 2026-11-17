/* ---------- modo aula: antes, durante e depois ---------- */
// Um ecrã por fase da aula, com tudo gravado no momento (sem botão Guardar):
// Antes: plano, espaço, grupos, inclusão e o que ficou da aula anterior.
// Durante: presenças com um toque, observar competências, papéis e ferramentas.
// Depois: sumário escrito a partir do plano e reflexão rápida.
const MSTEP = [['antes', 'Antes'], ['durante', 'Durante'], ['depois', 'Depois']];
const PSCY = ['P', 'F', 'A', 'M', 'D'];
const PSL1 = {P:'presente', F:'falta', A:'atraso', M:'sem material', D:'dispensado'}, PSLN = {P:'presentes', F:'faltas', A:'atrasos', M:'sem material', D:'dispensados'};
function maulaAbrir(t, d) {
  let a = aulasOf(t.id).filter(x => x.data === d).pop();
  if (!a) { const pres = {}; (t.alunos || []).forEach(al => { const x = dispOn(al, d); pres[al.id] = x && x.tipo !== 'Apenas registo' ? 'D' : 'P'; });
    const u = udAtual(t, periodOf(d)); a = {id:uid(), turmaId:t.id, data:d, c:Date.now(), materias:u ? [u] : [], sumario:'', presencas:pres}; S.aulas[a.id] = a; Store.save('aulas', a); }
  UI.maula = a.id; UI.mstep = UI.mstep && UI.maulaPrev === a.id ? UI.mstep : 'antes'; UI.maulaPrev = a.id;
  UI.tab = 'turma'; UI.tsub = 'aula'; UI.p = periodOf(d); FOCUS = null; SEL = null; render(); window.scrollTo(0, 0);
}
const maSave = a => { S.aulas[a.id] = a; Store.save('aulas', a); };
function sumDoPlano(a) {
  const P = a.plano; if (!P) return '';
  const by = {}; (P.pf || []).filter(x => x.nome).forEach(x => (by[x.m || 'Aula'] = by[x.m || 'Aula'] || []).push(x.nome.charAt(0).toLowerCase() + x.nome.slice(1)));
  if (P.dif && P.dif.m) Object.values(P.dif.g || {}).map(exById).filter(Boolean).forEach(x => (by[x.m] = by[x.m] || []).push(x.nome.charAt(0).toLowerCase() + x.nome.slice(1)));
  return Object.entries(by).map(([m, xs]) => `${m}: ${[...new Set(xs)].join('; ')}.`).join(' ');
}
function vModoAula(t) {
  const a = S.aulas[UI.maula]; if (!a || a.turmaId !== t.id) { UI.tsub = 'aulas'; return vTurma(t); }
  a.materias = a.materias || []; a.presencas = a.presencas || {};
  const all = aulasOf(t.id), n = all.findIndex(x => x.id === a.id) + 1, es = espOf(t, a.data), ud = udInfo(t, a), hora = ((t.horario || []).find(h => +h.d === new Date(a.data + 'T12:00:00').getDay()) || {}).h;
  const st = UI.mstep || 'antes';
  let h = `<div class="stack maula"><div class="ma-h"><button class="link" data-a="ma-sair">‹ Aulas</button><div><span class="eyebrow">Lição ${n} · ${esc(fmtDate(a.data, {weekday:'long', day:'numeric', month:'long'}))}${hora ? ' · ' + esc(hora) : ''}</span>
    <h1>${a.materias.length ? a.materias.map(m => subIcon(m, anoOf(t)) + esc(m)).join(' · ') : 'Aula sem matéria'}</h1><span class="small muted">${[es && 'Espaço: ' + es, ...ud].filter(Boolean).map(esc).join(' · ')}</span></div></div>
    <div class="seg block ma-st" role="tablist">${MSTEP.map(([k, nm], i) => `<button role="tab" data-a="ma-st" data-k="${k}" class="${st === k ? 'on' : ''}" aria-selected="${st === k}"><b>${i + 1}</b> ${nm}</button>`).join('')}</div>`;
  if (st === 'antes') {
    const P = a.plano;
    h += reflAnterior(t, a) + apoioHtml(t, a);
    if (!a.materias.length) h += `<div class="card"><b>Matérias da aula</b>${matChips(t, m => `<button class="chip" data-a="ma-mat" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`)}</div>`;
    if (P && ((P.pf || []).length || P.aq.txt || P.dif)) {
      h += `<div class="card ma-plano"><div class="sec-h" style="margin:0"><b>Plano da aula</b><span class="small muted num-t">${(+P.aq.min || 0) + (+P.rc.min || 0) + (P.pf || []).reduce((s, x) => s + (+x.min || 0), 0)} min</span></div>
        ${P.aq.txt ? `<div class="ma-p"><span>Aquecimento · ${P.aq.min} min</span><p>${esc(P.aq.txt)}</p></div>` : ''}
        ${(P.pf || []).map(x => `<div class="ma-p"><span>${esc(x.m || '')}${x.lv ? ' · ' + x.lv : ''} · ${x.min} min</span><p><b>${esc(x.nome)}</b>${x.crit ? `<br><span class="small muted">Critérios: ${esc(x.crit)}</span>` : ''}</p></div>`).join('')}
        ${P.dif && P.dif.m ? (() => { const {g} = difGrupos(t, a, P.dif.m); return `<div class="dif">${['I', 'E', 'A'].filter(k => g[k].length).map(k => { const ex = exById((P.dif.g || {})[k]); return `<div class="dif-g ${AIG[k]}"><b>${DGN[k]} (${g[k].length})</b><div class="dif-n">${g[k].map(al => `<span>${esc(nome2(al.nome))}</span>`).join('')}</div>${ex ? `<p class="small" style="margin:0"><b>${esc(ex.nome)}</b> · ${esc(ex.crit || '')}</p>` : '<p class="small muted" style="margin:0">Tarefa por escolher.</p>'}</div>`; }).join('')}</div>`; })() : ''}
        ${P.rc.txt ? `<div class="ma-p"><span>Retorno à calma · ${P.rc.min} min</span><p>${esc(P.rc.txt)}</p></div>` : ''}</div>`;
    } else h += `<div class="card empty"><h3>Ainda sem plano</h3><p>Prepare o aquecimento, os exercícios (ou estações por nível) e o retorno à calma.</p></div>`;
    h += `<div class="btn-row"><button class="btn" data-a="ma-edit">${P ? 'Editar o plano e a aula' : 'Preparar o plano'}</button><button class="btn primary" data-a="ma-st" data-k="durante">Começar a aula ›</button></div>`;
  } else if (st === 'durante') {
    const als = alunosOf(t), c = {}; PSCY.forEach(k => c[k] = 0); als.forEach(al => c[a.presencas[al.id] || 'P']++);
    h += `<div class="btn-row ma-ac"><button class="btn primary" data-a="ma-obs">Observar competências</button><button class="btn" data-a="tools">Cronómetro, equipas e sorteio</button><button class="btn" data-a="proj">Projetar no quadro</button><button class="btn${UI.pav ? ' on' : ''}" data-a="pav-t">${UI.pav ? 'Sair do modo pavilhão' : 'Modo pavilhão'}</button></div>
      <div class="sec-h"><h2>Presenças</h2><span class="small muted">${PSCY.filter(k => c[k]).map(k => `${c[k]} ${(c[k] === 1 ? PSL1 : PSLN)[k]}`).join(' · ')} · <button class="link" data-a="ma-allp">Todos presentes</button></span></div>
      <p class="hint" style="margin:-4px 0 0">Toque no aluno para mudar: presente → falta → atraso → sem material → dispensado.</p>
      <div class="ma-ps">${als.map(al => { const s = a.presencas[al.id] || 'P'; return `<button class="ma-pr ps-${s}" data-a="ma-ps" data-aid="${esc(al.id)}">${avatar(al, 'sm')}<span>${esc(nome2(al.nome))}</span><b>${s === 'P' ? '' : s}</b></button>`; }).join('')}</div>
      ${papeisAulaHtml(a)}
      <div class="btn-row"><button class="btn primary" data-a="ma-st" data-k="depois">Terminar a aula ›</button></div>`;
  } else {
    if (!a.sumario) { const s = sumDoPlano(a); if (s) { a.sumario = s; maSave(a); } }
    const R = a.refl || {};
    h += `<div class="card form"><div class="field"><label for="ma-sum">Sumário</label><textarea id="ma-sum" data-in="ma-sum" rows="3" placeholder="Ex.: Voleibol: passe e manchete em 2x2.">${esc(a.sumario || '')}</textarea>
      <div class="sug">${[...a.materias.flatMap(m => SUMB[m] || []).slice(0, 4), ...SUMG.slice(0, 3)].map(x => `<button data-a="ma-sug" data-t="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <span class="hint">${a.plano ? 'Escrito a partir do plano: pode ajustar.' : ''}</span></div></div>
      <div class="card form"><b>Reflexão (30 segundos)</b>
      <div class="field"><label for="ma-ok">O que resultou?</label><textarea id="ma-ok" data-in="ma-rf" data-k="ok" rows="2">${esc(R.ok || '')}</textarea></div>
      <div class="field"><span class="lbl">Tempo em atividade motora</span><div class="seg block">${[30, 50, 70, 90].map(x => `<button data-a="ma-act" data-v="${x}" class="${R.act === x ? 'on' : ''}">${x < 90 ? '≈' + x : '≥90'}%</button>`).join('')}</div></div>
      <div class="field"><label for="ma-mud">O que mudo na próxima aula?</label><textarea id="ma-mud" data-in="ma-rf" data-k="mud" rows="2" placeholder="Aparece no início da próxima aula desta matéria.">${esc(R.mud || '')}</textarea></div></div>
      <div class="btn-row"><button class="btn" data-a="ma-aval">Avaliar nesta aula (níveis e +/−)</button><button class="btn primary" data-a="ma-sair">Concluir</button></div>`;
  }
  return h + '</div>';
}
Object.assign(A, {
  'hoje-go': el => { UI.turma = el.dataset.id; maulaAbrir(turma(), today()); },
  'ma-abrir': el => { const a = S.aulas[el.dataset.id]; if (!a) return; UI.turma = a.turmaId; maulaAbrir(turma(), a.data); },
  'pav-t': () => { UI.pav = !UI.pav; render(); },
  'ma-st': el => { UI.mstep = el.dataset.k; render(); window.scrollTo(0, 0); },
  'ma-sair': () => { UI.tsub = 'aulas'; UI.maula = null; render(); window.scrollTo(0, 0); },
  'ma-mat': el => { const a = S.aulas[UI.maula]; a.materias.push(el.dataset.m); maSave(a); render(); },
  'ma-ps': el => { const a = S.aulas[UI.maula], k = el.dataset.aid, s = a.presencas[k] || 'P'; a.presencas[k] = PSCY[(PSCY.indexOf(s) + 1) % PSCY.length]; maSave(a); render(); },
  'ma-allp': () => { const a = S.aulas[UI.maula]; alunosOf(turma()).forEach(al => { if (a.presencas[al.id] !== 'D') a.presencas[al.id] = 'P'; }); maSave(a); render(); },
  'ma-obs': () => { const a = S.aulas[UI.maula]; sheetObs(a.data, a.materias); },
  'ma-edit': () => { const a = S.aulas[UI.maula]; sheetAula(clone(a)); },
  'ma-aval': () => { FOCUS = UI.maula; SEL = null; UI.tab = 'avaliar'; UI.avMode = 'grelha'; render(); window.scrollTo(0, 0); },
  'ma-sug': el => { const a = S.aulas[UI.maula], ta = $('#ma-sum'); a.sumario = (ta.value.trim() ? ta.value.trim() + ' ' : '') + el.dataset.t; ta.value = a.sumario; maSave(a); },
  'ma-act': el => { const a = S.aulas[UI.maula], R = a.refl = a.refl || {}, x = +el.dataset.v; R.act = R.act === x ? null : x; maSave(a); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === R.act)); }
});
// Papéis no modo aula: a mesma caixa da folha, mas grava logo.
const _ppAdd = A['pp-add'], _ppRm = A['pp-rm'];
A['pp-add'] = el => { if (UI.tsub === 'aula' && $('#sheet').hidden) { const a = S.aulas[UI.maula]; a.papeis = a.papeis || []; a.papeis.push([$('#pp-a').value, $('#pp-p').value]); maSave(a); render(); } else _ppAdd(el); };
A['pp-rm'] = el => { if (UI.tsub === 'aula' && $('#sheet').hidden) { const a = S.aulas[UI.maula]; a.papeis.splice(+el.dataset.i, 1); maSave(a); render(); } else _ppRm(el); };
// Depois de guardar na folha, volta ao modo aula se foi de lá que se abriu.
const _aulaSave = A['aula-save'];
A['aula-save'] = quiet => { const back = UI.tsub === 'aula'; const d = _aulaSave(quiet === true); if (back && d) { UI.maula = d.id; UI.tsub = 'aula'; render(); } return d; };
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset && el.dataset.in; if (!k || !UI.maula) return; const a = S.aulas[UI.maula]; if (!a) return;
  if (k === 'ma-sum') { a.sumario = el.value; maSave(a); }
  else if (k === 'ma-rf') { const R = a.refl = a.refl || {}; R[el.dataset.k] = el.value; maSave(a); }
});
