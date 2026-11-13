/* ---------- render ---------- */
function render() {
  normTab(); saveUI(); applyLook();
  document.body.classList.toggle('wide', WIDE() && UI.tab !== 'defs');
  const t = turma(), ts = Object.values(S.turmas).sort(byNome), c = tcor(t);
  document.documentElement.style.setProperty('--tc', `var(--v${c})`);
  let top = '<div class="brand">Caderno <b>EF</b></div>';
  if (t) {
    top += `<span class="tdot" aria-hidden="true"></span><div class="turma-sel"><select id="sel-turma" data-in="turma" aria-label="Turma (deslize no cabeçalho para mudar)">` +
      ts.map(x => `<option value="${esc(x.id)}"${x.id === t.id ? ' selected' : ''}>${esc(x.nome)}</option>`).join('') + '<option value="__new">+ Nova turma…</option></select></div>';
    top += `<select class="perchip" data-in="per-sel" aria-label="Período">${CFG.per.slice(0, CFG.nper).map((_, i) => `<option value="${i + 1}"${UI.p === i + 1 ? ' selected' : ''}>${perLabel(i + 1)}</option>`).join('')}</select>`;
  } else top += '<span style="flex:1"></span>';
  top += `<button class="icon-btn gear${UI.tab === 'defs' ? ' on' : ''}" data-a="tab" data-t="defs" aria-label="Definições" title="Definições">${IC.defs}</button>`;
  morph($('#top'), '<div class="wrap top-in">' + top + '</div>');
  document.documentElement.style.setProperty('--top-h', $('#top').offsetHeight + 'px');
  $('#nav').hidden = !t && UI.tab !== 'defs';
  morph($('#nav-in'), TABS.map(([k, n]) => `<button data-a="tab" data-t="${k}" class="${UI.tab === k ? 'on' : ''}" aria-current="${UI.tab === k ? 'page' : 'false'}">${IC[k]}<span>${n}</span></button>`).join(''));
  let h;
  if (!ts.length && UI.tab !== 'defs' || !t && UI.tab !== 'defs' && UI.tab !== 'inicio') h = vWizard();
  else if (UI.tab === 'inicio') h = vInicio();
  else h = ({turma:vTurma, avaliar:vAvaliar, relatorios:vPauta, defs:vDefs})[UI.tab](t);
  morph($('#main'), '<div class="wrap">' + h + '</div>');
  gEditor();
}
function vTurma(t) {
  const sub = UI.tsub || 'aulas', al = pageAluno();
  if (sub === 'alunos' && WIDE() && (t.alunos || []).length) {
    const sel = al || alunosOf(t)[0]; UI.aluno = sel.id;
    return `<div class="split"><div class="split-l">${vTurmaSeg(sub)}${vAlunos(t)}</div><div class="split-r">${vAlunoPage(t, sel, true)}</div></div>`;
  }
  if (sub === 'alunos' && al) return vAlunoPage(t, al, false);
  return `<div class="stack">${vTurmaSeg(sub)}</div>` + (sub === 'alunos' ? vAlunos(t) : vAulas(t));
}
function vTurmaSeg(sub) {
  return `<div class="seg block" role="group" aria-label="Turma">${[['aulas', 'Aulas'], ['alunos', 'Alunos']].map(([k, n]) => `<button data-a="tsub" data-k="${k}" class="${sub === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
}
// Definições arrumadas por secções (as secções vêm de vMais).
const DSECS = [['turmas', 'Turmas', ['Turmas', 'Todas as turmas']], ['ano', 'Ano letivo', ['Ano letivo', 'Horário semanal']], ['escola', 'Escola', ['Escola e relatórios', 'Regras de cálculo']], ['fit', 'FITescola', ['Tabelas FITescola']], ['dados', 'Dados', ['Cópia de segurança']], ['ver', 'Aparência', []]];
function vDefs(t) {
  const full = vMais(t), body = full.replace(/^<div class="stack">/, '').replace(/<\/div>$/, ''), parts = {};
  body.split('<div class="sec-h"><h2>').slice(1).forEach(x => { parts[x.slice(0, x.indexOf('</h2>'))] = '<div class="sec-h"><h2>' + x; });
  const sec = DSECS.find(x => x[0] === UI.dsec) || DSECS[0];
  let h = `<div class="stack"><h1 class="ptitle">Definições</h1><div class="chips">${DSECS.map(([k, n]) => `<button class="chip ${sec[0] === k ? 'on' : ''}" data-a="dsec" data-k="${k}">${n}</button>`).join('')}</div>`;
  h += sec[0] === 'ver' ? vAparencia() : sec[2].map(n => parts[n] || '').join('');
  return h + '</div>';
}

