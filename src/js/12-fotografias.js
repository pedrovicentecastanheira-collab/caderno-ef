/* ---------- photos ---------- */
function loadImg(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); }; im.src = u; });
}
// Recorte quadrado (puxado para cima, onde costuma estar a cara), 128 px em JPEG: cerca de 6 KB por aluno.
async function thumb(file) {
  const im = await loadImg(file), w = im.naturalWidth, h = im.naturalHeight, s = Math.min(w, h), size = 128;
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high'; g.drawImage(im, (w - s) / 2, (h - s) * 0.3, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.78);
}
function matchFoto(fname, als) {
  const nb = norm(fname.replace(/\.[^.]+$/, '')).replace(/[_\-.,]+/g, ' ').trim();
  const byNum = d => als.find(x => x.proc && String(x.proc) === d) || als.find(x => x.num != null && String(x.num) === String(+d));
  if (/^\d+$/.test(nb.replace(/\s/g, ''))) return byNum(nb.replace(/\s/g, '')) || null;
  const words = nb.replace(/\d+/g, ' ').split(' ').filter(w => w.length > 1);
  if (words.length) { const c = als.filter(x => { const n = norm(x.nome).split(' '); return words.every(w => n.includes(w)); }); if (c.length === 1) return c[0]; }
  const d = (nb.match(/^\d+/) || [])[0]; return d ? byNum(d) || null : null;
}
function sheetFotos(nFail) {
  const als = alunosOf(turma()), n = FOTOS.filter(x => x.aid).length;
  openSheet('Fotografias', `<div class="form">
    <p class="hint">Associei <b>${n} de ${FOTOS.length}</b> automaticamente pelo nome do ficheiro (n.º de processo, n.º do aluno ou nome). Confirme e escolha o aluno nas restantes.${nFail ? ` ${nFail} ficheiros não são imagens que o navegador consiga abrir.` : ''}</p>
    <div class="list">${FOTOS.map((x, i) => `<div class="foto-row"><img src="${esc(x.d)}" alt=""><div class="who"><span class="fn">${esc(x.name)}</span><select data-in="foto-as" data-i="${i}" aria-label="Aluno da fotografia ${esc(x.name)}"><option value="">— Não associar —</option>${als.map(al => `<option value="${esc(al.id)}"${x.aid === al.id ? ' selected' : ''}>${esc(al.num ?? '')} · ${esc(al.nome)}${S.fotos[al.id] ? ' (já tem)' : ''}</option>`).join('')}</select></div></div>`).join('')}</div>
    <p class="hint">As fotografias são reduzidas para ocupar pouco espaço e ficam guardadas com os dados do caderno (também na cópia de segurança).</p></div>`,
    `<button class="btn" data-a="sh-close">Cancelar</button><button class="btn primary" data-a="fotos-go" id="fotos-go">Guardar ${n} fotografias</button>`);
}

