/* ---------- acompanhamento pedagógico ---------- */
// Aptidão física com plano individual, medidas de suporte (DL 54/2018), papéis na aula, reflexão depois da aula,
// balanço de cada unidade didática e equidade entre grupos de alunos.

/* 1. plano individual de aptidão física para quem está fora da Zona Saudável */
const FITP = {
  vaivem:{cap:'Resistência aeróbia', aula:['Corrida contínua de 15 a 25 minutos a um ritmo em que ainda consegue falar.', 'Treino intervalado: 6 × (1 minuto rápido + 1 minuto lento).', 'Jogos de corrida no recreio (apanhada, futebol, basquetebol).'], casa:'Caminhar depressa ou correr 30 minutos, 3 dias por semana; ir a pé ou de bicicleta para a escola sempre que possível.'},
  ombros:{cap:'Flexibilidade dos ombros', aula:['Círculos de braços e alongamento com toalha atrás das costas, 3 × 30 segundos.', 'Alongamento do peitoral junto à parede, 3 × 30 segundos de cada lado.'], casa:'Alongar os ombros todos os dias depois do banho, 5 minutos.'},
  senta:{cap:'Flexibilidade dos membros inferiores', aula:['Alongamento dos músculos posteriores da coxa sentado, 3 × 30 segundos de cada perna.', 'Flexão do tronco à frente com pernas estendidas, sem balanços.'], casa:'5 minutos de alongamentos por dia, de preferência depois de exercício.'},
  abd:{cap:'Força e resistência abdominal', aula:['Prancha de antebraços: 3 × 20 a 40 segundos.', 'Abdominais ao ritmo do teste: 3 séries de 10 a 15.', 'Prancha lateral: 2 × 20 segundos de cada lado.'], casa:'Circuito de 10 minutos, 3 vezes por semana: prancha, abdominais e "superman".'},
  flex:{cap:'Força dos membros superiores', aula:['Flexões de braços inclinadas (mãos num banco) ou com joelhos apoiados: 3 × 8 a 12.', 'Suspensões na barra ou no espaldar: 3 × 10 a 20 segundos.'], casa:'Flexões na parede ou com joelhos apoiados, 3 séries, 3 vezes por semana.'},
  vel:{cap:'Velocidade', aula:['Arranques de 5 × 20 metros com recuperação completa.', 'Skippings e corrida com joelhos altos, 3 × 15 metros.'], casa:'Jogos de perseguição e pequenas corridas rápidas, 2 vezes por semana.'},
  agil:{cap:'Agilidade', aula:['Percursos com cones e mudanças de direção, 4 a 6 repetições.', 'Escada de agilidade ou marcas no chão: apoios rápidos.'], casa:'Saltar à corda 5 minutos por dia.'},
  imp:{cap:'Força dos membros inferiores', aula:['Saltos a pés juntos para a frente, 3 × 6.', 'Agachamentos: 3 × 12.', 'Saltos à corda: 3 × 30 segundos.'], casa:'Subir escadas a correr e saltar à corda, 3 vezes por semana.'}
};
const fitVal = (t, p, aid, k) => (((avalOf(t.id, p).fit || {})[aid]) || {})[k];
function foraZS(t, p, al) { const r = calc(t, p, al); return FIT.filter(f => r.zones[f.k] === 0).map(f => f.k); }
function pfitOf(t, al) { for (let p = UI.p; p >= 1; p--) { const x = (avalOf(t.id, p).pfit || {})[al.id]; if (x) return Object.assign({p}, x); } return null; }
function pfitCriar(t, al) {
  const ks = foraZS(t, UI.p, al); if (!ks.length) return false; const v = avalOf(t.id, UI.p); v.pfit = v.pfit || {};
  v.pfit[al.id] = {d:today(), rt:somaDias(today(), 42), ks, base:Object.fromEntries(ks.map(k => [k, fitVal(t, UI.p, al.id, k)]))}; touchAval(v); return true;
}
function pfitHtml(t, al, print) {
  const P = pfitOf(t, al); if (!P) return '';
  const age = ageAt(al.nasc, refDate(UI.p)), last = k => { for (let p = CFG.nper; p >= P.p; p--) { const x = fitVal(t, p, al.id, k); if (x != null && x !== '') return {x, p}; } return null; };
  return `<div class="${print ? 'pfit-p' : 'card pfit'}"><div class="pfit-h"><b>Plano individual de aptidão física</b><span class="small muted">desde ${esc(fmtDate(P.d, {day:'numeric', month:'short'}))} · novo teste a ${esc(fmtDate(P.rt, {day:'numeric', month:'long'}))}</span></div>
    ${P.ks.map(k => { const f = FIT.find(x => x.k === k), pl = FITP[k], ref = f.bool ? null : fitRef(k, al.sexo, age), l = last(k), b = P.base[k];
      const meta = f.bool ? 'conseguir realizar o teste' : ref ? `${f.dir > 0 ? 'pelo menos' : 'no máximo'} ${String(ref.zs).replace('.', ',')} ${f.u}` : 'entrar na Zona Saudável';
      const prog = l && b != null && b !== '' && l.x !== b ? ` · <span class="${(l.x - b) * (f.dir || 1) > 0 ? 'ok-t' : 'bad-t'}">agora ${esc(String(l.x))} ${esc(f.u)} (${perLabel(l.p)})</span>` : '';
      return `<div class="pfit-k"><div><b>${esc(pl.cap)}</b> <span class="small muted">· ${esc(f.n)}: ${b != null && b !== '' ? esc(String(b)) + ' ' + esc(f.u) : '—'}${prog} · meta: ${esc(meta)}</span></div><ul>${pl.aula.map(x => `<li>${esc(x)}</li>`).join('')}<li><i>Em casa:</i> ${esc(pl.casa)}</li></ul></div>`; }).join('')}
    ${print ? '' : `<div class="btn-row"><button class="btn sm" data-a="pfit-print" data-id="${esc(al.id)}">Imprimir para o aluno</button><button class="btn sm ghost" data-a="pfit-del" data-id="${esc(al.id)}">Terminar o plano</button></div>`}</div>`;
}
function vAptidao(t) {
  const als = alunosOf(t).filter(al => (REG[regAt(al, UI.p)] || REG.Normal).apf > 0), rows = als.map(al => ({al, ks:foraZS(t, UI.p, al), P:pfitOf(t, al)})).filter(x => x.ks.length || x.P);
  let h = `<div class="card"><b>Aptidão física · planos individuais</b><p class="hint" style="margin:4px 0 0">Os alunos fora da Zona Saudável num ou mais testes do FITescola recebem um plano curto (na aula e em casa), uma meta e a data do novo teste, seis semanas depois. O progresso aparece quando o teste é repetido.</p></div>`;
  if (!rows.length) return h + emptyCard('Ninguém fora da Zona Saudável', 'Quando houver resultados do FITescola abaixo da Zona Saudável, os alunos aparecem aqui.');
  const sem = rows.filter(x => x.ks.length && !x.P);
  h += `<div class="btn-row">${sem.length ? `<button class="btn primary" data-a="pfit-all">Criar planos para ${sem.length} ${sem.length === 1 ? 'aluno' : 'alunos'}</button>` : ''}<button class="btn" data-a="pfit-print-all">Imprimir os planos</button></div>`;
  h += `<div class="list">${rows.map(({al, ks, P}) => `<div class="li"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="who col"><span class="nm">${esc(al.nome)}</span><span class="small muted">${ks.map(k => esc(FIT.find(f => f.k === k).n)).join(', ') || 'já na Zona Saudável'}</span></span>${P ? `<button class="link" data-a="aluno-edit" data-id="${esc(al.id)}">Plano até ${esc(fmtDate(P.rt, {day:'numeric', month:'short'}))}</button>` : `<button class="btn sm" data-a="pfit-new" data-id="${esc(al.id)}">Criar plano</button>`}</div>`).join('')}</div>`;
  return h;
}
const pfitDoc = (t, als) => `<section class="rel">${docHead('Planos individuais de aptidão física · ' + t.nome, perLabel(UI.p, true))}${als.map(al => `<div class="pfit-doc"><h2>${esc(al.nome)}</h2>${pfitHtml(t, al, true)}</div>`).join('')}</section>`;