function storageNote() {
  if (Store.mode === 'cloud') return 'Os dados ficam guardados na sua área privada desta app: só o Pedro os vê, em qualquer dispositivo onde abra o caderno com a sua conta.';
  if (Store.local) return 'Os dados ficam guardados apenas neste telemóvel, não vão para nenhum servidor. Faça cópias de segurança regulares: se apagar a app ou os dados do navegador, perde o que não tiver copiado.';
  return 'Este navegador não permite guardar dados: o que registar perde-se ao fechar a página.';
}

function vWelcome() {
  return `<div class="card welcome">
    <div class="eyebrow">Educação Física · ${esc(CFG.ano)}</div>
    <h1>O seu caderno de turma</h1>
    <ul>
      <li>Importação das turmas e alunos a partir do Excel, com fotografias.</li>
      <li>Registo de aulas com sumário e presenças (presente, falta, atraso, sem material, dispensado).</li>
      <li>Avaliação da turma toda numa grelha: escolhe o nível e toca nos alunos, com os descritivos PNEF.</li>
      <li>FITescola com zona calculada pela idade e sexo, Conhecimentos e Atitudes.</li>
      <li>Pauta automática com as regras da sua grelha, exportável para Excel.</li>
    </ul>
    <div class="btn-row"><button class="btn primary" data-a="xls-import">Importar alunos do Excel</button><button class="btn" data-a="turma-new">Criar turma vazia</button><button class="btn" data-a="demo">Experimentar com turma de exemplo</button></div>
    <p class="note">${esc(storageNote())}</p>
  </div>`;
}

function presTags(c) { return ['F','A','M','D'].filter(k => c[k]).map(k => `<span class="tag ${k}">${c[k]} ${k === 'F' ? (c[k] > 1 ? 'faltas' : 'falta') : k === 'A' ? (c[k] > 1 ? 'atrasos' : 'atraso') : k === 'M' ? 's/ material' : 'dispensa' + (c[k] > 1 ? 's' : '')}</span>`).join(''); }

