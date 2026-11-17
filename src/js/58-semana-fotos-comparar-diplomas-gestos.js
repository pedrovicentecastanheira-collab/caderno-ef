/* ---------- horário da semana, fotografias, comparar turmas, diplomas, arrastar e gestos ---------- */
const $$ = s => [...document.querySelectorAll(s)];

/* I. Horário da semana no Início */
INI_SEC.splice(1, 0, ['semana', 'Horário da semana']);
const minDe = s => +String(s).slice(0, 2) * 60 + +String(s).slice(3, 5);
function segundaDe(d) { const x = new Date(d + 'T12:00:00'), w = x.getDay() || 7; x.setDate(x.getDate() - w + 1); return x; }
const isoDe = x => x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
const nomeCurto = n => { const m = /\d{1,2}\s*\.?\s*º\s*\S*/.exec(n || ''); return m ? m[0] : n; };
function vSemanaIni() {
  const sl = Object.values(S.turmas).flatMap(t => (t.horario || []).filter(h => h.h).map(h => ({t, d:+h.d, h:h.h}))); if (!sl.length) return '';
  const dur = CFG.durAula || 50, seg = segundaDe(today()), ds = [1, 2, 3, 4, 5].concat(sl.some(x => x.d === 6) ? [6] : []);
  const lo = Math.floor(Math.min(...sl.map(x => minDe(x.h))) / 60) * 60, hi = Math.ceil((Math.max(...sl.map(x => minDe(x.h))) + dur) / 60) * 60, k = 0.8, H = (hi - lo) * k;
  const agora = new Date(), mAgora = agora.getHours() * 60 + agora.getMinutes(), td = today();
  let h = `<div class="sec-h"><h2>Esta semana</h2><span class="small muted">${esc(fmtDate(isoDe(seg), {day:'numeric', month:'short'}))} a ${esc(fmtDate(isoDe(new Date(seg.getTime() + (ds.length - 1) * 864e5)), {day:'numeric', month:'short'}))}</span></div>
    <div class="card semw"><div class="sem" style="--n:${ds.length}"><div class="sem-hd"></div>${ds.map(d => { const iso = isoDe(new Date(seg.getTime() + (d - 1) * 864e5)); return `<div class="sem-hd${iso === td ? ' hoje' : ''}"><b>${DIAS[d]}</b><span>${+iso.slice(8)}</span></div>`; }).join('')}
    <div class="sem-hs" style="height:${H}px">${Array.from({length:(hi - lo) / 60}, (_, i) => `<span style="top:${i * 60 * k}px">${pad((lo / 60) + i)}h</span>`).join('')}</div>`;
  ds.forEach(d => { const iso = isoDe(new Date(seg.getTime() + (d - 1) * 864e5)), off = semAulas(iso);
    h += `<div class="sem-c${iso === td ? ' hoje' : ''}${off ? ' off' : ''}" style="height:${H}px">${Array.from({length:(hi - lo) / 60}, (_, i) => `<span class="sem-l" style="top:${i * 60 * k}px"></span>`).join('')}`;
    if (off) h += `<span class="sem-off">${esc(off[2] || 'Sem aulas')}</span>`;
    else sl.filter(x => x.d === d).sort((a, b) => a.h.localeCompare(b.h)).forEach(x => { const feita = aulasOf(x.t.id).some(a => a.data === iso), ult = aulasOf(x.t.id).filter(a => a.data <= iso).pop();
      h += `<button class="sem-b${feita ? ' feita' : ''}" style="top:${(minDe(x.h) - lo) * k}px;height:${dur * k - 3}px;--c:var(--v${tcor(x.t)})" data-a="sem-ir" data-id="${esc(x.t.id)}" data-d="${iso}" title="${esc(x.t.nome + ' · ' + x.h)}"><b>${esc(nomeCurto(x.t.nome))}</b><span>${esc(x.h)}${ult && (ult.materias || [])[0] ? ' · ' + esc(ult.materias[0]) : ''}</span>${feita ? '<em aria-label="registada">✓</em>' : ''}</button>`; });
    if (iso === td && mAgora >= lo && mAgora <= hi) h += `<span class="sem-now" style="top:${(mAgora - lo) * k}px"></span>`;
    h += '</div>'; });
  return h + '</div><p class="hint" style="margin:6px 0 0">Toque numa aula para a abrir. ✓ = já registada.</p></div>';
}

