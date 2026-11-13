/* ---------- actions ---------- */
const A = {
  'tab': el => { UI.tab = el.dataset.t; if (UI.tab !== 'avaliar') SEL = null; render(); window.scrollTo(0, 0); },
  'tsub': el => { UI.tsub = el.dataset.k; render(); },
  'dsec': el => { UI.dsec = el.dataset.k; render(); window.scrollTo(0, 0); },
  'per': el => { UI.p = +el.dataset.p; FOCUS = null; SEL = null; UNDO = null; UNDOS.length = 0; render(); },
  'sh-close': () => closeSheet(),
  'avtab': el => { UI.avTab = el.dataset.k; render(); },
  'demo': () => { makeDemo(); },
  'turma-new': () => sheetTurma({id: uid(), nome: '', ciclo: '3', escala: '0-20', alunos: []}),
  'turma-edit': el => sheetTurma(clone(S.turmas[el.dataset.id])),
  't-escala': el => { UI.draft.escala = el.dataset.s; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  'turma-save': () => {
    const x = UI.draft; x.nome = ($('#t-nome').value || '').trim(); x.ciclo = $('#t-ciclo').value; x.ano = +$('#t-ano').value || null;
    if (!x.nome) { toast('Escreva o nome da turma.', 'bad'); $('#t-nome').focus(); return; }
    const prev = S.turmas[x.id]; x.horario = (x.horario || []).filter(hh => hh.h); S.turmas[x.id] = prev ? Object.assign(prev, {nome:x.nome, ciclo:x.ciclo, escala:x.escala, horario:x.horario, ano:x.ano}) : x;
    Store.save('turmas', S.turmas[x.id]); UI.turma = x.id; if (!prev) UI.tab = 'alunos'; closeSheet(); render(); toast(prev ? 'Turma guardada.' : 'Turma criada. Adicione os alunos.');
  },
  'turma-del': el => {
    if (!armed(el, 'Toque de novo para eliminar')) return;
    const id = UI.draft.id; aulasOf(id).forEach(a => { delete S.aulas[a.id]; Store.del('aulas', a.id); });
    Object.keys(S.aval).forEach(k => { if (S.aval[k].turmaId === id) { delete S.aval[k]; Store.del('aval', k); } });
    (S.turmas[id].alunos || []).forEach(al => { if (S.fotos[al.id]) { delete S.fotos[al.id]; Store.del('fotos', al.id); } });
    delete S.turmas[id]; Store.del('turmas', id); if (UI.turma === id) UI.turma = Object.keys(S.turmas)[0] || null; closeSheet(); render(); toast('Turma eliminada.');
  },
  'aula-new': (el, e, date) => { const t = turma(); let d = date || today(); const pres = {}; (t.alunos || []).forEach(al => { const x = dispOn(al, d); pres[al.id] = x && x.tipo !== 'Apenas registo' ? 'D' : 'P'; }); const u = udAtual(t, periodOf(d)); sheetAula({id: uid(), turmaId: t.id, data: d, c: Date.now(), materias: u ? [u] : [], sumario: '', presencas: pres}); },
  'aula-edit': el => { const a = clone(S.aulas[el.dataset.id]); a.materias = a.materias || []; a.presencas = a.presencas || {}; sheetAula(a); },
  'd-mat': el => { const m = el.dataset.m, d = UI.draft; const i = d.materias.indexOf(m); i >= 0 ? d.materias.splice(i, 1) : d.materias.push(m); el.classList.toggle('on', i < 0); },
  'd-pres': el => { UI.draft.presencas[el.dataset.aid] = el.dataset.s; el.parentNode.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); },
  'd-allp': () => { const d = UI.draft; Object.keys(d.presencas).forEach(k => d.presencas[k] = 'P'); (turma().alunos || []).forEach(al => d.presencas[al.id] = 'P'); document.querySelectorAll('.ps button').forEach(b => b.classList.toggle('on', b.dataset.s === 'P')); },
  'd-last': () => { const t = turma(); const last = aulasOf(t.id).filter(x => x.id !== UI.draft.id && x.sumario).pop(); if (last) { $('#d-sum').value = last.sumario; UI.draft.sumario = last.sumario; if (!UI.draft.materias.length) { UI.draft.materias = (last.materias || []).slice(); sheetAula(UI.draft); } } },
  'aula-save': quiet => {
    const d = UI.draft; d.sumario = $('#d-sum').value.trim(); d.data = $('#d-data').value || today();
    S.aulas[d.id] = d; Store.save('aulas', d); const p = periodOf(d.data); closeSheet(); if (p !== UI.p) UI.p = p; if (quiet === true) return d; render(); toast('Aula guardada.');
  },
  'aula-del': el => { if (!armed(el, 'Toque de novo para eliminar')) return; const id = UI.draft.id; delete S.aulas[id]; Store.del('aulas', id); closeSheet(); render(); toast('Aula eliminada.'); },
  'aluno-new': () => { const t = turma(); const n = Math.max(0, ...(t.alunos || []).map(a => +a.num || 0)) + 1; sheetAluno({id: uid(), num: n, proc: '', nome: '', sexo: '', nasc: '', regime: 'Normal', obs: ''}); },
  'aluno-edit': el => { const al = (turma().alunos || []).find(x => x.id === el.dataset.id); if (al) sheetAluno(clone(al)); },
  'a-sexo': el => { UI.draft.sexo = el.dataset.v; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  'aluno-save': () => {
    const t = turma(), al = UI.draft;
    al.nome = $('#a-nome').value.trim(); al.num = parseNum($('#a-num').value); al.nasc = $('#a-nasc').value; al.regime = $('#a-reg').value; al.obs = $('#a-obs').value.trim(); al.proc = $('#a-proc').value.trim();
    if (!al.nome) { toast('Escreva o nome do aluno.', 'bad'); $('#a-nome').focus(); return; }
    t.alunos = t.alunos || []; const i = t.alunos.findIndex(x => x.id === al.id); i >= 0 ? t.alunos[i] = al : t.alunos.push(al);
    if (DFOTO) { S.fotos[al.id] = {id: al.id, d: DFOTO}; Store.save('fotos', S.fotos[al.id]); }
    else if (DFOTO === '' && S.fotos[al.id]) { delete S.fotos[al.id]; Store.del('fotos', al.id); }
    relObs(al.id); Store.save('turmas', t); closeSheet(); render(); toast('Aluno guardado.');
  },
  'aluno-del': el => { if (!armed(el, 'Toque de novo para remover')) return; const t = turma(); t.alunos = t.alunos.filter(x => x.id !== UI.draft.id); Store.save('turmas', t); if (S.fotos[UI.draft.id]) { delete S.fotos[UI.draft.id]; Store.del('fotos', UI.draft.id); } closeSheet(); render(); toast('Aluno removido da turma.'); },
  'alunos-paste': () => sheetPaste(),
  'paste-go': () => {
    const t = turma(); t.alunos = t.alunos || []; let n = Math.max(0, ...t.alunos.map(a => +a.num || 0)); let added = 0;
    $('#paste-txt').value.split(/\r?\n/).forEach(line => {
      const parts = line.split(/\t|;/).map(s => s.trim()).filter((s, i, arr) => s !== '' || i < arr.length - 1);
      if (!parts.length || !parts.join('')) return;
      let num = null, nome = '', sexo = '', nasc = '';
      parts.forEach(p => {
        if (/^\d{1,3}$/.test(p) && num == null && !nome) num = +p;
        else if (/^[FM]$/i.test(p)) sexo = p.toUpperCase();
        else if (/^\d{4}-\d{2}-\d{2}$/.test(p)) nasc = p;
        else if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}$/.test(p)) { const [d, m, y] = p.split(/[\/.-]/); nasc = y + '-' + pad(m) + '-' + pad(d); }
        else if (!nome) nome = p;
      });
      if (!nome) return; if (num == null) num = ++n; else n = Math.max(n, num);
      t.alunos.push({id: uid(), num, nome, sexo, nasc, regime: 'Normal', obs: ''}); added++;
    });
    if (!added) { toast('Não encontrei nomes. Uma linha por aluno.', 'bad'); return; }
    Store.save('turmas', t); closeSheet(); render(); toast(added + ' alunos adicionados.');
  },
  'mat-sel': el => { UI.mat = el.dataset.m; render(); },
  'mat-add': () => sheetMatAdd(),
  'mat-add-go': el => { const t = turma(); const v = avalOf(t.id, UI.p); v.materias = [...new Set([...(v.materias || []), el.dataset.m])]; touchAval(v); UI.mat = el.dataset.m; closeSheet(); render(); },
  'lv': el => {
    const t = turma(), v = avalOf(t.id, UI.p), aid = el.dataset.aid, l = el.dataset.l;
    v.af = v.af || {}; v.af[aid] = v.af[aid] || {}; const on = v.af[aid][UI.mat] !== l;
    if (on) v.af[aid][UI.mat] = l; else delete v.af[aid][UI.mat];
    touchAval(v);
    el.parentNode.querySelectorAll('button').forEach(b => { const s = on && b === el; b.classList.toggle('on', s); b.setAttribute('aria-pressed', s); });
    const hEl = document.getElementById('lvh-' + aid); if (hEl) hEl.textContent = on ? LVN[l] : '';
    const sEl = document.getElementById('lvs-' + aid); if (sEl) { const sm = on ? lvSummary(t.ciclo, UI.mat, l, tksOf(v, aid, UI.mat)) : ''; sEl.innerHTML = sm; sEl.hidden = !sm; }
  },
  'fit-sel': el => { UI.fit = el.dataset.k; render(); },
  'fit-bool': el => { const v = fitSet(el.dataset.aid, 'ombros', ((avalOf(turma().id, UI.p).fit || {})[el.dataset.aid] || {}).ombros === el.dataset.v ? '' : el.dataset.v); render(); },
  'fit-z': el => { const t = turma(), v = avalOf(t.id, UI.p), aid = el.dataset.aid; v.fit = v.fit || {}; v.fit[aid] = v.fit[aid] || {}; const k = UI.fit + '_z'; const z = +el.dataset.z; v.fit[aid][k] = v.fit[aid][k] === z ? null : z; touchAval(v); render(); },
  'escala': el => { const t = turma(); t.escala = el.dataset.s; Store.save('turmas', t); render(); },
  'avq': el => {
    const t = turma(), v = avalOf(t.id, UI.p), aid = el.dataset.aid, k = el.dataset.k, i = +el.dataset.i;
    v.av = v.av || {}; v.av[aid] = v.av[aid] || {}; const on = v.av[aid][k] !== i; v.av[aid][k] = on ? i : null; touchAval(v);
    el.parentNode.querySelectorAll('button').forEach(b => { const s = on && b === el; b.classList.toggle('on', s); b.setAttribute('aria-pressed', s); });
    const cd = document.getElementById('cd-' + aid + '-' + k); if (cd) cd.textContent = on ? AVD[k][i] : '';
    updAV(aid);
  },
  'nper': el => { CFG.nper = +el.dataset.n; while (CFG.per.length < 3) CFG.per.push({ini:'', fim:''}); if (UI.p > CFG.nper) UI.p = CFG.nper; Store.save('cfg', CFG); render(); },
  'fitref-sel': el => { UI.fitref = el.dataset.k; render(); },
  'backup': () => { Store.flush(); const data = {app:'Caderno EF', versao:1, exportado:new Date().toISOString(), cfg:S.cfg, turmas:S.turmas, aulas:S.aulas, aval:S.aval, fotos:S.fotos, docs:S.docs, hist:S.hist}; saveFile('caderno-ef-copia-' + today() + '.json', new Blob([JSON.stringify(data, null, 1)], {type:'application/json'})); try { localStorage.setItem('ef:lastBackup', today()); } catch (e) {} },
  'restore': () => $('#file-import').click(),
  'restore-go': async () => {
    const d = A._pending; if (!d) return; closeSheet(); migrate(d);
    for (const k of ['turmas','aulas','aval','fotos','docs','hist']) for (const id of Object.keys(S[k])) await Store.del(k, id);
    S = {cfg: d.cfg || {}, turmas: d.turmas || {}, aulas: d.aulas || {}, aval: d.aval || {}, fotos: d.fotos || {}, docs: d.docs || {}, hist: d.hist || {}};
    if (!S.cfg.geral) S.cfg.geral = defaultCfg(); CFG = S.cfg.geral; Object.keys(SHADOW).forEach(k => delete SHADOW[k]); Object.values(S.aval).forEach(v => SHADOW[v.id] = clone(v));
    for (const k of KINDS) Object.values(S[k]).forEach(o => Store.save(k, o));
    UI.turma = Object.keys(S.turmas)[0] || null; render(); toast('Cópia importada.');
  },
  'xlsx': () => exportXlsx(),
  'avmode': el => { UI.avMode = el.dataset.k; SEL = null; render(); },
  'cell': el => {
    const t = turma(), c = gCtx(t), col = gCols(t, c.v).find(x => x.k === el.dataset.k), al = (t.alunos || []).find(x => x.id === el.dataset.aid); if (!col || !al) return;
    SEL = {aid:al.id, k:col.k}; UI.hintSeen = true; if (window.innerWidth < 900) UI.gedOpen = false;
    if (PIN && PIN.val != null && PIN.type === col.type && gEditable(col, al)) { gSnap(c, col); gSet(c, col, al, PIN.val); }
    gRefresh(col.type === 'num' && gEditable(col, al) && !matchMedia('(pointer:coarse)').matches);
  },
  'g-set': el => { const {col} = gHere(); if (!col) return; const raw = el.dataset.v; gApply(raw === '' ? null : col.type === 'q4' || col.type === 'reg' ? +raw : raw, true); },
  'g-move': el => gMove(+el.dataset.d, 0, true),
  'g-desel': () => { SEL = null; PIN = null; gRefresh(); },
  'g-undo': () => {
    if (!UNDO) return;
    const u = UNDOS.pop() || UNDO;
    if (u.aula) { const a = S.aulas[u.aula]; if (a) { a.reg = u.snap; Store.save('aulas', a); } }
    else touchAval(u.snap);
    UNDO = UNDOS[UNDOS.length - 1] || null; gRefresh(); toast(UNDOS.length ? 'Desfeito. Pode desfazer mais ' + UNDOS.length + '.' : 'Desfeito.');
  },
  'g-grp': el => { UI.hide[el.dataset.g] = !UI.hide[el.dataset.g]; gRefresh(); },
  'g-lay': el => { if (el.dataset.k === 'dominio') { UI.avMode = 'dominio'; SEL = null; render(); return; } UI.avMode = 'grelha'; UI.glay = el.dataset.k; if (SEL) UI.gcol = SEL.k; gRefresh(); },
  'g-filtros': () => sheetFiltros(),
  'f-dir': el => { UI.sort.d = +el.dataset.v; sheetFiltros(); gRefresh(); },
  'ged-tog': () => { UI.gedOpen = !UI.gedOpen; gEditor(); },
  'g-todo': () => { UI.todo = !UI.todo; gRefresh(); },
  'g-colstep': el => gColStep(+el.dataset.d),
  'g-unfocus': () => { FOCUS = null; SEL = null; render(); },
  'col-menu': el => sheetCol(el.dataset.k),
  'col-fill': el => { const t = turma(), col = gCols(t, avalOf(t.id, UI.p)).find(x => x.k === el.dataset.k); const raw = el.dataset.v; const n = gFill(el.dataset.k, col.type === 'q4' ? +raw : raw); closeSheet(); gRefresh(); toast(n ? n + ' alunos preenchidos.' : 'Não há vazios nesta coluna.'); },
  'col-clear': el => { if (!armed(el, 'Toque de novo para limpar')) return; const n = gFill(el.dataset.k, null); closeSheet(); gRefresh(); toast(n ? n + ' valores apagados.' : 'A coluna já estava vazia.'); },
  'col-sort': el => { const d = +el.dataset.d; UI.sort = d ? {k:el.dataset.k, d} : null; closeSheet(); gRefresh(); },
  'col-reg': () => {
    const t = turma(), c = gCtx(t), col = gCols(t, c.v).find(x => x.k === 'a:emp'); gSnap(c, col); let n = 0;
    alunosOf(t).forEach(al => { if (gGet(c, col, al) != null) return; const r = regOf(t, UI.p, al.id), tot = r.p + r.n; if (!tot) return; const q = r.p / tot; gSet(c, col, al, q < .25 ? 0 : q < .5 ? 1 : q < .75 ? 2 : 3); n++; });
    closeSheet(); gRefresh(); toast(n ? 'Empenho sugerido para ' + n + ' alunos (só os que estavam vazios).' : 'Não há registos +/− para os alunos sem Empenho.');
  },
  'ind-add': el => {
    const n = ($('#ind-new').value || '').trim(); if (!n) { $('#ind-new').focus(); return; }
    const t = turma(), v = avalOf(t.id, UI.p), m = el.dataset.m; v.ind = v.ind || {}; (v.ind[m] = v.ind[m] || []).push({id:uid(), n}); touchAval(v); render(); sheetCol('m:' + m); $('#ind-new').focus();
  },
  'ind-del': el => {
    if (!armed(el, 'Apagar avaliações?')) return;
    const t = turma(), v = avalOf(t.id, UI.p), m = el.dataset.m, id = el.dataset.id; v.ind[m] = (v.ind[m] || []).filter(i => i.id !== id); if (!v.ind[m].length) delete v.ind[m];
    Object.values(v.iv || {}).forEach(o => delete o[id]); touchAval(v); render(); sheetCol('m:' + m);
  },
  'ind-copy': el => { const t = turma(), v = avalOf(t.id, UI.p), m = el.dataset.m, prev = (avalOf(t.id, UI.p - 1).ind || {})[m] || []; v.ind = v.ind || {}; v.ind[m] = prev.map(i => ({id:uid(), n:i.n})); touchAval(v); render(); sheetCol('m:' + m); },
  'aula-aval': () => { const d = A['aula-save'](true); if (!d) return; FOCUS = d.id; SEL = null; UI.tab = 'avaliar'; UI.avMode = 'grelha'; render(); window.scrollTo(0, 0); },
  'tools': () => sheetTools(),
  'tool-vai': () => sheetVai(), 'tool-cron': () => sheetCron(), 'tool-cad': () => sheetCad(), 'tool-eq': () => sheetEquipas(),
  'tv-go': () => {
    const T = TOOL; audio();
    if (T.run) { T.el += performance.now() - T.t0; T.run = false; clearInterval(T.iv); wake(false); }
    else { if (!T.el) beep(1, 660); T.t0 = performance.now(); T.run = true; T.iv = setInterval(tvTick, 50); wake(true); }
    $('#tv-go').textContent = T.run ? 'Pausa' : 'Continuar';
  },
  'tv-reset': el => { if (!armed(el, 'Toque de novo')) return; const T = TOOL; clearInterval(T.iv); wake(false); Object.assign(T, {el:0, run:false, res:{}, last:0, lastLvl:1}); $('#tv-go').textContent = 'Iniciar'; document.querySelectorAll('.tst').forEach(b => { b.classList.remove('done'); b.querySelector('b').textContent = ''; }); $('#tv-save').textContent = 'Guardar resultados'; tvTick(); },
  'tv-st': el => {
    const T = TOOL, aid = el.dataset.aid, b = el.querySelector('b');
    if (T.res[aid] != null) { delete T.res[aid]; el.classList.remove('done'); b.textContent = ''; }
    else { T.res[aid] = pacerAt(T.el + (T.run ? performance.now() - T.t0 : 0)).total; el.classList.add('done'); b.textContent = T.res[aid]; }
    const n = Object.keys(T.res).length; $('#tv-save').textContent = 'Guardar ' + n + (n === 1 ? ' resultado' : ' resultados');
  },
  'tv-save': () => { const r = TOOL.res, n = Object.keys(r).length; if (!n) { toast('Toque nos alunos à medida que param.', 'bad'); return; } Object.entries(r).forEach(([aid, x]) => fitSet(aid, 'vaivem', x)); closeSheet(); render(); toast(n + ' resultados do vaivém guardados.'); },
  'tc-test': el => { const T = TOOL; if (T.run) return; T.test = el.dataset.k; T.res = {}; T.i = 0; cronRender(); },
  'tc-go': () => {
    const T = TOOL; audio();
    if (!T.run) { T.t0 = performance.now(); T.run = true; beep(1, 660); cronRender(); T.iv = setInterval(() => { const e = document.getElementById('tc-t'); if (e) e.textContent = nf2((performance.now() - T.t0) / 1000); }, 31); return; }
    const sec = Math.round((performance.now() - T.t0) / 10) / 100; clearInterval(T.iv); T.run = false; beep(2, 880);
    const id = T.q[T.i]; if (id) T.res[id] = sec;
    const nx = T.q.findIndex((x, i) => i > T.i && T.res[x] == null), any = T.q.findIndex(x => T.res[x] == null); T.i = nx >= 0 ? nx : any >= 0 ? any : T.q.length;
    cronRender(); const e = document.getElementById('tc-t'); if (e) e.textContent = nf2(sec);
  },
  'tc-skip': () => { const T = TOOL; if (T.run) { clearInterval(T.iv); T.run = false; } T.i = Math.min(T.q.length, T.i + 1); cronRender(); },
  'tc-sel': el => { const T = TOOL; if (T.run) return; T.i = +el.dataset.i; cronRender(); },
  'tc-save': () => { const T = TOOL, n = Object.keys(T.res).length; if (!n) { toast('Ainda não há tempos.', 'bad'); return; } Object.entries(T.res).forEach(([aid, x]) => fitSet(aid, T.test, x)); const nm = T.test === 'vel' ? 'Velocidade 40 m' : 'Agilidade 4×10 m'; closeSheet(); render(); toast(n + ' tempos guardados em ' + nm + '.'); },
  'cd-go': () => {
    const T = TOOL; audio();
    if (T.run) { clearInterval(T.iv); T.run = false; wake(false); }
    else {
      T.run = true; T.t0 = performance.now(); T.c = 0; T.half = false; beep(1, 523); wake(true);
      // cada ciclo de 3 s: sinal grave (descer) no início, agudo (subir) a meio, e conta uma repetição
      T.iv = setInterval(() => { const e = performance.now() - T.t0, c = Math.floor(e / T.per), ph = (e % T.per) / T.per;
        if (c > T.c) { T.c = c; T.half = false; beep(1, 523); }
        if (ph >= .5 && !T.half) { T.half = true; T.n++; beep(1, 988); }
        const q = document.getElementById('cd-n'); if (q) { q.textContent = T.n; document.getElementById('cd-b').style.width = Math.round(ph * 100) + '%'; } }, 40);
    }
    $('#cd-go').textContent = T.run ? 'Parar' : 'Continuar';
  },
  'cd-reset': () => { const T = TOOL; clearInterval(T.iv); wake(false); T.run = false; T.n = 0; $('#cd-n').textContent = '0'; $('#cd-b').style.width = '0'; $('#cd-go').textContent = 'Iniciar'; },
  'eq-go': () => { eqMake(); $('#eq-out').innerHTML = eqHtml(); },
  'eq-copy': async () => { const t = turma(), E = UI.eq, nm = id => ((t.alunos || []).find(a => a.id === id) || {}).nome; const txt = E.res.map((ids, i) => 'Equipa ' + (i + 1) + ': ' + ids.map(nm).join(', ')).join('\n'); try { await navigator.clipboard.writeText(txt); toast('Equipas copiadas.'); } catch (e) { toast('Não foi possível copiar.', 'bad'); } },
  'alert-go': el => { const k = el.dataset.k; if (k === 'alunos') UI.tab = 'alunos'; else if (k === 'pauta') { UI.tab = 'pauta'; UI.pview = 'pauta'; } else { UI.tab = 'avaliar'; UI.avMode = 'grelha'; FOCUS = null; if (k === 'todo') UI.todo = true; if (k === 'fit') UI.hide = {mat:true, fit:false, con:true, av:true}; } render(); window.scrollTo(0, 0); },
  'alerts-all': () => { UI.allAlerts = true; render(); },
  'plano-edit': () => sheetPlano(),
  'pl-add': () => { const t = turma(), ms = MATS[t.ciclo] || GR, used = UI.draft.map(u => u.m); UI.draft.push({m:ms.find(m => !used.includes(m)) || ms[0], n:8}); planoRender(); },
  'pl-del': el => { UI.draft.splice(+el.dataset.i, 1); planoRender(); },
  'pl-save': () => { const t = turma(); t.plano = t.plano || {}; t.plano[UI.p] = UI.draft.filter(u => u.m && u.n > 0); Store.save('turmas', t); closeSheet(); render(); toast('Plano guardado.'); },
  'hoje-go': el => { UI.turma = el.dataset.id; FOCUS = null; SEL = null; UI.tab = 'aulas'; UI.p = periodOf(today()); render(); const t = turma(), a = aulasOf(t.id).filter(x => x.data === today()).pop(); if (a) A['aula-edit']({dataset:{id:a.id}}); else A['aula-new'](); },
  'hor-add': () => { const d = UI.draft; d.nome = $('#t-nome').value; d.ciclo = $('#t-ciclo').value; d.ano = +$('#t-ano').value || null; (d.horario = d.horario || []).push({d:Math.min(5, Math.max(1, new Date().getDay())), h:''}); sheetTurma(d); },
  'hor-del': el => { const d = UI.draft; d.nome = $('#t-nome').value; d.ciclo = $('#t-ciclo').value; d.ano = +$('#t-ano').value || null; d.horario.splice(+el.dataset.i, 1); sheetTurma(d); },
  'pview': el => { UI.pview = el.dataset.k; render(); },
  'rel-one': el => { relObs(el.dataset.id); const t = turma(), al = (t.alunos || []).find(x => x.id === el.dataset.id); if (al) printRel(t, UI.p, [al]); },
  'rel-all': () => { const t = turma(); printRel(t, UI.p, alunosOf(t)); },
  'print-go': () => window.print(),
  'print-close': () => { document.body.classList.remove('printing'); $('#print').innerHTML = ''; },
  'grupo': () => sheetGrupo(),
  'grupo-xlsx': () => {
    if (!window.XLSX) { toast('A biblioteca do Excel ainda está a carregar. Tente daqui a pouco.', 'bad'); return; }
    const g = grupoRows(), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Educação Física · ' + perLabel(UI.p, true) + ' · ' + CFG.ano], [], ['Turma', 'Alunos', 'Aulas', 'Média final', 'Aptos', 'Não aptos', 'Incompletos', 'Vaivém na ZS ou ZA (%)', 'Faltas'], ...g.map(x => [x.t.nome, x.n, x.aulas, x.media == null ? '' : Math.round(x.media * 10) / 10, x.st['Apto'], x.st['Não apto'], x.st['Incompleto'], x.zs ?? '', x.F])]), 'Turmas');
    saveFile(('EF_todas_as_turmas_' + perLabel(UI.p)).replace(/[^\wÀ-ú.-]+/g, '_') + '.xlsx', new Blob([XLSX.write(wb, {bookType:'xlsx', type:'array'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  },
  'restore-merge': () => {
    const d = A._pending; if (!d) return; closeSheet(); migrate(d); let n = 0;
    for (const k of ['turmas', 'aulas', 'aval', 'fotos', 'docs', 'hist']) Object.values(d[k] || {}).forEach(o => { const cur = S[k][o.id]; if (!cur || (o._u || 0) > (cur._u || 0)) { S[k][o.id] = o; if (k === 'aval') SHADOW[o.id] = clone(o); Store.save(k, o, true); n++; } });
    if (!UI.turma) UI.turma = Object.keys(S.turmas)[0] || null; render(); toast(n ? n + ' registos atualizados a partir da cópia.' : 'Este aparelho já tinha tudo o que está na cópia.');
  },
  'comp-all': el => compSet(id => id[0] === el.dataset.k, el.dataset.v === '1'),
  'aview': el => { UI.aview = el.dataset.k; render(); },
  'ini-turma': el => { UI.turma = el.dataset.id; FOCUS = null; SEL = null; UI.tab = 'avaliar'; UI.avMode = 'grelha'; UI.todo = true; render(); window.scrollTo(0, 0); },
  'ini-aval': el => { UI.turma = el.dataset.id; FOCUS = null; SEL = null; UI.tab = 'avaliar'; UI.avMode = 'grelha'; render(); window.scrollTo(0, 0); },
  'ini-alert': el => { UI.turma = el.dataset.id; FOCUS = null; SEL = null; if (el.dataset.aid) { UI.tab = 'alunos'; render(); A['aluno-edit']({dataset:{id:el.dataset.aid}}); return; } A['alert-go'](el); },
  'ini-aluno': el => { UI.turma = el.dataset.id; UI.tab = 'alunos'; render(); A['aluno-edit']({dataset:{id:el.dataset.aid}}); },
  'ini-aula': el => { UI.turma = el.dataset.id; UI.tab = 'aulas'; UI.aview = 'lista'; render(); A['aula-edit']({dataset:{id:el.dataset.aula}}); },
  'cal-dia': el => { const t = turma(), d = el.dataset.d, a = aulasOf(t.id).find(x => x.data === d); if (a) A['aula-edit']({dataset:{id:a.id}}); else A['aula-new'](null, null, d); },
  'disp-add': () => { const d = alunoDraft(); (d.disp = d.disp || []).push({id:uid(), tipo:'Dispensa Parcial 1', ini:today(), fim:'', motivo:''}); sheetAluno(d); const b = $('#sheet .sh-b'); b.scrollTop = b.scrollHeight; },
  'disp-del': el => { if (!armed(el, 'Remover?')) return; const d = alunoDraft(); d.disp.splice(+el.dataset.i, 1); sheetAluno(d); },
  'doc-anexar': el => { DOCI = +el.dataset.i; $('#file-doc').click(); },
  'doc-ver': el => { const x = S.docs[el.dataset.id]; if (!x) return; const u = URL.createObjectURL(dataURLtoBlob(x.d)); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); },
  'doc-rel-all': () => { const t = turma(); printRel(t, UI.p, alunosOf(t)); },
  'doc-crit': () => printDoc('Critérios de avaliação', criteriosHtml(turma())),
  'doc-plan': () => { const t = turma(); printDoc('Planificação anual · ' + t.nome, planHtml(t)); },
  'cons-open': () => sheetConselho(),
  'doc-cons': () => { const t = turma(); closeSheet(); printDoc('Conselho de turma · ' + t.nome, conselhoHtml(t, UI.p)); },
  'med-add': el => { const ta = document.querySelector(`textarea[data-in="med"][data-aid="${CSS.escape(el.dataset.aid)}"]`), x = MEDB[+el.dataset.i]; ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + x; ta.dispatchEvent(new Event('input', {bubbles:true})); },
  'auto-first': () => { const als = alunosOf(turma()); if (!als.length) { toast('A turma não tem alunos.', 'bad'); return; } sheetAuto(als[0].id); },
  'auto-open': el => { relObs(el.dataset.id); sheetAuto(el.dataset.id); },
  'auto-lv': el => { const d = UI.draft; d.lv[el.dataset.m] = d.lv[el.dataset.m] === el.dataset.l ? undefined : el.dataset.l; d.txt = $('#auto-txt').value; autoRender(); },
  'auto-av': el => { const d = UI.draft, k = el.dataset.k, i = +el.dataset.i; d.av[k] = d.av[k] === i ? undefined : i; d.txt = $('#auto-txt').value; autoRender(); },
  'auto-save': el => {
    const t = turma(), v = avalOf(t.id, UI.p), d = UI.draft; d.txt = $('#auto-txt').value.trim(); v.auto = v.auto || {};
    v.auto[d.aid] = {lv:JSON.parse(JSON.stringify(d.lv)), av:JSON.parse(JSON.stringify(d.av)), txt:d.txt, d:today()}; touchAval(v);
    if (el.dataset.next) { const als = alunosOf(t), i = als.findIndex(x => x.id === d.aid); sheetAuto(als[i + 1].id); $('#sheet .sh-b').scrollTop = 0; toast('Guardado. Agora: ' + als[i + 1].nome.split(' ')[0] + '.'); }
    else { closeSheet(); render(); toast('Autoavaliação guardada.'); }
  },
  'obs-sug': el => { const ta = $('#a-relobs'), t = turma(), al = UI.draft; if (ta.value.trim() && !armed(el, 'Substituir o texto?')) return; ta.value = obsSugest(t, UI.p, (t.alunos || []).find(x => x.id === al.id) || al) || 'Sem dados suficientes para sugerir.'; ta.focus(); },
  'obs-add': el => { const ta = $('#a-relobs'), x = OBSB[+el.dataset.i]; ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + x.replace('assíduo(a)', UI.draft.sexo === 'F' ? 'assídua' : UI.draft.sexo === 'M' ? 'assíduo' : 'assíduo(a)'); },
  'd-sug': el => { const ta = $('#d-sum'); ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + el.dataset.t; UI.draft.sumario = ta.value; },
  'xls-import': () => { if (!window.XLSX) { toast('A biblioteca do Excel ainda está a carregar. Tente daqui a pouco.', 'bad'); return; } $('#file-xls').click(); },
  'xls-model': () => {
    if (!window.XLSX) { toast('A biblioteca do Excel ainda está a carregar. Tente daqui a pouco.', 'bad'); return; }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['N.º', 'Nome', 'Sexo', 'Data de nascimento', 'N.º de processo', 'Turma'], [1, 'Ana Martins', 'F', '12/03/2013', '12345', '7.º B'], [2, 'Bruno Costa', 'M', '30/07/2013', '12346', '7.º B']]), 'Alunos');
    saveFile('Modelo_alunos_Caderno_EF.xlsx', new Blob([XLSX.write(wb, {bookType:'xlsx', type:'array'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  },
  'imp-go': () => {
    const plan = impPlan(); if (!plan.some(g => g.list.length)) { toast('Não há alunos para importar.', 'bad'); return; }
    if (IMP.dest === '__new' && !IMP.newName.trim()) { toast('Escreva o nome da nova turma.', 'bad'); $('#imp-tname') && $('#imp-tname').focus(); return; }
    let first = null, nNew = 0, nUpd = 0;
    plan.forEach(g => {
      if (!g.list.length) return;
      let t = g.t; if (!t) { t = {id: uid(), nome: g.nome.trim(), ciclo: g.ciclo, ano: guessAno(g.nome), escala: '0-20', alunos: []}; S.turmas[t.id] = t; }
      t.alunos = t.alunos || []; let n = Math.max(0, ...t.alunos.map(a => +a.num || 0));
      g.list.forEach(x => {
        const ex = findAluno(t, x);
        if (ex) { if (x.num != null) ex.num = x.num; if (x.proc) ex.proc = x.proc; if (x.sexo) ex.sexo = x.sexo; if (x.nasc) ex.nasc = x.nasc; nUpd++; }
        else { const num = x.num != null ? x.num : ++n; n = Math.max(n, num); t.alunos.push({id: uid(), num, proc: x.proc, nome: x.nome, sexo: x.sexo, nasc: x.nasc, regime: 'Normal', obs: ''}); nNew++; }
      });
      Store.save('turmas', t); first = first || t;
    });
    const nT = plan.filter(g => g.list.length).length;
    IMP = null; UI.turma = first.id; UI.tab = 'alunos'; closeSheet(); render();
    toast(nNew + ' alunos importados' + (nUpd ? ', ' + nUpd + ' atualizados' : '') + (nT > 1 ? ' em ' + nT + ' turmas' : '') + '.');
  },
  'fotos-import': () => { const t = turma(); if (!t || !(t.alunos || []).length) { toast('Importe primeiro os alunos da turma.', 'bad'); return; } $('#file-fotos').click(); },
  'fotos-go': () => {
    let n = 0; FOTOS.forEach(x => { if (x.aid) { S.fotos[x.aid] = {id: x.aid, d: x.d}; Store.save('fotos', S.fotos[x.aid]); n++; } });
    FOTOS = null; closeSheet(); render(); toast(n + (n === 1 ? ' fotografia guardada.' : ' fotografias guardadas.'));
  },
  'foto-one': () => $('#file-foto1').click(),
  'foto-rm': el => { DFOTO = ''; $('#a-foto').innerHTML = avatar({nome: UI.draft.nome || $('#a-nome').value}, 'lg'); el.hidden = true; }
};
function compSet(match, on) {
  const {c, col, al} = gHere(); if (!col || !al || !col.m) return;
  gSnap(c, col); const v = c.v; v.comp = v.comp || {}; v.comp[al.id] = v.comp[al.id] || {}; const tk = v.comp[al.id][col.m] = v.comp[al.id][col.m] || {};
  compsOf(c.t.ciclo, col.m).forEach(x => { if (match(x.id)) { if (on) tk[x.id] = true; else delete tk[x.id]; } });
  if (Object.keys(tk).length) { v.af = v.af || {}; v.af[al.id] = v.af[al.id] || {}; v.af[al.id][col.m] = lvFromTicks(c.t.ciclo, col.m, tk); } else delete v.comp[al.id][col.m];
  touchAval(v); UI.domOpen = true; gRefresh();
}
let DOCI = null;
// Guarda no rascunho o que já foi escrito na ficha, antes de a redesenhar.
function alunoDraft() { const d = UI.draft; d.nome = $('#a-nome').value; d.num = parseNum($('#a-num').value); d.nasc = $('#a-nasc').value; d.regime = $('#a-reg').value; d.obs = $('#a-obs').value; d.proc = $('#a-proc').value; return d; }
function relObs(aid) { const ro = $('#a-relobs'); if (!ro || !UI.draft || UI.draft.id !== aid) return; const v = avalOf(turma().id, UI.p), x = ro.value.trim(); v.obs = v.obs || {}; if (x) v.obs[aid] = x; else delete v.obs[aid]; touchAval(v); }
function fitSet(aid, k, val) { const t = turma(), v = avalOf(t.id, UI.p); v.fit = v.fit || {}; v.fit[aid] = v.fit[aid] || {}; v.fit[aid][k] = val; touchAval(v); return v; }
function updAV(aid) { const t = turma(); const al = (t.alunos || []).find(x => x.id === aid); const el = document.getElementById('avn-' + aid); if (al && el) el.textContent = f1(calc(t, UI.p, al).AV); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target; const k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'turma') { if (el.value === '__new') { el.value = UI.turma; A['turma-new'](); } else { UI.turma = el.value; UI.mat = null; FOCUS = null; SEL = null; UNDO = null; UNDOS.length = 0; UI.sort = null; render(); } }
  else if (k === 'f-todo') { UI.todo = el.checked; gRefresh(); }
  else if (k === 'f-sort') { UI.sort = el.value ? {k:el.value, d:-1} : null; sheetFiltros(); gRefresh(); }
  else if (k === 'per-sel') { A.per({dataset:{p:el.value}}); }
  else if (k === 'd-data') { UI.draft.data = el.value || today(); }
  else if (k === 'avo') { const t = turma(), v = avalOf(t.id, UI.p), aid = el.dataset.aid; v.av = v.av || {}; v.av[aid] = v.av[aid] || {}; v.av[aid][el.dataset.k] = el.value === '' ? null : +el.value; touchAval(v); updAV(aid); }
  else if (k === 'cfg-ano') { CFG.ano = el.value.trim(); Store.save('cfg', CFG); }
  else if (k === 'per') { CFG.per[+el.dataset.i][el.dataset.k] = el.value; Store.save('cfg', CFG); }
  else if (k === 'imp-sheet') { impLoadSheet(el.value); impDefaults(); sheetImport(true); }
  else if (k === 'imp-col') { IMP.cols[el.dataset.f] = +el.value; sheetImport(true); }
  else if (k === 'imp-dest') { IMP.dest = el.value; if (el.value !== '__new' && el.value !== '__split') { const t = S.turmas[el.value], m = impTurmas().find(x => norm(x) === norm(t.nome)); IMP.filter = m || ''; } sheetImport(true); }
  else if (k === 'imp-filter') { IMP.filter = el.value; sheetImport(true); }
  else if (k === 'imp-ciclo') { IMP.newCiclo = el.value; }
  else if (k === 'comp') { compSet(id => id === el.dataset.id, el.checked); }
  else if (k === 'disp') { const d = UI.draft.disp[+el.dataset.i]; d[el.dataset.k] = el.value.trim(); }
  else if (k === 'cons-all') { UI.consAll = el.checked; sheetConselho(); }
  else if (k === 'cfg-aecon') { const x = parseNum(el.value); CFG.aeCon = (CFG.aeCon || [10, 14]).slice(); if (x != null) CFG.aeCon[+el.dataset.i] = x; Store.save('cfg', CFG); }
  else if (k === 'eq') { const E = UI.eq; E[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.dataset.k === 'n' ? +el.value : el.value; E.res = null; $('#eq-out').innerHTML = eqHtml(); }
  else if (k === 'pl') { const u = UI.draft[+el.dataset.i]; u[el.dataset.k] = el.dataset.k === 'n' ? Math.max(1, Math.min(60, parseInt(el.value, 10) || 1)) : el.value; }
  else if (k === 'hor') { UI.draft.horario[+el.dataset.i][el.dataset.k] = el.value; }
  else if (k === 'cfg-txt') { CFG[el.dataset.k] = el.value.trim(); Store.save('cfg', CFG); }
  else if (k === 'cfg-niv') { const x = parseNum(el.value); CFG.niv = (CFG.niv || [4, 10, 14, 18]).slice(); if (x != null) CFG.niv[+el.dataset.i] = x; Store.save('cfg', CFG); }
  else if (k === 'g-pin') { PIN = el.checked ? {val:null} : null; gEditor(); }
  else if (k === 'gcol') { UI.gcol = el.value; if (SEL) SEL.k = el.value; gRefresh(); }
  else if (k === 'foto-as') { FOTOS[+el.dataset.i].aid = el.value; const n = FOTOS.filter(x => x.aid).length; $('#fotos-go').textContent = 'Guardar ' + n + ' fotografias'; }
});
document.addEventListener('input', e => {
  const el = e.target; const k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'fit') {
    const aid = el.dataset.aid; const val = parseNum(el.value); fitSet(aid, UI.fit, val);
    const t = turma(), al = t.alunos.find(x => x.id === aid), f = FIT.find(x => x.k === UI.fit);
    const z = zoneOf(f, al, ageAt(al.nasc, refDate(UI.p)), avalOf(t.id, UI.p)); const ze = document.getElementById('z-' + aid);
    if (ze) { ze.className = 'zone ' + (z != null ? 'z' + z : ''); ze.textContent = z != null ? ZN[z] : 'Sem zona'; }
  } else if (k === 'con') {
    const t = turma(), v = avalOf(t.id, UI.p), aid = el.dataset.aid; let val = parseNum(el.value);
    const max = t.escala === '1-5' ? 5 : 20; if (val != null) val = Math.max(0, Math.min(max, val));
    v.con = v.con || {}; v.con[aid] = val; touchAval(v);
    const q = document.getElementById('ceq-' + aid); if (q) q.textContent = t.escala === '1-5' && val != null ? f1(val * 4) : '';
  } else if (k === 'g-num') {
    // grava enquanto escreve e atualiza só a célula; Enter passa ao aluno seguinte
    const {c, col, al} = gHere(); if (!col || !al || !gEditable(col, al)) return;
    if (!UNDO || UNDO.cell !== SEL.aid + col.k) { gSnap(c, col); UNDO.cell = SEL.aid + col.k; }
    gSet(c, col, al, parseNum(el.value)); const s = gShow(c, col, al), cell = document.querySelector('td.c.sel, .gcr.sel .c');
    if (cell) { cell.textContent = s.txt || (cell.tagName === 'SPAN' ? '·' : ''); cell.className = (cell.tagName === 'TD' ? 'c sel ' : 'c ') + s.cls + (s.auto ? ' auto' : ''); }
  } else if (k === 'med') {
    const v = avalOf(turma().id, UI.p), x = el.value.trim(); v.med = v.med || {}; if (x) v.med[el.dataset.aid] = x; else delete v.med[el.dataset.aid]; touchAval(v);
  } else if (k === 'imp-tname') {
    IMP.newName = el.value;
  } else if (k === 'fitref') {
    const r = CFG.fit[el.dataset.k][el.dataset.sx][el.dataset.z]; r[+el.dataset.i] = parseNum(el.value); Store.save('cfg', CFG);
  }
});
$('#file-import').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    let d; try { d = JSON.parse(rd.result); } catch (err) { toast('O ficheiro não é uma cópia válida do Caderno EF.', 'bad'); return; }
    if (!d || d.app !== 'Caderno EF' || typeof d.turmas !== 'object') { toast('O ficheiro não é uma cópia válida do Caderno EF.', 'bad'); return; }
    A._pending = d;
    openSheet('Importar cópia', `<div class="form"><p>Cópia de ${esc(fmtDate((d.exportado || '').slice(0, 10), {day:'numeric', month:'long', year:'numeric'}))}: ${Object.keys(d.turmas).length} turmas, ${Object.keys(d.aulas || {}).length} aulas.</p><p class="hint"><b>Juntar</b>: para trazer o trabalho de outro aparelho (telemóvel ↔ computador). Mantém, registo a registo, a versão mais recente.</p><p class="note warn"><b>Substituir</b>: os dados atuais são apagados e trocados pelos da cópia.</p></div>`, `<button class="btn" data-a="restore-merge">Juntar</button><button class="btn danger" data-a="restore-go">Substituir</button>`);
  };
  rd.readAsText(file);
});

