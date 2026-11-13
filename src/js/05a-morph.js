/* ---------- atualização do ecrã sem redesenhar tudo ---------- */
// Compara o HTML novo com o que está no ecrã e só muda o que mudou: mantém o scroll, o foco, o texto a ser escrito e o que está aberto.
function morph(el, html) { const t = document.createElement('template'); t.innerHTML = html; morphKids(el, t.content); }
function morphKids(a, b) {
  const an = [...a.childNodes], bn = [...b.childNodes];
  bn.forEach((n, i) => { const o = an[i]; if (!o) a.appendChild(n); else morphNode(o, n); });
  for (let i = an.length - 1; i >= bn.length; i--) an[i].remove();
}
function morphNode(o, n) {
  if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName || (o.nodeType === 1 && o.id !== n.id)) { o.replaceWith(n); return; }
  if (o.nodeType !== 1) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
  for (const at of [...o.attributes]) if (!n.hasAttribute(at.name) && !(at.name === 'open' && o.nodeName === 'DETAILS')) o.removeAttribute(at.name);
  for (const at of [...n.attributes]) if (o.getAttribute(at.name) !== at.value) o.setAttribute(at.name, at.value);
  const focused = o === document.activeElement;
  if (o.nodeName === 'INPUT') { if (!focused) { o.value = n.getAttribute('value') ?? ''; o.checked = n.hasAttribute('checked'); } return; }
  if (o.nodeName === 'TEXTAREA') { if (!focused) o.value = n.textContent; return; }
  morphKids(o, n);
  if (o.nodeName === 'SELECT' && !focused) { const s = n.querySelector('option[selected]'); o.value = s ? s.value : (o.options[0] ? o.options[0].value : ''); }
}
