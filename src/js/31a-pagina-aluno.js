/* ---------- página do aluno ---------- */
// O que antes era uma janela longa passa a página com separadores. No PC, fica à direita da lista de alunos.
const WIDE = () => window.innerWidth >= 1024;
const ATABS = [['resumo', 'Resumo'], ['comp', 'Competências'], ['fit', 'FITescola'], ['ass', 'Assiduidade'], ['hist', 'Histórico']];
function vAlunoPage(t, al, split) {
  const p = UI.p, r = calc(t, p, al), nv = nivel(t, r.FIN), tab = UI.atab || 'resumo', v = avalOf(t.id, p), age = ageAt(al.nasc, today()), dp = dispOn(al, today());
  const keep = CHW; if (split) CHW = 620;
  let h = `<div class="apage">${split ? '' : `<button class="link ap-back" data-a="ap-back">‹ ${UI.backTab ? 'Voltar' : 'Alunos'}</button>`}
    <div class="ap-id">${avatar(al, 'lg')}<div class="ap-nm"><h1>${esc(al.nome)}</h1>
      <div class="muted small">N.º ${esc(al.num ?? '—')} · ${esc(t.nome)}${age != null ? ' · ' + age + ' anos' : ''}${regAt(al, p) !== 'Normal' ? ' · ' + esc(regAt(al, p)) : ''}</div>
      <div class="ap-tags">${dp && dp.tipo !== 'Apenas registo' ? `<span class="tag reg">${esc(dp.tipo)}${dp.fim ? ' até ' + esc(fmtDate(dp.fim, {day:'numeric', month:'short'})) : ''}</span>` : ''}${r.c.F ? `<span class="tag F">${r.c.F} ${r.c.F === 1 ? 'falta' : 'faltas'}</span>` : ''}${(v.auto || {})[al.id] ? '<span class="tag P">Autoavaliação feita</span>' : ''}</div></div>
      <div class="ap-fin ${r.EST === 'Apto' ? 'ok' : r.EST === 'Não apto' ? 'bad' : ''}"><b>${r.FIN ?? '—'}</b><span>${nv != null ? esc(nivelLbl(t) + ' ' + nv) : 'Final'}</span><span>${esc(r.EST)}</span></div></div>
    <div class="btn-row ap-acts"><button class="btn" data-a="ap-edit">Editar dados</button><button class="btn" data-a="auto-open" data-id="${esc(al.id)}">Autoavaliação</button><button class="btn primary" data-a="rel-one" data-id="${esc(al.id)}">Relatório</button></div>
    <div class="seg block ap-tabs" role="tablist">${ATABS.map(([k, n]) => `<button role="tab" data-a="ap-tab" data-k="${k}" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>`;
  if (tab === 'resumo') {
    h += fig('Retrato · ' + perLabel(p, true), 'Domínios face à média da turma e competências dominadas', retrato(t, p, al));
    const ae = aeOf(t, al, p); if (ae) h += `<div class="aebox"><b>Aprendizagens Essenciais · ${ae.ano}.º ano</b><div>Atividades físicas: <span class="pill ${aeCls(ae.af)}">${esc(aeLbl(ae, ae.af))}</span> · Aptidão física: <span class="pill ${aeCls(ae.apf)}">${esc(aeLbl(ae, ae.apf))}</span> · Conhecimentos: <span class="pill ${aeCls(ae.con)}">${esc(aeLbl(ae, ae.con))}</span></div><div class="hint">Matérias consideradas: ${ae.sel.length ? ae.sel.map(c => esc(c.m) + ' ' + c.l).join(' · ') : '—'}</div></div>`;
    h += `<div class="card"><div class="tbl-wrap"><table><thead><tr><th class="l">Período</th><th>Matérias</th><th>Apt.</th><th>Con.</th><th>Atit.</th><th>Final</th><th>F</th><th>A</th></tr></thead><tbody>${CFG.per.slice(0, CFG.nper).map((_, i) => { const x = calc(t, i + 1, al); return `<tr class="${i + 1 === p ? 'rsel' : ''}"><td class="l">${perLabel(i + 1)}</td><td>${x.afOn ? f1(x.AF) : 'n/a'}</td><td>${x.apfOn ? f1(x.APF) : 'n/a'}</td><td>${f1(x.CON)}</td><td>${f1(x.AV)}</td><td class="fin">${x.FIN ?? '—'}</td><td>${x.c.F}</td><td>${x.c.A}</td></tr>`; }).join('')}</tbody></table></div>${r.missing.length ? `<p class="hint" style="margin:8px 0 0">Para fechar o ${esc(perLabel(p, true))} falta: ${esc(r.missing.join(', '))}.</p>` : ''}</div>`;
    h += fig('Comparação com a turma', perLabel(p, true), chCompare(compareRows(t, p, al)));
    const evo = CFG.per.slice(0, CFG.nper).map((_, i) => calc(t, i + 1, al)), ser = [{name:'Final', color:'var(--v1)', vals:evo.map(x => x.FIN)}, {name:'Matérias', color:'var(--v2)', vals:evo.map(x => x.AF)}, {name:'Apt. física', color:'var(--v3)', vals:evo.map(x => x.APF)}, {name:'Atitudes', color:'var(--v7)', vals:evo.map(x => x.AV)}];
    if (evo.filter(x => x.FIN != null || x.AF != null).length >= 1) h += fig('Evolução por período', 'Escala 0–20', chLine(evo.map((_, i) => perLabel(i + 1)), ser, {h:180, label:'Evolução por período'}) + legend(ser));
    h += `<div class="card form"><label for="a-relobs" class="lbl">Observação do ${esc(perLabel(p, true))} (aparece no relatório)</label><textarea id="a-relobs" data-in="pg-obs" data-aid="${esc(al.id)}" placeholder="Ex.: Evoluiu no passe e na manchete; deve trabalhar a resistência aeróbia.">${esc((v.obs || {})[al.id] || '')}</textarea><div class="sug"><button data-a="obs-sug" style="border-style:solid;color:var(--accent);font-weight:600">Sugerir a partir dos dados</button>${OBSB.map((o, i) => `<button data-a="obs-add" data-i="${i}">${esc(o)}</button>`).join('')}</div></div>`;
    const ac = autoCompare(t, p, al); if (ac) h += `<div class="card"><b>Autoavaliação</b>${ac}</div>`;
  } else if (tab === 'comp') {
    const ms = [...new Set([...Object.keys(r.lv), ...matsOf(t, p)])];
    h += ms.length ? ms.map(m => { const l = r.lv[m], sm = l ? lvSummary(t.ciclo, m, l, tksOf(v, al.id, m)) : ''; return `<div class="card acomp"><div class="ac-h">${subIcon(m, anoOf(t))}<b>${esc(m)}</b>${l ? `<span class="lvpill ${GLV[l]}">${l}</span><span class="muted small">${esc(LVN[l])}</span>` : '<span class="muted small">sem nível</span>'}<span class="sp"></span><button class="link" data-a="ap-comp" data-m="${esc(m)}">Assinalar competências</button></div>${sm ? `<div class="dom" style="max-height:none">${sm}</div>` : ''}</div>`; }).join('') : emptyCard('Sem matérias neste período', 'As matérias aparecem quando são registadas nas aulas ou avaliadas.');
  } else if (tab === 'fit') {
    const fv = (v.fit || {})[al.id] || {};
    h += `<div class="card"><div class="tbl-wrap"><table><thead><tr><th class="l">Teste</th><th>Resultado</th><th>Zona</th><th>Zona Saudável</th></tr></thead><tbody>${FIT.map(f => { const z = r.zones[f.k], ref = f.bool ? null : fitRef(f.k, al.sexo, r.age), x = fv[f.k]; return `<tr><td class="l">${esc(f.n)}</td><td>${f.bool ? (x === 'S' ? 'Sim' : x === 'N' ? 'Não' : '—') : x == null || x === '' ? '—' : esc(String(x).replace('.', ',') + ' ' + f.u)}</td><td>${z != null ? `<span class="zone z${z}">${esc(ZN[z])}</span>` : '—'}</td><td>${ref ? (f.dir > 0 ? '≥ ' : '≤ ') + String(ref.zs).replace('.', ',') : f.bool ? 'Sim' : '—'}</td></tr>`; }).join('')}</tbody></table></div>${!al.sexo || !al.nasc ? '<p class="hint">Indique o sexo e a data de nascimento (Editar dados) para calcular as zonas.</p>' : ''}</div>`;
    const fe = chFitEvo(t, al); if (fe) h += fig('Ao longo do ano', 'Resultado por período e linha da Zona Saudável', fe);
  } else if (tab === 'ass') {
    h += `<div class="card"><div class="tbl-wrap"><table><thead><tr><th class="l">Período</th><th>Aulas</th><th>Faltas</th><th>Atrasos</th><th>Sem material</th><th>Dispensas</th></tr></thead><tbody>${CFG.per.slice(0, CFG.nper).map((_, i) => { const c = counts(t, i + 1, al.id); return `<tr><td class="l">${perLabel(i + 1)}</td><td>${c.n}</td><td>${c.F}</td><td>${c.A}</td><td>${c.M}</td><td>${c.D}</td></tr>`; }).join('')}</tbody></table></div></div>`;
    const au = aulasOf(t.id).map((a, i) => ({a, n:i + 1})).filter(x => periodOf(x.a.data) === p).reverse();
    h += au.length ? `<div class="list">${au.map(({a, n}) => { const s = (a.presencas || {})[al.id] || 'P'; return `<button class="li" data-a="aula-edit" data-id="${esc(a.id)}"><span class="who"><div class="nm">Lição ${n} · ${esc(fmtDate(a.data))}</div><div class="meta">${esc((a.materias || []).join(', ') || 'Sem matérias')}</div></span><span class="end"><span class="tag ${s}">${esc(PSN[s])}</span></span></button>`; }).join('')}</div>` : emptyCard('Sem aulas neste período', '');
    if ((al.disp || []).length) h += `<div class="card"><b>Lesões e dispensas</b>${al.disp.map(d => `<p class="small" style="margin:6px 0 0">${esc(d.tipo)} · ${esc(d.ini ? fmtDate(d.ini, {day:'numeric', month:'short'}) : '?')} – ${esc(d.fim ? fmtDate(d.fim, {day:'numeric', month:'short'}) : 'sem fim')}${d.motivo ? ' · ' + esc(d.motivo) : ''}</p>`).join('')}</div>`;
  } else h += `<div class="card">${histHtml(t, al.id, 150)}</div>`;
  CHW = keep;
  return h + '</div>';
}
function pageAluno() { const t = turma(); return t && (t.alunos || []).find(x => x.id === UI.aluno); }

/* ---------- ícones dos subdomínios ---------- */
const SUBI = {
  JDC:'<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.6 9.5h16.8M3.6 14.5h16.8M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/>',
  GIN:'<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6l-4 7M12 13l4 7M5 9.5l7-1 7 1"/>',
  ATL:'<circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M7 11l3-3 4 1 2 4h3M11 15l-1-4"/>',
  ARE:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  PAT:'<path d="M5 15h11a3 3 0 0 0 3-3V5h-5v4H8a3 3 0 0 0-3 3z"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/>',
  RAQ:'<ellipse cx="9.5" cy="9.5" rx="5.5" ry="6.5" transform="rotate(-45 9.5 9.5)"/><path d="M13.5 13.5 20 20"/><circle cx="18" cy="5" r="1.6"/>',
  OUT:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  JOG:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>'
};
function subIcon(m, ano) { const s = subOf(m, ano || 7, true); return `<svg class="si" style="color:var(--v${SUBC[s] || 7})" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><title>${esc(SUBN[s])}</title>${SUBI[s]}</svg>`; }

/* ---------- estados vazios e assistente inicial ---------- */
const ART = '<svg class="art" viewBox="0 0 120 80" aria-hidden="true"><circle cx="42" cy="44" r="22" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.5"/><path d="M20 44h44M42 22c7 7 7 37 0 44M42 22c-7 7-7 37 0 44" fill="none" stroke="var(--accent)" stroke-width="2"/><rect x="72" y="30" width="30" height="18" rx="9" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="2.5"/><circle cx="96" cy="39" r="4" fill="var(--warn)"/><path d="M72 39H62" stroke="var(--warn)" stroke-width="2.5" stroke-linecap="round"/></svg>';
const emptyCard = (t, p) => `<div class="card empty">${ART}<h3>${esc(t)}</h3>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
function vWizard() {
  const st = UI.wiz || 1;
  let h = `<div class="card wiz">${ART}<div class="eyebrow">Caderno de Educação Física · passo ${st} de 3</div><div class="wz-steps">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`;
  if (st === 1) h += `<h1>Bem-vindo</h1><p>Três passos para começar. Primeiro, a escola e o ano letivo: aparecem nos relatórios e definem os períodos.</p><div class="form">
    <div class="grid2"><div class="field"><label for="w-escola">Escola / agrupamento</label><input type="text" id="w-escola" data-in="cfg-txt" data-k="escola" value="${esc(CFG.escola || '')}"></div><div class="field"><label for="w-prof">Professor(a)</label><input type="text" id="w-prof" data-in="cfg-txt" data-k="prof" value="${esc(CFG.prof || '')}"></div></div>
    <div class="field"><label for="w-ano">Ano letivo</label><input id="w-ano" type="text" data-in="cfg-ano" value="${esc(CFG.ano)}"></div>
    ${CFG.per.slice(0, CFG.nper).map((x, i) => `<div class="grid2"><div class="field"><label>${perLabel(i + 1, true)}: início</label><input type="date" data-in="per" data-i="${i}" data-k="ini" value="${esc(x.ini)}"></div><div class="field"><label>fim</label><input type="date" data-in="per" data-i="${i}" data-k="fim" value="${esc(x.fim)}"></div></div>`).join('')}
    <button class="btn primary" data-a="wiz" data-s="2">Continuar</button></div>`;
  else if (st === 2) h += `<h1>A primeira turma</h1><p>Importe a lista exportada do programa da escola (GIAE, Inovar…) com n.º, nome, sexo e data de nascimento. Também pode começar com uma turma vazia ou experimentar com uma turma de exemplo.</p>
    <div class="btn-row"><button class="btn primary" data-a="xls-import">Importar do Excel</button><button class="btn" data-a="turma-new">Criar turma vazia</button><button class="btn" data-a="demo">Turma de exemplo</button></div><button class="link" data-a="wiz" data-s="1">‹ Voltar</button>`;
  return h + `<p class="note">${esc(storageNote())}</p></div>`;
}
// Depois de criar a primeira turma no assistente, o passo 3 (horário) aparece no Início.
function wizNext() { if (UI.wiz && !CFG.wizDone) { UI.tab = 'inicio'; UI.wiz = 0; UI.wizH = true; } }
function vWizHorario() {
  if (CFG.wizDone || !UI.wizH) return '';
  const ts = Object.values(S.turmas).sort(byNome), sem = ts.filter(t => !(t.horario || []).length);
  return `<div class="card wiz-h"><div class="eyebrow">Passo 3 de 3 · horário</div><p style="margin:4px 0 8px">${sem.length ? `Defina quando tem Educação Física com ${sem.length === 1 ? 'a turma ' + esc(sem[0].nome) : sem.length + ' turmas'}: o Início passa a mostrar a aula de agora e a seguinte.` : 'Horário definido. Está tudo pronto.'}</p><div class="btn-row">${sem.slice(0, 3).map(t => `<button class="btn" data-a="turma-edit" data-id="${esc(t.id)}">Horário de ${esc(t.nome)}</button>`).join('')}<button class="btn ${sem.length ? 'ghost' : 'primary'}" data-a="wiz-fim">${sem.length ? 'Fazer depois' : 'Concluir'}</button></div></div>`;
}

/* ---------- aparência e acessibilidade ---------- */
function vAparencia() {
  const opt = (k, v, n) => `<button data-a="ver" data-k="${k}" data-v="${v}" class="${(UI[k] || '') === v ? 'on' : ''}">${n}</button>`;
  return `<div class="sec-h"><h2>Aparência</h2></div><div class="card form">
    <div class="field"><span class="lbl">Tema</span><div class="seg block">${opt('theme', '', 'Automático')}${opt('theme', 'light', 'Claro')}${opt('theme', 'dark', 'Escuro')}</div></div>
    <div class="field"><span class="lbl">Tamanho do texto</span><div class="seg block">${opt('zoom', '', 'Normal')}${opt('zoom', '1.12', 'Grande')}${opt('zoom', '1.25', 'Muito grande')}</div></div>
    <div class="field"><span class="lbl">Contraste</span><div class="seg block">${opt('contrast', '', 'Normal')}${opt('contrast', 'high', 'Alto (útil ao sol)')}</div></div>
    <p class="hint" style="margin:0">Estas opções ficam guardadas só neste aparelho.</p></div>`;
}
function applyLook() {
  const r = document.documentElement;
  if (UI.theme) r.dataset.theme = UI.theme; else delete r.dataset.theme;
  if (UI.contrast) r.dataset.contrast = UI.contrast; else delete r.dataset.contrast;
  document.body.style.zoom = UI.zoom || '';
}
