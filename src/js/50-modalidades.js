/* ---------- modalidades: as do professor e as de cada período ---------- */
// O professor pode criar modalidades que não estão nas listas oficiais (CFG.matsX = [{m, sub}]): entram nas escolhas de
// todas as turmas, com o subdomínio indicado, avaliam-se por nível (e indicadores) e não têm competências oficiais.
const minhas = () => ((CFG && CFG.matsX) || []).map(x => x.m);
const isMinha = m => minhas().includes(m);
function matsXAplicar() { ((CFG && CFG.matsX) || []).forEach(x => { ['1', '2', '3', 'S'].forEach(c => { if (MATS[c] && !MATS[c].includes(x.m)) MATS[c].push(x.m); }); SUBD[x.m] = x.sub || 'OUT'; }); }
(function esperar() { if (!CFG) { setTimeout(esperar, 200); return; } matsXAplicar(); })();
const temNiveis = (v, m) => Object.values(v.af || {}).some(o => o && o[m]);
function sheetMatsPer() {
  const t = turma(), p = UI.p, v = avalOf(t.id, p), cur = matsOf(t, p), pl = planOf(t, p).map(u => u.m);
  const body = `<div class="form"><p class="hint">As modalidades do ${esc(perLabel(p, true))}: toque para juntar ou retirar. As do plano do período e as das aulas entram sozinhas; cada período tem a sua lista.</p>
    <div class="chips"><b class="small" style="width:100%">Neste período (${cur.length})</b>${cur.map(m => `<button class="chip on" data-a="mp-t" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}${pl.includes(m) ? ' <span class="muted small">plano</span>' : ''}</button>`).join('') || '<span class="hint">Nenhuma ainda.</span>'}</div>
    <div class="lbl" style="margin-top:6px">Juntar</div>${matChips(t, m => cur.includes(m) ? '' : `<button class="chip" data-a="mp-t" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`)}
    ${p > 1 ? `<button class="btn sm" data-a="mp-copy">Copiar as modalidades do ${esc(perLabel(p - 1, true))}</button>` : ''}
    <div class="card form" style="gap:8px"><b>Nova modalidade</b><p class="hint" style="margin:0">Para modalidades que não estão nas listas (ex.: Boccia, Slackline, Tag rugby). Avaliam-se por nível e por indicadores que criar.</p>
      <div class="mp-new"><input type="text" id="mp-n" placeholder="Nome da modalidade" aria-label="Nome da modalidade"><select id="mp-s" aria-label="Subdomínio">${Object.entries(SUBN).filter(([k]) => k !== 'JOG').map(([k, n]) => `<option value="${k}"${k === 'OUT' ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><button class="btn" data-a="mp-new">Criar e juntar</button></div>
      ${minhas().length ? `<p class="small muted" style="margin:0">As minhas modalidades: ${minhas().map(m => `${esc(m)} <button class="link" data-a="mp-del" data-m="${esc(m)}">apagar</button>`).join(' · ')}</p>` : ''}</div></div>`;
  if ($('#sheet').hidden) openSheet('Modalidades do ' + perLabel(p, true), body, `<button class="btn primary" data-a="mp-ok">Feito</button>`); else { const b = $('#sheet .sh-b'), y = b.scrollTop; updSheet(body, `<button class="btn primary" data-a="mp-ok">Feito</button>`); b.scrollTop = y; }
}
function mpJuntar(v, m) { v.materias = [...new Set([...(v.materias || []), m])]; v.matsOff = (v.matsOff || []).filter(x => x !== m); }
Object.assign(A, {
  'mats-per': () => sheetMatsPer(),
  'mp-t': el => { const t = turma(), v = avalOf(t.id, UI.p), m = el.dataset.m;
    if (matsOf(t, UI.p).includes(m)) { if (temNiveis(v, m)) { toast(`${m} já tem níveis neste período: apague-os na grelha antes de retirar a modalidade.`, 'bad'); return; }
      v.materias = (v.materias || []).filter(x => x !== m); v.matsOff = [...new Set([...(v.matsOff || []), m])]; }
    else { mpJuntar(v, m); UI.mat = m; }
    touchAval(v); sheetMatsPer(); },
  'mp-copy': () => { const t = turma(), v = avalOf(t.id, UI.p); matsOf(t, UI.p - 1).forEach(m => mpJuntar(v, m)); touchAval(v); sheetMatsPer(); toast('Modalidades copiadas.'); },
  'mp-new': () => { const n = ($('#mp-n').value || '').trim().replace(/\s+/g, ' '), sub = $('#mp-s').value; if (!n) { toast('Escreva o nome da modalidade.', 'bad'); return; }
    const t = turma(), ex = [...new Set(Object.values(MATS).flat())].find(m => norm(m) === norm(n));
    let m = ex; if (!ex) { CFG.matsX = CFG.matsX || []; CFG.matsX.push({m:n, sub}); m = n; Store.save('cfg', CFG); matsXAplicar(); }
    const v = avalOf(t.id, UI.p); mpJuntar(v, m); touchAval(v); sheetMatsPer(); toast(ex ? `${m} já existia: juntada ao período.` : `${m} criada e juntada ao período.`); },
  'mp-del': el => { if (!armed(el, 'confirmar')) return; const m = el.dataset.m; CFG.matsX = (CFG.matsX || []).filter(x => x.m !== m); Store.save('cfg', CFG); Object.values(MATS).forEach(l => { const i = l.indexOf(m); if (i >= 0) l.splice(i, 1); }); sheetMatsPer(); },
  'mp-ok': () => { closeSheet(); render(); }
});

/* aptidão física que transita para o último período */
function vFitTrans() {
  return `<div class="sec-h"><h2>Aptidão física no último período</h2></div><div class="card form"><label class="cli"><input type="checkbox" data-in="fit-trans"${CFG.fitTransita !== false ? ' checked' : ''}> <span><b>A classificação do ${esc(perLabel(Math.max(1, CFG.nper - 1), true))} transita para o ${esc(perLabel(CFG.nper, true))}</b><br><span class="hint">Os resultados aparecem na grelha a cinzento. Se o aluno repetir um teste e melhorar, conta o melhor; se piorar, mantém-se o anterior.</span></span></label></div>`;
}
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'fit-trans') { CFG.fitTransita = el.checked; Store.save('cfg', CFG); render(); } });
