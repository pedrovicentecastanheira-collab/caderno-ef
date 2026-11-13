/* ---------- lesões e dispensas: regime por período ---------- */
const DTIPOS = ['Dispensa Parcial 1', 'Dispensa Parcial 2', 'Dispensa Total', 'Apenas registo'];
const RANK = {'Normal':0, 'Apenas registo':0, 'Dispensa Parcial 1':1, 'Dispensa Parcial 2':2, 'Dispensa Total':3};
const dayN = iso => Math.round(new Date(iso + 'T12:00:00') / 864e5);
// Uma dispensa muda o regime de cálculo de um período quando cobre pelo menos metade dele (até hoje, se o período estiver a decorrer).
function regAt(al, p = UI.p) {
  let r = al.regime || 'Normal'; const per = CFG.per[p - 1]; if (!per || !per.ini || !per.fim || !(al.disp || []).length) return r;
  const t = today(), s = per.ini, e = t < per.ini || t > per.fim ? per.fim : t, span = dayN(e) - dayN(s) + 1;
  (al.disp || []).forEach(d => { if (!d.ini || !RANK[d.tipo]) return; const a = d.ini > s ? d.ini : s, f = d.fim || e, b = f < e ? f : e; if (a > b) return; if ((dayN(b) - dayN(a) + 1) * 2 >= span && RANK[d.tipo] > RANK[r]) r = d.tipo; });
  return r;
}
const dispOn = (al, iso) => (al.disp || []).find(d => d.ini && d.ini <= iso && (!d.fim || d.fim >= iso));
function dispAlerts(ts) {
  const out = [], t = today();
  ts.forEach(tm => (tm.alunos || []).forEach(al => (al.disp || []).forEach(d => {
    if (!d.fim) return; const n = dayN(d.fim) - dayN(t);
    if (n >= 0 && n <= 7) out.push({k:'warn', tid:tm.id, aid:al.id, txt:`${al.nome.split(' ')[0]} (${tm.nome}): ${d.tipo.toLowerCase()} termina ${n === 0 ? 'hoje' : n === 1 ? 'amanhã' : 'a ' + fmtDate(d.fim, {day:'numeric', month:'short'})}.`});
    else if (n < 0 && n >= -7) out.push({k:'info', tid:tm.id, aid:al.id, txt:`${al.nome.split(' ')[0]} (${tm.nome}): a dispensa terminou a ${fmtDate(d.fim, {day:'numeric', month:'short'})}. Confirme se volta à prática normal.`});
  })));
  return out;
}
function dispHtml(al) {
  const ds = al.disp || [];
  return `<div class="field"><span class="lbl">Lesões e dispensas</span><p class="hint" style="margin:0">Com datas, a dispensa marca o aluno como dispensado (D) nas aulas desse intervalo e muda o regime de cálculo do período quando cobre pelo menos metade dele.</p>
    ${ds.map((d, i) => `<div class="card disp"><div class="grid2"><div class="field"><label>Tipo</label><select data-in="disp" data-i="${i}" data-k="tipo">${DTIPOS.map(x => `<option${d.tipo === x ? ' selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Motivo</label><input type="text" data-in="disp" data-i="${i}" data-k="motivo" value="${esc(d.motivo || '')}" placeholder="Ex.: entorse do tornozelo"></div></div>
      <div class="grid2"><div class="field"><label>Início</label><input type="date" data-in="disp" data-i="${i}" data-k="ini" value="${esc(d.ini || '')}"></div><div class="field"><label>Fim</label><input type="date" data-in="disp" data-i="${i}" data-k="fim" value="${esc(d.fim || '')}"></div></div>
      <div class="btn-row">${d.doc && S.docs[d.doc] ? `<button class="btn" data-a="doc-ver" data-id="${esc(d.doc)}">Ver atestado</button>` : ''}<button class="btn" data-a="doc-anexar" data-i="${i}">${d.doc ? 'Trocar atestado' : 'Anexar atestado'}</button><button class="btn danger" data-a="disp-del" data-i="${i}">Remover</button></div></div>`).join('')}
    <button class="btn" style="align-self:flex-start" data-a="disp-add">+ Registar lesão ou dispensa</button></div>`;
}
function dataURLtoBlob(u) { const [h, b] = u.split(','), mime = /:(.*?);/.exec(h)[1], bin = atob(b), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], {type:mime}); }
async function docFromFile(f) {
  if (/^image\//.test(f.type)) {
    const im = await loadImg(f), k = Math.min(1, (Store.mode === 'cloud' ? 1000 : 1400) / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .7);
  }
  if (f.type === 'application/pdf' && f.size <= (Store.mode === 'cloud' ? 1.8e5 : 1.5e6)) return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  throw new Error('tipo');
}