/* J. Fotografias: sessão com a câmara, «Quem é quem?» e fotografias maiores na grelha */
let FSES = 0;
function camInput() { let i = $('#file-cam'); if (!i) { i = document.createElement('input'); i.type = 'file'; i.id = 'file-cam'; i.accept = 'image/*'; i.setAttribute('capture', 'environment'); i.hidden = true; document.body.appendChild(i);
  i.addEventListener('change', async () => { const f = i.files[0]; i.value = ''; if (!f) return; const t = turma(), al = alunosOf(t)[FSES]; if (!al) return;
    try { const d = await thumb(f); S.fotos[al.id] = {id:al.id, d}; Store.save('fotos', S.fotos[al.id]); } catch (e) { toast('Não foi possível ler a fotografia.', 'bad'); return; }
    const als = alunosOf(t), nx = als.findIndex((a, j) => j > FSES && !S.fotos[a.id]); FSES = nx < 0 ? Math.min(FSES + 1, als.length - 1) : nx; sheetFotoSessao(); }); }
  return i; }
function sheetFotoSessao(open) {
  const t = turma(), als = alunosOf(t), al = als[FSES]; if (!al) { toast('A turma não tem alunos.'); return; }
  const n = als.filter(a => S.fotos[a.id]).length;
  const body = `<div class="fses"><div class="fses-p"><span>${FSES + 1} / ${als.length}</span><span class="pl-b"><i style="width:${n / als.length * 100}%"></i></span><span>${n} com fotografia</span></div>
    <div class="fses-a">${avatar(al, 'xl')}</div><h3>${esc(al.nome)}</h3><p class="muted small">N.º ${esc(al.num ?? '—')}</p>
    <button class="btn primary big" data-a="fs-cam">${S.fotos[al.id] ? 'Tirar outra fotografia' : 'Tirar fotografia'}</button>
    <div class="btn-row" style="justify-content:center"><button class="btn" data-a="fs-mv" data-d="-1"${FSES ? '' : ' disabled'}>‹ Anterior</button><button class="btn" data-a="fs-mv" data-d="1"${FSES < als.length - 1 ? '' : ' disabled'}>Seguinte ›</button></div>
    <p class="hint">As fotografias ficam reduzidas (cerca de 6 KB) e só neste caderno.</p></div>`;
  if (open || $('#sheet').hidden) openSheet('Sessão de fotografias', body, ''); else updSheet(body, '');
}
const QQ = {al:null, ops:[], ok:0, n:0, resp:null};
function quemNovo() { const als = alunosOf(turma()).filter(a => S.fotos[a.id]); const al = als[Math.floor(Math.random() * als.length)], outros = alunosOf(turma()).filter(a => a.id !== al.id).sort(() => Math.random() - .5).slice(0, 3);
  QQ.al = al; QQ.ops = [al, ...outros].sort(() => Math.random() - .5); QQ.resp = null; }
function sheetQuem(open) {
  const t = turma(); if (alunosOf(t).filter(a => S.fotos[a.id]).length < 4) { toast('São precisas pelo menos 4 fotografias. Faça primeiro uma sessão de fotografias.'); return; }
  if (open) { QQ.ok = 0; QQ.n = 0; quemNovo(); }
  const r = QQ.resp, body = `<div class="fses"><div class="fses-p"><span>${QQ.ok} certas em ${QQ.n}</span></div><div class="fses-a">${avatar(QQ.al, 'xl')}</div>
    <div class="qq">${QQ.ops.map(o => `<button class="btn${r ? (o.id === QQ.al.id ? ' ok' : o.id === r ? ' bad' : '') : ''}" data-a="qq-r" data-id="${esc(o.id)}"${r ? ' disabled' : ''}>${esc(o.nome)}</button>`).join('')}</div>
    ${r ? `<button class="btn primary big" data-a="qq-next">Seguinte ›</button>` : '<p class="hint">Quem é? Ótimo para aprender os nomes no início do ano.</p>'}</div>`;
  if (open || $('#sheet').hidden) openSheet('Quem é quem?', body, ''); else updSheet(body, '');
}
const _vAlunos58 = vAlunos;
vAlunos = function (t) { return _vAlunos58(t).replace('<button class="btn" data-a="fotos-import">Fotografias</button>', '<button class="btn" data-a="fotos-import">Fotografias</button><button class="btn" data-a="fs-open">Sessão de fotografias</button><button class="btn" data-a="qq-open">Quem é quem?</button>'); };
const _applyLook58 = applyLook;
applyLook = function () { _applyLook58(); document.body.classList.toggle('fotog', !!UI.fotoG); };
const _vAparencia58 = vAparencia;
vAparencia = function () { return _vAparencia58().replace('<p class="hint" style="margin:0">Estas opções', `<label class="cli"><input type="checkbox" data-in="foto-g"${UI.fotoG ? ' checked' : ''}> Fotografias maiores na grelha de avaliação</label><p class="hint" style="margin:0">Estas opções`); };