/* 2. medidas de suporte à aprendizagem e à inclusão (DL 54/2018) */
const MEDS = {
  u:['Diferenciação pedagógica', 'Acomodações curriculares', 'Enriquecimento curricular', 'Promoção do comportamento pró-social', 'Intervenção em pequeno grupo com foco académico ou comportamental'],
  s:['Adaptações curriculares não significativas', 'Apoio psicopedagógico', 'Antecipação e reforço das aprendizagens', 'Apoio tutorial', 'Percursos curriculares diferenciados'],
  a:['Adaptações curriculares significativas', 'Plano individual de transição', 'Frequência com redução de currículo', 'Metodologias e estratégias de ensino estruturado', 'Competências de autonomia pessoal e social']
};
const MEDN = {u:'Universais', s:'Seletivas', a:'Adicionais'};
const medOf = al => al.med || {u:[], s:[], a:[], obs:''};
const temMed = al => { const m = al.med; return !!(m && (m.u.length || m.s.length || m.a.length || m.obs)); };
function sheetMed(aid) {
  const t = turma(), al = (t.alunos || []).find(x => x.id === aid); UI.draft = {aid, med:clone(medOf(al))}; const M = UI.draft.med;
  const body = `<div class="form"><p class="hint">Medidas definidas pela equipa multidisciplinar (Decreto-Lei n.º 54/2018). Aparecem no plano das aulas e, se quiser, no relatório.</p>
    ${Object.entries(MEDS).map(([k, xs]) => `<div class="field"><span class="lbl">Medidas ${MEDN[k].toLowerCase()}</span><div class="chips">${xs.map(x => `<button class="chip ${M[k].includes(x) ? 'on' : ''}" data-a="med-t" data-k="${k}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`).join('')}
    <div class="field"><label for="med-obs">Adaptações em Educação Física</label><textarea id="med-obs" placeholder="Ex.: tarefas com menor complexidade; tempo extra; instruções com demonstração; evitar impacto no joelho direito.">${esc(M.obs || '')}</textarea></div></div>`;
  openSheet('Medidas de suporte · ' + nome2(al.nome), body, `<button class="btn primary" data-a="med-save">Guardar</button>`);
}

/* 3. papéis na aula (árbitro, capitão, …): evidência de responsabilidade e cidadania */
const PAPEIS = ['Árbitro', 'Capitão', 'Observador', 'Cronometrista', 'Juiz / pontuação', 'Responsável pelo material', 'Tutor de um colega', 'Organizador do aquecimento'];
function papeisDe(t, p, aid) { const c = {}; aulasOf(t.id).filter(a => periodOf(a.data) === p).forEach(a => (a.papeis || []).forEach(([x, pp]) => { if (x === aid) c[pp] = (c[pp] || 0) + 1; })); return c; }
const papeisTxt = c => Object.entries(c).map(([p, n]) => `${p}${n > 1 ? ' (' + n + '×)' : ''}`).join(', ');
// Alunos que não fazem a prática: sugere-se um papel em vez de ficarem sentados.
function apoioHtml(t, a) {
  const p = periodOf(a.data), als = alunosOf(t), disp = als.filter(al => (a.presencas || {})[al.id] === 'D' || (REG[regAt(al, p)] || REG.Normal).af === 0), med = als.filter(temMed);
  if (!disp.length && !med.length) return '';
  return `<div class="pa-p inc"><div class="pa-ph"><b>Inclusão nesta aula</b></div>
    ${disp.length ? `<p class="small" style="margin:0"><b>Sem prática:</b> ${disp.map(al => esc(nome2(al.nome))).join(', ')}. Atribua-lhes um papel (árbitro, observador com lista de verificação, cronometrista) em vez de os deixar a assistir.</p>` : ''}
    ${med.map(al => { const m = medOf(al); return `<p class="small" style="margin:0"><b>${esc(nome2(al.nome))}:</b> ${esc([...m.u, ...m.s, ...m.a].join('; '))}${m.obs ? ' · ' + esc(m.obs) : ''}</p>`; }).join('')}</div>`;
}
function papeisAulaHtml(a) {
  const t = turma(), ps = a.papeis || [], als = alunosOf(t);
  return `<details class="aplano" id="pp-det"${ps.length ? ' open' : ''}><summary><span class="lbl" style="margin:0">Papéis na aula</span> <span class="small muted">${ps.length ? ps.length + ' atribuídos' : 'árbitro, capitão, observador…'}</span></summary><div id="pp-box">
    ${ps.length ? `<div class="list">${ps.map(([aid, pp], i) => { const al = als.find(x => x.id === aid); return `<div class="li"><span class="who"><b>${esc(pp)}</b> <span class="small muted">${esc(al ? al.nome : '?')}</span></span><button class="icon-btn" data-a="pp-rm" data-i="${i}" aria-label="Retirar">×</button></div>`; }).join('')}</div>` : ''}
    <div class="pp-add"><select id="pp-p" aria-label="Papel">${PAPEIS.map(x => `<option>${esc(x)}</option>`).join('')}</select><select id="pp-a" aria-label="Aluno">${als.map(al => `<option value="${esc(al.id)}">${esc(al.nome)}</option>`).join('')}</select><button class="btn sm" data-a="pp-add">Atribuir</button></div>
    <p class="hint" style="margin:6px 0 0">Os papéis contam como evidência de responsabilidade e entram no relatório do aluno.</p></div></details>`;
}

/* 4. reflexão depois da aula: o que mudar passa para a aula seguinte da mesma matéria */
function reflHtml(a) {
  const R = a.refl || {};
  return `<details class="aplano"${R.ok || R.mud || R.act != null ? ' open' : ''}><summary><span class="lbl" style="margin:0">Reflexão depois da aula</span> <span class="small muted">o que resultou e o que mudar</span></summary>
    <div class="form" style="gap:10px"><div class="field"><label for="rf-ok">O que resultou?</label><textarea id="rf-ok" data-in="rf" data-k="ok" rows="2">${esc(R.ok || '')}</textarea></div>
    <div class="field"><span class="lbl">Tempo em atividade motora (estimativa)</span><div class="seg block">${[30, 50, 70, 90].map(x => `<button data-a="rf-act" data-v="${x}" class="${R.act === x ? 'on' : ''}">${x < 90 ? '≈' + x : '≥90'}%</button>`).join('')}</div></div>
    <div class="field"><label for="rf-mud">O que mudo na próxima aula?</label><textarea id="rf-mud" data-in="rf" data-k="mud" rows="2" placeholder="Ex.: mais tempo de jogo reduzido; grupos de 3 em vez de 4.">${esc(R.mud || '')}</textarea></div></div></details>`;
}
function reflAnterior(t, a) {
  const x = aulasOf(t.id).filter(o => o.id !== a.id && o.data < a.data && o.refl && o.refl.mud && (!a.materias.length || (o.materias || []).some(m => a.materias.includes(m)))).pop();
  return x ? `<div class="note warn" style="margin:0 0 8px"><b>Da aula de ${esc(fmtDate(x.data, {day:'numeric', month:'short'}))}:</b> ${esc(x.refl.mud)}</div>` : '';
}

/* 5. balanço da unidade didática */
function balancoHtml(t, p, m) {
  const v = avalOf(t.id, p), als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0), c = {sub:[], igual:[], desc:[], sem:[]};
  als.forEach(al => { const l = (lvOf(v, al.id, m) || {}).l, ref = p === 1 ? aiLv(t, al.id, m) : (lvOf(avalOf(t.id, p - 1), al.id, m) || {}).l || aiLv(t, al.id, m);
    if (!l || !ref) c.sem.push(al); else if (LVI(l) > LVI(ref)) c.sub.push(al); else if (LVI(l) < LVI(ref)) c.desc.push(al); else c.igual.push(al); });
  const cs = compsOf(t.ciclo, m), tem = als.filter(al => { const tk = tksOf(v, al.id, m); return tk && Object.values(tk).some(Boolean); });
  const pct = cs.map(x => ({c:x, n:tem.filter(al => (tksOf(v, al.id, m) || {})[x.id] || evState(evMap(v, al.id, m)[x.id]) === 'dom').length})).filter(x => tem.length);
  const nv = nivelTurma(t, m), falta = pct.filter(x => x.c.k === nv && !geralC(x.c)).sort((a, b) => a.n - b.n).slice(0, 5);
  const seg = [['sub', 'Subiram', 'g3'], ['igual', 'Mantiveram', 'g2'], ['desc', 'Desceram', 'g0'], ['sem', 'Sem comparação', '']];
  return `<div class="form"><p class="hint" style="margin:0">Comparação com ${p === 1 ? 'a avaliação inicial' : 'o ' + perLabel(p - 1, true) + ' (ou a avaliação inicial)'}.</p>
    <div class="ai-bar big">${seg.filter(([k]) => c[k].length).map(([k, n, g]) => `<i class="${g}" style="flex:${c[k].length};${g ? '' : 'background:var(--muted)'}" title="${n}">${c[k].length}</i>`).join('')}</div>
    <div class="legend">${seg.map(([k, n, g]) => `<span><i class="sw ${g}"${g ? '' : ' style="background:var(--muted)"'}></i>${n}: ${c[k].length}</span>`).join('')}</div>
    ${c.desc.length ? `<p class="small"><b>Desceram:</b> ${esc(c.desc.map(al => nome2(al.nome)).join(', '))}</p>` : ''}
    ${falta.length ? `<div class="card"><b>Por consolidar no nível ${esc(LVN[nv])}</b><p class="hint" style="margin:2px 0 6px">As competências que menos alunos dominam: pontos de partida para a próxima unidade de ${esc(m)}.</p>${falta.map(x => `<div class="evr"><span>${cidOf(x.c)}${esc(encurta(x.c.txt, 110))}</span><span class="num-t">${x.n}/${tem.length}</span><span class="pill ${x.n / tem.length < .5 ? 'bad' : 'inc'}">${Math.round(x.n / tem.length * 100)}%</span></div>`).join('')}</div>` : '<p class="hint">Assinale competências (ou registe evidências) para ver quais ficaram por consolidar.</p>'}</div>`;
}

/* 6. equidade: diferenças sistemáticas entre raparigas e rapazes e entre regimes */
function equidade(t, p) {
  const v = avalOf(t.id, p), als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0), out = [];
  matsOf(t, p).forEach(m => {
    const g = s => als.filter(al => al.sexo === s).map(al => (lvOf(v, al.id, m) || {}).l).filter(l => l in LVP).map(l => LVP[l]);
    const f = g('F'), x = g('M'); if (f.length < 3 || x.length < 3) return;
    const mf = f.reduce((a, b) => a + b, 0) / f.length, mm = x.reduce((a, b) => a + b, 0) / x.length;
    out.push({m, mf, mm, d:mf - mm, nf:f.length, nm:x.length});
  });
  return out;
}
const lvNear = x => LV.reduce((b, l) => Math.abs(LVP[l] - x) < Math.abs(LVP[b] - x) ? l : b, LV[0]);
function equiHtml(t, p) {
  const xs = equidade(t, p); if (!xs.length) return '';
  const max = 20;
  return fig('Equidade · raparigas e rapazes', 'Nível médio por matéria (escala 0–20); diferenças de 3 ou mais pontos assinaladas', `<div class="eqd">${xs.map(x => `<div class="eqd-r${Math.abs(x.d) >= 3 ? ' off' : ''}"><span class="eqd-m">${esc(x.m)}${Math.abs(x.d) >= 3 ? ' ⚠' : ''}</span><span class="eqd-b"><i class="f" style="width:${x.mf / max * 100}%"></i><em>${lvNear(x.mf)}</em></span><span class="eqd-b"><i class="m" style="width:${x.mm / max * 100}%"></i><em>${lvNear(x.mm)}</em></span></div>`).join('')}</div><div class="legend"><span><i class="sw" style="background:var(--v6)"></i>Raparigas</span><span><i class="sw" style="background:var(--v1)"></i>Rapazes</span></div>`);
}

Object.assign(A, {
  'pfit-new': el => { const t = turma(), al = alunosOf(t).find(x => x.id === el.dataset.id); if (al && pfitCriar(t, al)) { render(); toast('Plano criado.'); } },
  'pfit-all': () => { const t = turma(); let n = 0; alunosOf(t).forEach(al => { if (!pfitOf(t, al) && pfitCriar(t, al)) n++; }); render(); toast(`${n} ${n === 1 ? 'plano criado' : 'planos criados'}.`); },
  'pfit-del': el => { if (!armed(el, 'Confirmar')) return; const t = turma(), al = alunosOf(t).find(x => x.id === el.dataset.id), P = pfitOf(t, al); if (!P) return; const v = avalOf(t.id, P.p); delete v.pfit[al.id]; touchAval(v); render(); },
  'pfit-print': el => { const t = turma(); printDoc('Plano de aptidão física', pfitDoc(t, alunosOf(t).filter(x => x.id === el.dataset.id))); },
  'pfit-print-all': () => { const t = turma(), als = alunosOf(t).filter(al => pfitOf(t, al)); if (!als.length) { toast('Ainda não há planos criados.', 'bad'); return; } printDoc('Planos de aptidão física', pfitDoc(t, als)); },
  'med-open': el => sheetMed(el.dataset.id),
  'med-t': el => { const M = UI.draft.med, l = M[el.dataset.k], i = l.indexOf(el.dataset.v); i >= 0 ? l.splice(i, 1) : l.push(el.dataset.v); el.classList.toggle('on', i < 0); },
  'med-save': () => { const t = turma(), al = t.alunos.find(x => x.id === UI.draft.aid), M = UI.draft.med; M.obs = $('#med-obs').value.trim(); al.med = M; Store.save('turmas', t); closeSheet(); render(); toast('Medidas guardadas.'); },
  'pp-add': () => { const a = UI.draft; a.papeis = a.papeis || []; a.papeis.push([$('#pp-a').value, $('#pp-p').value]); $('#pp-det').outerHTML = papeisAulaHtml(a); },
  'pp-rm': el => { const a = UI.draft; a.papeis.splice(+el.dataset.i, 1); $('#pp-det').outerHTML = papeisAulaHtml(a); },
  'rf-act': el => { const R = UI.draft.refl = UI.draft.refl || {}, x = +el.dataset.v; R.act = R.act === x ? null : x; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === R.act)); },
  'ud-bal': el => { const t = turma(), m = el.dataset.m; openSheet('Balanço da unidade · ' + m, balancoHtml(t, UI.p, m)); }
});
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.in === 'rf' && UI.draft) { const R = UI.draft.refl = UI.draft.refl || {}; R[el.dataset.k] = el.value; } });
