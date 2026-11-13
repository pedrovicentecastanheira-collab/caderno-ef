/* ---------- sheets ---------- */
function openSheet(title, body, foot) {
  $('#sheet').innerHTML = `<div class="sh-back" data-a="sh-close"></div><section class="sh" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="sh-h"><h2>${esc(title)}</h2><button class="icon-btn" data-a="sh-close" aria-label="Fechar">×</button></header><div class="sh-b">${body}</div>${foot ? `<footer class="sh-f">${foot}</footer>` : ''}</section>`;
  $('#sheet').hidden = false; document.body.classList.add('locked');
}
function closeSheet() { stopTool(); $('#sheet').hidden = true; $('#sheet').innerHTML = ''; document.body.classList.remove('locked'); UI.draft = null; DFOTO = undefined; }
function updSheet(body, foot) { const b = $('#sheet .sh-b'), f = $('#sheet .sh-f'); if (b) b.innerHTML = body; if (f) f.innerHTML = foot; }
function armed(el, label) { if (el.dataset.armed) return true; el.dataset.armed = '1'; el.classList.add('armed'); const o = el.textContent; el.textContent = label; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.classList.remove('armed'); el.textContent = o; } }, 4000); return false; }

function sheetAula(a) {
  const t = turma(); const isNew = !S.aulas[a.id];
  UI.draft = a;
  const all = aulasOf(t.id); const n = isNew ? all.filter(x => x.data <= a.data).length + 1 : all.findIndex(x => x.id === a.id) + 1;
  const last = all.filter(x => x.id !== a.id && x.sumario).pop();
  const body = `<div class="form">
    <div class="grid2"><div class="field"><label for="d-data">Data</label><input type="date" id="d-data" data-in="d-data" value="${esc(a.data)}"></div>
    <div class="field"><span class="lbl">Lição</span><div class="licao" style="padding-top:8px">N.º <span class="num-t">${n}</span> <span class="muted small" style="font-family:var(--f-body);font-weight:500">· ${perLabel(periodOf(a.data), true)}</span></div></div></div>
    <div class="field"><span class="lbl">Matérias da aula</span>${matChips(t, m => `<button class="chip ${a.materias.includes(m) ? 'on' : ''}" data-a="d-mat" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`, a.materias)}</div>
    <div class="field"><label for="d-sum">Sumário</label><textarea id="d-sum" data-in="d-sum" placeholder="Ex.: Voleibol: passe e manchete em situação de 2x2. Condição física: resistência.">${esc(a.sumario)}</textarea>
    <div class="sug">${[...a.materias.flatMap(m => SUMB[m] || []), ...SUMG].map(x => `<button data-a="d-sug" data-t="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    ${last ? `<button class="link" style="align-self:flex-start" data-a="d-last">Copiar o sumário da lição anterior</button>` : ''}</div>
    <button class="btn block" data-a="aula-aval">Avaliar nesta aula: níveis e registos +/−</button>
    <div class="field"><div style="display:flex;justify-content:space-between;align-items:center"><span class="lbl">Presenças</span><button class="link" data-a="d-allp">Todos presentes</button></div>
    <div class="legend">${PS.map(k => `<span><b>${k}</b> ${PSN[k]}</span>`).join('')}</div>
    <div class="list">${alunosOf(t).map(al => { const s = a.presencas[al.id] || 'P'; return `<div class="pr"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><span class="ps" role="group" aria-label="Presença de ${esc(al.nome)}">${PS.map(k => `<button class="${k} ${s === k ? 'on' : ''}" data-a="d-pres" data-aid="${esc(al.id)}" data-s="${k}" title="${PSN[k]}" aria-pressed="${s === k}">${k}</button>`).join('')}</span></div>`; }).join('') || '<div class="empty">Sem alunos na turma.</div>'}</div></div>
  </div>`;
  const foot = (isNew ? '' : `<button class="btn danger" data-a="aula-del">Eliminar</button>`) + `<button class="btn primary" data-a="aula-save">Guardar aula</button>`;
  openSheet(isNew ? 'Nova aula' : 'Lição ' + n, body, foot);
}

function sheetAluno(al) {
  const t = turma(); const isNew = !(t.alunos || []).some(x => x.id === al.id); UI.draft = al;
  const body = `<div class="form">
    <div class="foto-ed"><span id="a-foto">${avatar(al, 'lg')}</span><div class="btn-row"><button class="btn" data-a="foto-one">${S.fotos[al.id] ? 'Trocar fotografia' : 'Fotografia'}</button><button class="btn ghost" data-a="foto-rm"${S.fotos[al.id] ? '' : ' hidden'}>Remover</button></div></div>
    <div class="grid2" style="grid-template-columns:80px 1fr"><div class="field"><label for="a-num">N.º</label><input type="text" inputmode="numeric" id="a-num" data-in="a-num" value="${esc(al.num ?? '')}"></div>
    <div class="field"><label for="a-nome">Nome</label><input type="text" id="a-nome" data-in="a-nome" value="${esc(al.nome)}" autocomplete="off"></div></div>
    <div class="grid2"><div class="field"><span class="lbl">Sexo</span><div class="seg block">${[['F','Rapariga'],['M','Rapaz']].map(([k, n]) => `<button data-a="a-sexo" data-v="${k}" class="${al.sexo === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="field"><label for="a-nasc">Data de nascimento</label><input type="date" id="a-nasc" data-in="a-nasc" value="${esc(al.nasc || '')}"></div></div>
    <div class="field"><label for="a-proc">N.º de processo</label><input type="text" inputmode="numeric" id="a-proc" data-in="a-proc" value="${esc(al.proc || '')}"></div>
    <div class="field"><label for="a-reg">Regime</label><select id="a-reg" data-in="a-reg">${Object.keys(REG).map(k => `<option${al.regime === k ? ' selected' : ''}>${k}</option>`).join('')}</select></div>
    ${dispHtml(al)}
    <div class="field"><label for="a-obs">Observações</label><textarea id="a-obs" data-in="a-obs" placeholder="Atestado, cuidados de saúde, notas...">${esc(al.obs || '')}</textarea></div>

    </div>`;
  const foot = (isNew ? '' : `<button class="btn danger" data-a="aluno-del">Remover</button>`) + `<button class="btn primary" data-a="aluno-save">Guardar</button>`;
  openSheet(isNew ? 'Novo aluno' : 'Dados de ' + al.nome.split(' ')[0], body, foot);
}

function sheetTurma(x) {
  const isNew = !S.turmas[x.id]; UI.draft = x;
  const body = `<div class="form">
    <div class="field"><label for="t-nome">Nome da turma</label><input type="text" id="t-nome" data-in="t-nome" value="${esc(x.nome)}" placeholder="Ex.: 7.º B"></div>
    <div class="field"><span class="lbl">Cor da turma</span><div class="cores">${[1, 2, 3, 4, 5, 6, 7, 8].map(c => `<button data-a="t-cor" data-c="${c}" class="${(x.cor || (isNew ? 0 : tcor(x))) === c ? 'on' : ''}" style="background:var(--v${c})" aria-label="Cor ${c}"></button>`).join('')}</div></div>
    <div class="field"><label for="t-ano">Ano de escolaridade (para as Aprendizagens Essenciais)</label><select id="t-ano" data-in="t-ano"><option value="">—</option>${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<option value="${n}"${+(x.ano || guessAno(x.nome)) === n ? ' selected' : ''}>${n}.º ano</option>`).join('')}</select></div>
    <div class="field"><label for="t-ciclo">Ciclo (define as matérias e os descritivos)</label><select id="t-ciclo" data-in="t-ciclo">${Object.entries(CICLOS).map(([k, n]) => `<option value="${k}"${x.ciclo === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><span class="lbl">Escala de Conhecimentos</span><div class="seg block">${['0-20','1-5'].map(s => `<button data-a="t-escala" data-s="${s}" class="${x.escala === s ? 'on' : ''}">${s}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Horário semanal (tempos de Educação Física)</span>${(x.horario || []).map((hh, i) => `<div class="pl-ed"><select data-in="hor" data-i="${i}" data-k="d" aria-label="Dia">${[1, 2, 3, 4, 5, 6].map(d => `<option value="${d}"${+hh.d === d ? ' selected' : ''}>${DIAS[d]}</option>`).join('')}</select><input type="time" data-in="hor" data-i="${i}" data-k="h" value="${esc(hh.h || '')}" aria-label="Hora"><button class="icon-btn" data-a="hor-del" data-i="${i}" aria-label="Remover">×</button></div>`).join('')}<button class="btn" style="align-self:flex-start" data-a="hor-add">+ Tempo letivo</button></div>
    ${isNew ? '' : `<p class="note">Eliminar a turma apaga também as aulas, presenças e avaliações dela.</p>`}</div>`;
  const foot = (isNew ? '' : `<button class="btn danger" data-a="turma-del">Eliminar turma</button>`) + `<button class="btn primary" data-a="turma-save">${isNew ? 'Criar turma' : 'Guardar'}</button>`;
  openSheet(isNew ? 'Nova turma' : x.nome, body, foot);
}

function sheetPaste() {
  openSheet('Colar lista de alunos', `<div class="form"><p class="hint">Uma linha por aluno. Pode colar diretamente do Excel. Formato: <b>n.º; nome; sexo (F/M); data de nascimento</b>. Só o nome é obrigatório.</p>
    <textarea id="paste-txt" style="min-height:200px" placeholder="1; Ana Martins; F; 12/03/2013&#10;2; Bruno Costa; M; 2013-07-30&#10;3; Carla Sousa"></textarea></div>`,
    `<button class="btn primary" data-a="paste-go">Adicionar alunos</button>`);
}

// Matérias do ciclo em chips: as nucleares à vista e as alternativas (Anexos de 2026) num grupo que abre.
function matChips(t, chip, sel) {
  const ms = MATS[t.ciclo] || GR, nuc = ms.filter(m => !isAlt(t.ciclo, m)).map(chip).join(''), alt = ms.filter(m => isAlt(t.ciclo, m)), ah = alt.map(chip).join('');
  return `<div class="chips">${nuc}</div>` + (ah ? `<details class="alts"${(sel || []).some(m => alt.includes(m)) ? ' open' : ''}><summary>Matérias alternativas <span class="muted">(${alt.length})</span></summary><div class="chips">${ah}</div></details>` : '');
}
// Lista de opções com as matérias alternativas num grupo à parte.
function matOpts(t, cur) {
  const ms = MATS[t.ciclo] || GR, o = m => `<option${cur === m ? ' selected' : ''}>${esc(m)}</option>`, alt = ms.filter(m => isAlt(t.ciclo, m));
  return ms.filter(m => !isAlt(t.ciclo, m)).map(o).join('') + (alt.length ? `<optgroup label="Matérias alternativas">${alt.map(o).join('')}</optgroup>` : '');
}
function sheetMatAdd() {
  const t = turma(); const cur = matsOf(t, UI.p);
  openSheet('Adicionar matéria ao período', matChips(t, m => cur.includes(m) ? '' : `<button class="chip" data-a="mat-add-go" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`));
}