document.addEventListener('keydown', e => {
  if (!SEL || UI.tab !== 'avaliar' || UI.avMode === 'dominio' || !$('#sheet').hidden) return;
  const tg = e.target, inNum = tg && tg.id === 'ged-num';
  if (tg && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName) && !inNum) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); A['g-undo'](); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const go = (dr, dc) => { e.preventDefault(); gMove(dr, dc, true); };
  if (e.key === 'Enter') return go(e.shiftKey ? -1 : 1, 0);
  if (e.key === 'Tab') return go(0, e.shiftKey ? -1 : 1);
  if (e.key === 'ArrowUp') return go(-1, 0);
  if (e.key === 'ArrowDown') return go(1, 0);
  if (e.key === 'Escape') { e.preventDefault(); if (inNum) tg.blur(); else A['g-desel'](); return; }
  if (inNum) return;
  if (e.key === 'ArrowLeft') return go(0, -1);
  if (e.key === 'ArrowRight') return go(0, 1);
  const {col, al} = gHere(); if (!col || !al || !gEditable(col, al)) return;
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); return gApply(null, false); }
  if (col.type === 'num' && /^[\d.,]$/.test(e.key)) { e.preventDefault(); const i = $('#ged-num'); if (i) { i.focus(); i.value = e.key; i.dispatchEvent(new Event('input', {bubbles:true})); } return; }
  const ch = gChoices(col) || []; let val;
  if (/^[1-9]$/.test(e.key) && ch[+e.key - 1] && col.type !== 'reg') val = ch[+e.key - 1].v;
  else if (col.type === 'bool' && /^[sn]$/i.test(e.key)) val = e.key.toUpperCase();
  else if (col.type === 'reg' && (e.key === '+' || e.key === '-')) val = e.key === '+' ? 1 : -1;
  if (val !== undefined) { e.preventDefault(); gApply(val, true); }
});
function gColStep(d) {
  const t = turma(), cols = gCols(t, avalOf(t.id, UI.p)), i = cols.findIndex(x => x.k === UI.gcol), n = cols[Math.max(0, Math.min(cols.length - 1, i + d))];
  if (!n || n.k === UI.gcol) return; UI.gcol = n.k; if (SEL) SEL.k = n.k; gRefresh();
}
// Uma coluna de cada vez: deslizar para o lado muda de coluna.
let SW = null;
document.addEventListener('touchstart', e => { SW = e.target.closest && e.target.closest('#gcl') ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : null; }, {passive:true});
document.addEventListener('touchend', e => {
  if (!SW) return; const t = e.changedTouches[0], dx = t.clientX - SW.x, dy = t.clientY - SW.y; SW = null;
  if (Math.abs(dx) > 60 && Math.abs(dy) < 45) gColStep(dx < 0 ? 1 : -1);
});
window.addEventListener('resize', () => { gFit(); if (UI.tab === 'relatorios' && UI.pview === 'graf') { clearTimeout(window._rz); window._rz = setTimeout(render, 200); } });
document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('domd')) { UI.domOpen = e.target.open; saveUI(); const g = $('#ged'); document.documentElement.style.setProperty('--ged-h', g.offsetHeight + 'px'); gFit(); } }, true);
$('#file-xls').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    const buf = await file.arrayBuffer(); let wb;
    if (/\.(csv|txt)$/i.test(file.name)) {
      // CSV do Excel português: separado por ; e muitas vezes em Windows-1252; as datas ficam como texto (dd/mm/aaaa)
      let txt; try { txt = new TextDecoder('utf-8', {fatal: true}).decode(buf); } catch (er) { txt = new TextDecoder('windows-1252').decode(buf); }
      wb = XLSX.read(txt.replace(/^﻿/, ''), {type: 'string', raw: true});
    } else wb = XLSX.read(buf, {type: 'array'});
    IMP = {file: file.name, wb};
    const withNome = wb.SheetNames.find(n => XLSX.utils.sheet_to_json(wb.Sheets[n], {header:1, defval:''}).slice(0, 20).some(r => r.some(c => NOME_RE.test(keyOf(c)))));
    impLoadSheet(withNome || wb.SheetNames[0]); impDefaults(); sheetImport();
  } catch (er) { IMP = null; toast('Não consegui ler este ficheiro. Use .xlsx, .xls, .ods ou .csv.', 'bad'); }
});
$('#file-fotos').addEventListener('change', async e => {
  const files = [...(e.target.files || [])]; e.target.value = ''; const t = turma(); if (!files.length || !t) return;
  toast('A preparar ' + files.length + ' fotografias…');
  const als = alunosOf(t), seen = new Set(); let nFail = 0; FOTOS = [];
  for (const f of files) {
    let d; try { d = await thumb(f); } catch (er) { nFail++; continue; }
    const a = matchFoto(f.name, als); const aid = a && !seen.has(a.id) ? a.id : ''; if (aid) seen.add(aid);
    FOTOS.push({name: f.name, d, aid});
  }
  if (!FOTOS.length) { toast('Não consegui abrir as imagens escolhidas.', 'bad'); return; }
  sheetFotos(nFail);
});
$('#file-doc').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f || !UI.draft || DOCI == null) return;
  let d; try { d = await docFromFile(f); } catch (er) { toast('Use uma fotografia ou um PDF até 1,5 MB.', 'bad'); return; }
  const id = uid(); S.docs[id] = {id, nome:f.name, d}; Store.save('docs', S.docs[id]);
  const dr = alunoDraft(); dr.disp[DOCI].doc = id; DOCI = null; sheetAluno(dr); toast('Atestado anexado. Guarde a ficha do aluno.');
});
$('#file-foto1').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f || !UI.draft) return;
  try { DFOTO = await thumb(f); } catch (er) { toast('Não consegui abrir esta imagem.', 'bad'); return; }
  $('#a-foto').innerHTML = `<img class="av lg" src="${esc(DFOTO)}" alt="">`; const rm = document.querySelector('[data-a="foto-rm"]'); if (rm) rm.hidden = false;
});