/* K. Comparar turmas */
const media = xs => { const v = xs.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : null; };
function vComparar() {
  const ts = Object.values(S.turmas).sort(byNome).filter(t => (t.alunos || []).length); if (ts.length < 2) return '';
  const ps = CFG.per.slice(0, CFG.nper).map((_, i) => i + 1), p = UI.p, R = new Map(ts.map(t => [t.id, Object.fromEntries(ps.map(q => [q, alunosOf(t).map(al => calc(t, q, al))]))]));
  const ser = ts.slice(0, 8).map(t => ({name:t.nome, color:`var(--v${tcor(t)})`, vals:ps.map(q => media(R.get(t.id)[q].map(r => r.FIN)))}));
  let h = `<div class="sec-h"><h2>Comparar turmas</h2></div>`;
  if (ser.some(s => s.vals.some(x => x != null))) h += fig('Média final por período', 'Cada linha é uma turma (0–20)', chLine(ps.map(q => perLabel(q)), ser, {h:200, label:'Média final por turma'}) + legend(ser));
  h += fig('Média final · ' + perLabel(p, true), 'Turmas lado a lado', chBars(ts.map(t => ({label:t.nome, v:media(R.get(t.id)[p].map(r => r.FIN)), color:`var(--v${tcor(t)})`})), {label:'Média final por turma'}));
  const ms = [...new Set(ts.flatMap(t => matsOf(t, p)))].filter(m => ts.filter(t => matsOf(t, p).includes(m)).length >= 2);
  const ate = r => m => r.lv[m] && LV.indexOf(r.lv[m]) >= LV.indexOf('E');
  h += `<div class="card"><div class="tbl-wrap"><table class="cmp"><thead><tr><th class="l">Turma</th><th>Alunos</th><th>Média</th><th>Aptos</th><th>Vaivém na ZS</th><th>Faltas por aluno</th>${ms.map(m => `<th title="Alunos no nível Elementar ou acima">${esc(m)} ≥ E</th>`).join('')}</tr></thead><tbody>${ts.map(t => { const rs = R.get(t.id)[p], n = rs.length, zs = rs.map(r => r.zones.vaivem).filter(x => x != null), f = alunosOf(t).reduce((s, al) => s + counts(t, p, al.id).F, 0);
    const pct = x => n ? Math.round(x / n * 100) + '%' : '—';
    return `<tr><td class="l"><span class="tdot" style="--tc:var(--v${tcor(t)})"></span> ${esc(t.nome)}</td><td>${n}</td><td>${media(rs.map(r => r.FIN)) ?? '—'}</td><td>${pct(rs.filter(r => r.EST === 'Apto').length)}</td><td>${zs.length ? Math.round(zs.filter(z => z >= 1).length / zs.length * 100) + '%' : '—'}</td><td>${n ? (Math.round(f / n * 10) / 10).toLocaleString('pt-PT') : '—'}</td>${ms.map(m => matsOf(t, p).includes(m) ? `<td>${pct(rs.filter(r => ate(r)(m)).length)}</td>` : '<td class="muted">—</td>').join('')}</tr>`; }).join('')}</tbody></table></div><p class="hint" style="margin:6px 0 0">${esc(perLabel(p, true))}. As matérias aparecem quando são dadas em pelo menos duas turmas.</p></div>`;
  return h;
}
const _vGraficos58 = vGraficos;
vGraficos = function (t) { return _vGraficos58(t) + vComparar(); };