function vAulas(t) {
  const all = aulasOf(t.id); const num = {}; all.forEach((a, i) => num[a.id] = i + 1);
  const list = all.filter(a => periodOf(a.data) === UI.p).reverse();
  const nAl = (t.alunos || []).length;
  let h = `<div class="stack">${vHoje()}<div class="btn-row"><button class="btn primary" data-a="aula-new">+ Registar aula</button><button class="btn" data-a="tools">Ferramentas</button></div>`;
  h += `<div class="seg block" role="group" aria-label="Vista">${[['lista', 'Lista de aulas'], ['cal', 'Calendário do ano']].map(([k, n]) => `<button data-a="aview" data-k="${k}" class="${(UI.aview || 'lista') === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (UI.aview === 'cal') return h + vCalendario(t) + '</div>';
  const al = nAl ? alertsOf(t, UI.p) : [];
  if (al.length) h += `<div class="card alerts"><span class="eyebrow">Atenção</span>${al.slice(0, UI.allAlerts ? 99 : 3).map(x => `<button class="alrt ${x.k}" data-a="alert-go" data-k="${x.a}"><span class="ai" aria-hidden="true">${x.k === 'bad' ? '!' : x.k === 'warn' ? '•' : 'i'}</span><span>${esc(x.txt)}</span></button>`).join('')}${al.length > 3 && !UI.allAlerts ? `<button class="link" style="align-self:flex-start" data-a="alerts-all">Ver mais ${al.length - 3}</button>` : ''}</div>`;
  h += vPlano(t);
  if (Store.local && all.length >= 3) { const lb = lastBackup(); const days = lb ? (new Date(today()) - new Date(lb)) / 864e5 : 999; if (days > 14) h += `<div class="note warn">${lb ? 'A última cópia de segurança tem mais de duas semanas.' : 'Ainda não fez nenhuma cópia de segurança.'} Os dados só existem neste telemóvel. <button class="link" data-a="backup">Fazer cópia agora</button></div>`; }
  h += `<div class="sec-h"><h2>Aulas · ${perLabel(UI.p, true)}</h2><span class="muted small num-t">${list.length} ${list.length === 1 ? 'aula' : 'aulas'}</span></div>`;
  if (!nAl) h += `<div class="note warn">Esta turma ainda não tem alunos. Adicione-os no separador Alunos para registar presenças.</div>`;
  if (!list.length) h += `<div class="card empty">${ART}<h3>Sem aulas neste período</h3><p>Registe a primeira aula: data, matérias, sumário e presenças, tudo no mesmo ecrã.</p></div>`;
  list.forEach(a => {
    const c = {F:0, A:0, M:0, D:0}; Object.values(a.presencas || {}).forEach(s => { if (s in c) c[s]++; });
    h += `<button class="card" data-a="aula-edit" data-id="${esc(a.id)}">
      <div class="aula-h"><span class="licao">Lição <span class="num-t">${num[a.id]}</span></span><span class="date">${esc(fmtDate(a.data))}</span></div>
      ${(a.materias || []).length ? `<div class="chips">${a.materias.map(m => `<span class="chip">${subIcon(m, anoOf(t))}${esc(m)}</span>`).join('')}</div>` : ''}
      <p class="sum">${a.sumario ? esc(a.sumario) : '<span class="muted">Sem sumário</span>'}</p>
      <div class="pres-mini">${presTags(c) || '<span class="tag P">Todos presentes</span>'}</div>
    </button>`;
  });
  return h + '</div>';
}

function vAlunos(t) {
  const als = alunosOf(t);
  let h = `<div class="stack"><div class="btn-row"><button class="btn primary" data-a="xls-import">Importar Excel</button><button class="btn" data-a="fotos-import">Fotografias</button><button class="btn" data-a="aluno-new">+ Aluno</button><button class="btn" data-a="alunos-paste">Colar lista</button></div>`;
  h += `<div class="sec-h"><h2>${esc(t.nome)}</h2><span class="muted small">${esc(CICLOS[t.ciclo])} · ${als.length} alunos</span></div>`;
  if (!als.length) return h + `<div class="card empty">${ART}<h3>Sem alunos</h3><p>Importe a lista do Excel exportada do programa da escola (GIAE, Inovar…): n.º, nome, sexo e data de nascimento. Depois, junte as fotografias de uma vez.</p><button class="link" data-a="xls-model">Descarregar modelo de Excel</button></div></div>`;
  h += '<div class="list">';
  als.forEach(al => {
    const c = counts(t, UI.p, al.id); const age = ageAt(al.nasc, today());
    const meta = [al.sexo === 'F' ? 'Rapariga' : al.sexo === 'M' ? 'Rapaz' : 'Sexo por indicar', age != null ? age + ' anos' : 'sem data de nasc.'].join(' · ');
    h += `<button class="li${UI.aluno === al.id && WIDE() ? ' on' : ''}" data-a="aluno-edit" data-id="${esc(al.id)}"><span class="n">${esc(al.num ?? '')}</span>${avatar(al)}<span class="who"><div class="nm">${esc(al.nome)}</div><div class="meta">${esc(meta)}</div></span><span class="end">${(x => x ? `<span class="tag reg">${esc(x.replace('Dispensa ', 'Disp. '))}</span>` : '')((d => d && d.tipo !== 'Apenas registo' ? d.tipo : regAt(al) !== 'Normal' ? regAt(al) : '')(dispOn(al, today())))}${c.F ? `<span class="tag F">${c.F}F</span>` : ''}</span></button>`;
  });
  return h + '</div></div>';
}

