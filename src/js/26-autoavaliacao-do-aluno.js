/* ---------- autoavaliação do aluno ---------- */
function sheetAuto(aid) {
  const t = turma(), al = (t.alunos || []).find(x => x.id === aid); if (!al) return;
  const v = avalOf(t.id, UI.p); UI.draft = Object.assign({aid, lv:{}, av:{}, txt:''}, clone((v.auto || {})[aid] || {})); UI.draft.aid = aid;
  autoRender(true);
}
function autoRender(open) {
  const t = turma(), d = UI.draft, al = (t.alunos || []).find(x => x.id === d.aid), ms = matsOf(t, UI.p), als = alunosOf(t), i = als.findIndex(x => x.id === d.aid);
  const body = `<div class="form auto"><div class="foto-ed">${avatar(al, 'lg')}<div><h3 style="font-size:22px">${esc(al.nome)}</h3><p class="hint" style="margin:4px 0 0">Autoavaliação · ${esc(perLabel(UI.p, true))}. Responde com sinceridade: serve para conversares com o professor sobre o que já sabes fazer e o que queres melhorar.</p></div></div>
    ${ms.map(m => `<div class="field"><span class="lbl">${esc(m)}: que nível achas que tens?</span><div class="lvls">${LV.map(l => `<button class="lv ${l}${d.lv[m] === l ? ' on' : ''}" data-a="auto-lv" data-m="${esc(m)}" data-l="${l}" title="${esc(LVN[l])}">${l}</button>`).join('')}</div><span class="hint">${d.lv[m] ? esc(LVN[d.lv[m]]) : 'NI: ainda não atinjo a Introdução · I: Introdução · E: Elementar · A: Avançado · P = parte do nível'}</span></div>`).join('') || '<p class="hint">Ainda não há matérias neste período.</p>'}
    ${Object.keys(AVW).map(k => `<div class="field"><span class="lbl">${esc(AVN[k])}</span><div class="aopt">${AVD[k].map((x, j) => `<button class="${d.av[k] === j ? 'on' : ''}" data-a="auto-av" data-k="${k}" data-i="${j}"><b>${j + 1}</b> ${esc(x)}</button>`).join('')}</div></div>`).join('')}
    <div class="field"><label for="auto-txt">O que queres melhorar e como?</label><textarea id="auto-txt" placeholder="Ex.: Quero melhorar a manchete no voleibol, treinando nos intervalos.">${esc(d.txt || '')}</textarea></div></div>`;
  const foot = `<button class="btn" data-a="auto-save">Guardar</button>${i < als.length - 1 ? `<button class="btn primary" data-a="auto-save" data-next="1">Guardar e passar a ${esc(als[i + 1].nome.split(' ')[0])}</button>` : ''}`;
  if (open) openSheet('Autoavaliação', body, foot); else { const y = $('#sheet .sh-b').scrollTop; updSheet(body, foot); $('#sheet .sh-b').scrollTop = y; }
}
function autoCompare(t, p, al) {
  const a = (avalOf(t.id, p).auto || {})[al.id]; if (!a) return '';
  const r = calc(t, p, al), ms = [...new Set([...Object.keys(a.lv || {}), ...Object.keys(r.lv)])];
  const diff = (x, y) => x == null || y == null ? '' : x === y ? '=' : LVP[x] > LVP[y] ? '▲' : '▼';
  return `<table class="rel-t auto-t"><thead><tr><th class="l">Matéria / critério</th><th>Aluno</th><th>Professor</th><th></th></tr></thead><tbody>${ms.map(m => `<tr><td class="l">${esc(m)}</td><td>${esc((a.lv || {})[m] || '—')}</td><td>${esc(r.lv[m] || '—')}</td><td>${diff((a.lv || {})[m], r.lv[m])}</td></tr>`).join('')}${Object.keys(AVW).map(k => { const x = (a.av || {})[k], y = r.ix[k]; return `<tr><td class="l">${esc(AVN[k])}</td><td>${x != null ? x + 1 : '—'}</td><td>${y != null ? y + 1 : '—'}</td><td>${x == null || y == null ? '' : x === y ? '=' : x > y ? '▲' : '▼'}</td></tr>`; }).join('')}</tbody></table>${a.txt ? `<p class="small"><b>O aluno escreveu:</b> ${esc(a.txt)}</p>` : ''}<p class="hint">▲ o aluno avalia-se acima do professor · ▼ abaixo · = igual.</p>`;
}