/* L. Diplomas de unidade */
const DIPN = {I:'Introdução', E:'Elementar', A:'Avançado'};
const DIPMIN = {I:'I', E:'E', A:'A'};
function diplomados(t, p, m, k) { const v = avalOf(t.id, p); return alunosOf(t).filter(al => { const x = lvOf(v, al.id, m); return x && LV.indexOf(x.l) >= LV.indexOf(DIPMIN[k]); }); }
function diplomaHtml(t, al, m, k) {
  return `<section class="rel dipl"><div class="dp-in"><div class="dp-selo">${selo(k, true)}</div><div class="dp-k">Diploma · Educação Física</div>
    <p class="dp-c">Certifica-se que</p><div class="dp-n">${esc(al.nome)}</div><p class="dp-c">concluiu o nível <b>${DIPN[k]}</b> de</p><div class="dp-m">${subIcon(m, anoOf(t))} ${esc(m)}</div>
    <p class="dp-s">${esc(t.nome)} · ${esc(CFG.escola || 'Escola')} · Ano letivo ${esc(CFG.ano)}</p>
    <div class="dp-f"><div><span>${esc(fmtDate(today(), {day:'numeric', month:'long', year:'numeric'}))}</span><i></i><small>Data</small></div><div><span>${esc(CFG.prof || '')}</span><i></i><small>O professor de Educação Física</small></div></div></div></section>`;
}
function sheetDiplomas() {
  const t = turma(), ms = [...new Set(CFG.per.slice(0, CFG.nper).flatMap((_, i) => matsOf(t, i + 1)))];
  UI.dip = Object.assign({m:ms[0] || '', k:'E'}, UI.dip || {}); if (!ms.includes(UI.dip.m)) UI.dip.m = ms[0] || '';
  const D = UI.dip, als = D.m ? diplomados(t, UI.p, D.m, D.k) : [];
  const body = `<div class="form"><div class="field"><label for="dp-m">Matéria</label><select id="dp-m" data-in="dip" data-k="m">${ms.map(m => `<option${m === D.m ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select></div>
    <div class="field"><span class="lbl">Nível concluído</span><div class="seg block">${['I', 'E', 'A'].map(k => `<button data-a="dip-k" data-k="${k}" class="${D.k === k ? 'on' : ''}">${DIPN[k]}</button>`).join('')}</div></div>
    <p class="small" style="margin:0">${als.length ? `<b>${als.length}</b> ${als.length === 1 ? 'aluno concluiu' : 'alunos concluíram'} este nível no ${esc(perLabel(UI.p, true))}: ${esc(als.map(a => a.nome.split(' ')[0]).join(', '))}.` : 'Nenhum aluno concluiu ainda este nível neste período.'}</p></div>`;
  const foot = `<button class="btn" data-a="sh-close">Fechar</button><button class="btn primary" data-a="dip-go"${als.length ? '' : ' disabled'}>Ver ${als.length} ${als.length === 1 ? 'diploma' : 'diplomas'}</button>`;
  if ($('#sheet').hidden) openSheet('Diplomas de unidade', body, foot); else updSheet(body, foot);
}

/* M. Arrastar para mudar a ordem (plano do período) e a data das aulas (calendário) */
const _planoRender58 = planoRender;
planoRender = function (open) {
  _planoRender58(open);
  $$('#sheet .pl-ed').forEach((r, i) => { if (r.querySelector('.drag-h')) return; r.dataset.i = i; const b = document.createElement('button'); b.className = 'drag-h'; b.type = 'button'; b.setAttribute('aria-label', 'Arrastar para mudar a ordem (ou setas para cima e para baixo)'); b.textContent = '⠿'; r.prepend(b); });
};
let DRG = null;
document.addEventListener('pointerdown', e => {
  const hnd = e.target.closest && e.target.closest('#sheet .drag-h'); if (!hnd) return;
  const it = hnd.closest('.pl-ed'); e.preventDefault(); hnd.setPointerCapture && hnd.setPointerCapture(e.pointerId);
  DRG = {it, y:e.clientY}; it.classList.add('drag');
});
document.addEventListener('pointermove', e => {
  if (!DRG) return; const it = DRG.it, sib = [...it.parentNode.querySelectorAll('.pl-ed')].filter(x => x !== it);
  const alvo = sib.find(x => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
  if (alvo) { if (it.nextElementSibling !== alvo) alvo.before(it); } else { const last = sib[sib.length - 1]; if (last && last.nextElementSibling !== it) last.after(it); }
});
const planoReordenar = ordem => { if (ordem.some((x, i) => x !== i)) { UI.draft = ordem.map(i => UI.draft[i]); } planoRender(); };
document.addEventListener('pointerup', () => { if (!DRG) return; const it = DRG.it; DRG = null; it.classList.remove('drag'); planoReordenar([...it.parentNode.querySelectorAll('.pl-ed')].map(x => +x.dataset.i)); });
document.addEventListener('keydown', e => { const hnd = e.target.closest && e.target.closest('#sheet .drag-h'); if (!hnd || !/^Arrow(Up|Down)$/.test(e.key)) return; e.preventDefault();
  const i = +hnd.closest('.pl-ed').dataset.i, j = i + (e.key === 'ArrowUp' ? -1 : 1); if (j < 0 || j >= UI.draft.length) return; const o = UI.draft.map((_, k) => k); [o[i], o[j]] = [o[j], o[i]]; planoReordenar(o);
  const b = $$('#sheet .drag-h')[j]; if (b) b.focus(); });
// Calendário: com o rato, arrasta-se a lição para outro dia; no telemóvel, toque longo na lição e depois toque no dia novo.
const CALMV = {aid:null, drag:null, tm:null, sup:false};
function calMover(aid, iso) {
  const a = S.aulas[aid]; if (!a || !iso || a.data === iso) return false;
  if (aulasOf(a.turmaId).some(x => x.data === iso)) { toast('Já há uma aula nesse dia.', 'bad'); return false; }
  const de = a.data; a.data = iso; Store.save('aulas', a); render();
  toast(`Lição passou de ${fmtDate(de, {day:'numeric', month:'short'})} para ${fmtDate(iso, {weekday:'short', day:'numeric', month:'short'})}${semAulas(iso) ? ' (dia sem aulas no calendário)' : ''}.`); return true;
}
const aulaDoDia = d => { const t = turma(); return t && aulasOf(t.id).find(a => a.data === d); };
const _calDia58 = A['cal-dia'];
A['cal-dia'] = el => { if (CALMV.aid) { const id = CALMV.aid; CALMV.aid = null; document.body.classList.remove('cal-mv'); $$('.cd.mv').forEach(x => x.classList.remove('mv')); if (S.aulas[id] && S.aulas[id].data === el.dataset.d) return; calMover(id, el.dataset.d); return; } _calDia58(el); };
document.addEventListener('pointerdown', e => {
  const c = e.target.closest && e.target.closest('.cal .cd.au'); if (!c) return; const a = aulaDoDia(c.dataset.d); if (!a) return;
  if (e.pointerType === 'mouse') { CALMV.drag = {aid:a.id, x:e.clientX, y:e.clientY, on:false, from:c}; return; }
  clearTimeout(CALMV.tm); const x0 = e.clientX, y0 = e.clientY;
  CALMV.tm = setTimeout(() => { CALMV.aid = a.id; CALMV.sup = true; c.classList.add('mv'); document.body.classList.add('cal-mv'); try { navigator.vibrate && navigator.vibrate(30); } catch (er) {} toast('Toque no dia para onde quer passar a lição.'); }, 450);
  CALMV.p0 = [x0, y0];
});
document.addEventListener('pointermove', e => {
  if (CALMV.tm && CALMV.p0 && Math.hypot(e.clientX - CALMV.p0[0], e.clientY - CALMV.p0[1]) > 10) { clearTimeout(CALMV.tm); CALMV.tm = null; }
  const D = CALMV.drag; if (!D) return;
  if (!D.on && Math.hypot(e.clientX - D.x, e.clientY - D.y) > 6) { D.on = true; document.body.classList.add('cal-drag'); D.from.classList.add('mv'); }
  if (D.on) { $$('.cd.drop').forEach(x => x.classList.remove('drop')); const t = document.elementFromPoint(e.clientX, e.clientY), cd = t && t.closest('.cal .cd'); if (cd && cd !== D.from) cd.classList.add('drop'); }
});
document.addEventListener('pointerup', e => {
  clearTimeout(CALMV.tm); CALMV.tm = null; const D = CALMV.drag; CALMV.drag = null; if (!D || !D.on) return;
  document.body.classList.remove('cal-drag'); $$('.cd.drop, .cd.mv').forEach(x => x.classList.remove('drop', 'mv')); CALMV.sup = true;
  const t = document.elementFromPoint(e.clientX, e.clientY), cd = t && t.closest('.cal .cd'); if (cd && cd.dataset.d) calMover(D.aid, cd.dataset.d);
});
window.addEventListener('click', e => { if (CALMV.sup) { CALMV.sup = false; if (e.target.closest && e.target.closest('.cal')) { e.stopPropagation(); e.preventDefault(); } } }, true);
document.addEventListener('pointercancel', () => { clearTimeout(CALMV.tm); CALMV.tm = null; });

/* N. Gestos: deslizar um aluno na lista de presenças */
const _openSheet58 = openSheet;
openSheet = function (title, body, foot) {
  if (typeof body === 'string' && body.includes('data-a="d-pres"')) body = body.replace('<div class="list"><div class="pr">', '<p class="hint swipe-h">Deslize um aluno para a esquerda para marcar falta, para a direita para atraso. Volte a deslizar para o pôr presente.</p><div class="list"><div class="pr">');
  return _openSheet58(title, body, foot);
};
let SWP = null;
document.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const r = e.target.closest && e.target.closest('#sheet .pr'); if (!r || e.target.closest('.ps')) return; SWP = {r, x:e.clientX, y:e.clientY, dx:0, on:false}; });
document.addEventListener('pointermove', e => {
  if (!SWP) return; const dx = e.clientX - SWP.x, dy = e.clientY - SWP.y;
  if (!SWP.on && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { SWP = null; return; }
  if (Math.abs(dx) > 8) SWP.on = true;
  if (SWP.on) { SWP.dx = dx; SWP.r.style.transform = `translateX(${Math.max(-90, Math.min(90, dx))}px)`; SWP.r.classList.toggle('sw-f', dx < -50); SWP.r.classList.toggle('sw-a', dx > 50); }
});
function swipeFim() {
  if (!SWP) return; const {r, dx, on} = SWP; SWP = null; r.style.transform = ''; r.classList.remove('sw-f', 'sw-a'); if (!on || Math.abs(dx) < 60) return;
  const alvo = dx < 0 ? 'F' : 'A', cur = r.querySelector('.ps button.on'), s = cur && cur.dataset.s === alvo ? 'P' : alvo, b = r.querySelector(`.ps button[data-s="${s}"]`);
  if (b) { b.click(); r.classList.add('sw-ok'); setTimeout(() => r.classList.remove('sw-ok'), 400); }
}
document.addEventListener('pointerup', swipeFim); document.addEventListener('pointercancel', swipeFim);

Object.assign(A, {
  'sem-ir': el => { const t = S.turmas[el.dataset.id]; if (!t) return; UI.turma = t.id; const a = aulasOf(t.id).find(x => x.data === el.dataset.d);
    if (a) { UI.tab = 'turma'; UI.tsub = 'aulas'; render(); A['aula-edit']({dataset:{id:a.id}}); } else if (el.dataset.d === today()) { UI.tab = 'turma'; UI.tsub = 'aulas'; render(); A['aula-new'](null, null, el.dataset.d); } else { UI.tab = 'turma'; render(); } },
  'fs-open': () => { const als = alunosOf(turma()), i = als.findIndex(a => !S.fotos[a.id]); FSES = i < 0 ? 0 : i; camInput(); sheetFotoSessao(true); },
  'fs-cam': () => camInput().click(),
  'fs-mv': el => { FSES = Math.max(0, Math.min(alunosOf(turma()).length - 1, FSES + +el.dataset.d)); sheetFotoSessao(); },
  'qq-open': () => sheetQuem(true),
  'qq-r': el => { QQ.resp = el.dataset.id; QQ.n++; if (el.dataset.id === QQ.al.id) QQ.ok++; sheetQuem(); },
  'qq-next': () => { quemNovo(); sheetQuem(); },
  'doc-dipl': () => sheetDiplomas(),
  'dip-k': el => { UI.dip.k = el.dataset.k; sheetDiplomas(); },
  'dip-go': () => { const t = turma(), D = UI.dip, als = diplomados(t, UI.p, D.m, D.k); closeSheet(); printDoc('Diplomas · ' + D.m, als.map(al => diplomaHtml(t, al, D.m, D.k)).join('')); }
});
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'dip') { UI.dip[el.dataset.k] = el.value; sheetDiplomas(); }
  else if (k === 'foto-g') { UI.fotoG = el.checked; saveUI(); render(); } });