function vAvaliar(t) {
  const als = alunosOf(t);
  let h = `<div class="stack">${UI.avMode === 'dominio' ? gToolbar(false) : ''}`;
  if (!als.length) return h + `<div class="card empty">${ART}<h3>Sem alunos</h3><p>Adicione alunos à turma para começar a avaliar.</p></div></div>`;
  if (UI.avMode !== 'dominio') return h + vGrelha(t) + '</div>';
  h += `<div class="seg block" role="group" aria-label="Domínio">` +
    [['mat','Matérias'],['fit','FITescola'],['con','Conhec.'],['av','Atitudes']].map(([k, n]) => `<button data-a="avtab" data-k="${k}" class="${UI.avTab === k ? 'on' : ''}">${n}</button>`).join('') + '</div>';
  const v = avalOf(t.id, UI.p);
  if (UI.avTab === 'mat') {
    const ms = matsOf(t, UI.p);
    if (!ms.includes(UI.mat)) UI.mat = ms[0] || null;
    h += `<div class="chips">${ms.map(m => `<button class="chip ${m === UI.mat ? 'on' : ''}" data-a="mat-sel" data-m="${esc(m)}">${esc(m)}</button>`).join('')}<button class="chip add" data-a="mat-add">+ Matéria</button></div>`;
    if (!UI.mat) return h + `<div class="card empty">${ART}<h3>Sem matérias neste período</h3><p>As matérias entram aqui automaticamente quando as indica nas aulas. Também pode adicionar uma diretamente.</p></div></div>`;
    const d = (PNEF[t.ciclo] || []).find(x => x.m === UI.mat);
    h += `<details class="desc"><summary>Descritivos PNEF · ${esc(UI.mat)}</summary>` + (d ? `<dl>${['I','E','A'].map(k => `<dt>${k} · ${LVN[k]}</dt><dd>${esc(d[k] || '—')}</dd>`).join('')}</dl><p class="hint" style="margin:0 0 12px">PI, PE e PA: cumpre pelo menos metade dos conteúdos do nível I, E ou A.</p>` : `<p class="hint" style="margin:0 0 12px">A grelha não tem descritivo para esta matéria neste ciclo.</p>`) + '</details>';
    h += '<div class="list">';
    als.forEach(al => {
      const off = (REG[regAt(al)] || REG.Normal).af === 0; const cur = ((v.af || {})[al.id] || {})[UI.mat];
      h += `<div class="ev ${off ? 'off' : ''}"><div class="ev-h"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><span class="hint" id="lvh-${esc(al.id)}">${off ? 'Dispensa total' : cur ? esc(LVN[cur]) : ''}</span></div>` +
        (off ? '' : `<div class="lvls" role="group" aria-label="Nível de ${esc(al.nome)}">${LV.map(l => `<button class="lv ${l} ${cur === l ? 'on' : ''}" data-a="lv" data-aid="${esc(al.id)}" data-l="${l}" aria-pressed="${cur === l}">${l}</button>`).join('')}</div><div class="dom" id="lvs-${esc(al.id)}"${cur ? '' : ' hidden'}>${cur ? lvSummary(t.ciclo, UI.mat, cur, tksOf(v, al.id, UI.mat)) : ''}</div>`) + '</div>';
    });
    return h + '</div></div>';
  }
  if (UI.avTab === 'fit') {
    const f = FIT.find(x => x.k === UI.fit) || FIT[0];
    h += `<div class="chips">${FIT.map(x => `<button class="chip ${x.k === f.k ? 'on' : ''}" data-a="fit-sel" data-k="${x.k}">${esc(x.n)}</button>`).join('')}</div>`;
    h += `<p class="hint">${f.bool ? 'Toca nos dois lados (direito e esquerdo)? Sim = Zona Saudável.' : `Resultado em ${esc(f.u)}. A zona calcula-se pela idade no fim do período (ou hoje) e pelo sexo, com as tabelas em Mais → Tabelas FITescola. Sem referência, escolha a zona à mão.`} Pontos: ${f.pts.map((p, i) => ZN[i] + ' ' + p).join(' · ')}.</p>`;
    h += '<div class="list">';
    als.forEach(al => {
      const off = (REG[regAt(al)] || REG.Normal).apf === 0; const age = ageAt(al.nasc, refDate(UI.p));
      const r = (v.fit || {})[al.id] || {}; const z = zoneOf(f, al, age, v); const auto = hasAuto(f, al, age);
      const ref = f.bool ? null : fitRef(f.k, al.sexo, age);
      let ctl;
      if (f.bool) ctl = `<div class="zman">${[['S','Sim'],['N','Não']].map(([k, n]) => `<button data-a="fit-bool" data-aid="${esc(al.id)}" data-v="${k}" class="${r.ombros === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
      else ctl = `<input type="text" inputmode="decimal" id="fit-${esc(al.id)}" data-in="fit" data-aid="${esc(al.id)}" value="${esc(r[f.k] ?? '')}" placeholder="${esc(f.u)}" aria-label="${esc(f.n)} de ${esc(al.nome)}">`;
      const man = (!auto || (r[f.k] == null || r[f.k] === '')) && !f.bool ? `<div class="zman" aria-label="Zona manual">${f.pts.map((_, i) => `<button data-a="fit-z" data-aid="${esc(al.id)}" data-z="${i}" class="${r[f.k + '_z'] != null && +r[f.k + '_z'] === i && !(auto && r[f.k] != null && r[f.k] !== '') ? 'on' : ''}">${['Fora','ZS','ZA'][i]}</button>`).join('')}</div>` : '';
      const why = f.bool ? '' : !al.sexo || !al.nasc ? 'Indique sexo e data de nascimento' : !ref ? 'Sem referência para ' + (age ?? '?') + ' anos' : `ZS ${f.dir > 0 ? '≥' : '≤'} ${String(ref.zs).replace('.', ',')}${ref.za != null ? ' · ZA ' + (f.dir > 0 ? '≥ ' : '≤ ') + String(ref.za).replace('.', ',') : ''}`;
      h += `<div class="ev ${off ? 'off' : ''}"><div class="ev-h"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><span class="hint">${al.sexo || '?'} · ${age ?? '?'} anos</span></div>` +
        (off ? '<span class="hint">Dispensa total</span>' : `<div class="fit-in">${ctl}<span class="zone ${z != null ? 'z' + z : ''}" id="z-${esc(al.id)}">${z != null ? ZN[z] : 'Sem zona'}</span>${man}</div>${why ? `<span class="hint">${esc(why)}</span>` : ''}`) + '</div>';
    });
    return h + '</div></div>';
  }
  if (UI.avTab === 'con') {
    h += `<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="lbl">Escala de Conhecimentos desta turma</span><div class="seg">${['0-20','1-5'].map(s => `<button data-a="escala" data-s="${s}" class="${(t.escala || '0-20') === s ? 'on' : ''}">${s}</button>`).join('')}</div></div>`;
    h += '<div class="list">';
    als.forEach(al => {
      const r = (v.con || {})[al.id]; const eq = r == null || r === '' ? null : (t.escala === '1-5' ? r * 4 : r);
      h += `<div class="ev"><div class="ev-h"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><input type="text" inputmode="decimal" style="width:84px;text-align:center" data-in="con" data-aid="${esc(al.id)}" value="${esc(r ?? '')}" placeholder="${t.escala === '1-5' ? '1-5' : '0-20'}" aria-label="Conhecimentos de ${esc(al.nome)}"><span class="val ${eq != null && eq < 10 ? 'low' : ''}" id="ceq-${esc(al.id)}" style="width:42px;text-align:right">${t.escala === '1-5' && eq != null ? f1(eq) : ''}</span></div></div>`;
    });
    return h + '</div><p class="hint">Na escala 1-5, a nota é convertida para 0-20 (×4) nos cálculos.</p></div>';
  }
  // atitudes
  h += `<p class="hint">Pontualidade e Material calculam-se pelas presenças do período (faltas + atrasos; aulas sem material). Pode alterar se necessário. Pesos: Pontualidade 10% · Material 20% · Respeito 30% · Empenho 20% · Liderança 20%.</p><div class="list">`;
  als.forEach(al => {
    const r = calc(t, UI.p, al); const o = (v.av || {})[al.id] || {};
    const autoP = idxFromCount(r.c.F + r.c.A), autoM = idxFromCount(r.c.M);
    const sel = (k, auto, info) => `<div class="crit"><span class="cl">${AVN[k]}</span><select data-in="avo" data-aid="${esc(al.id)}" data-k="${k}" aria-label="${AVN[k]} de ${esc(al.nome)}"><option value="">Auto (${esc(info)}): ${esc(AVD[k][auto])}</option>${AVD[k].map((d, i) => `<option value="${i}"${o[k] === i ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select></div>`;
    h += `<div class="ev"><div class="ev-h"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><span class="val" id="avn-${esc(al.id)}">${f1(r.AV)}</span></div>
      ${sel('pont', autoP, (r.c.F + r.c.A) + ' F/A')}${sel('mat', autoM, r.c.M + ' s/mat.')}
      ${['resp','emp','lid'].map(k => `<div class="crit"><span class="cl">${AVN[k]}</span><div class="q4">${[0,1,2,3].map(i => `<button class="lv ${o[k] === i ? 'on' : ''}" data-a="avq" data-aid="${esc(al.id)}" data-k="${k}" data-i="${i}" title="${esc(AVD[k][i])}" aria-pressed="${o[k] === i}">${i + 1}</button>`).join('')}</div></div><p class="cdesc" id="cd-${esc(al.id)}-${k}">${o[k] != null ? esc(AVD[k][o[k]]) : ''}</p>`).join('')}
    </div>`;
  });
  return h + '</div></div>';
}

function avatar(al, cls) {
  const f = S.fotos[al.id]; const c = 'av' + (cls ? ' ' + cls : '');
  if (f && f.d) return `<img class="${c}" src="${esc(f.d)}" alt="">`;
  const w = String(al.nome || '?').split(/\s+/).filter(Boolean);
  return `<span class="${c}" aria-hidden="true">${esc(((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase())}</span>`;
}


// Deslizar no cabeçalho para o lado muda para a turma anterior ou seguinte.
let TSW = null;
document.addEventListener('touchstart', e => { TSW = e.target.closest && e.target.closest('#top') ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : null; }, {passive:true});
document.addEventListener('touchend', e => {
  if (!TSW) return; const tt = e.changedTouches[0], dx = tt.clientX - TSW.x, dy = tt.clientY - TSW.y; TSW = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 40) return;
  const ts = Object.values(S.turmas).sort(byNome), i = ts.findIndex(x => x.id === UI.turma), n = ts[(i + (dx < 0 ? 1 : -1) + ts.length) % ts.length];
  if (!n || n.id === UI.turma) return; UI.turma = n.id; UI.mat = null; FOCUS = null; SEL = null; UNDO = null; UNDOS.length = 0; UI.sort = null; render(); toast(n.nome);
});
