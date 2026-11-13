/* ---------- import students from Excel ---------- */
const IMPF = [['nome','Nome *'], ['num','N.º'], ['proc','N.º de processo'], ['sexo','Sexo'], ['nasc','Data de nascimento'], ['turma','Turma']];
const keyOf = s => norm(s).replace(/[^a-z0-9]/g, '');
const NOME_RE = /^(nome|nomecompleto|nomedoaluno|nomealuno|aluno|alunos)$/;
function guessCiclo(nome) { const m = /\d{1,2}/.exec(String(nome || '')); const n = m ? +m[0] : 7; return n <= 4 ? '1' : n <= 6 ? '2' : n <= 9 ? '3' : 'S'; }
function guessCols(head) {
  const k = head.map(keyOf), used = new Set(), m = {};
  const pick = test => { const i = k.findIndex((x, j) => x && !used.has(j) && test(x)); if (i >= 0) used.add(i); return i; };
  m.proc = pick(x => /process|matricula/.test(x) || /^(proc|nproc|nmec|nmecanografico)$/.test(x));
  m.nome = pick(x => NOME_RE.test(x)); if (m.nome < 0) m.nome = pick(x => /nome/.test(x) && !/encarreg|enc|pai|mae|utilizador|abrev|curto/.test(x));
  m.num = pick(x => /^(n|no|nr|num|numero)(de)?(o)?(aluno|naturma|turma)?$/.test(x));
  m.sexo = pick(x => /sexo|genero/.test(x));
  m.nasc = pick(x => /nasc/.test(x));
  m.turma = pick(x => /turma/.test(x));
  return m;
}
function impLoadSheet(name) {
  const I = IMP; I.sheet = name;
  const rows = XLSX.utils.sheet_to_json(I.wb.Sheets[name], {header:1, raw:true, defval:'', blankrows:false});
  let hr = rows.slice(0, 20).findIndex(r => r.some(c => NOME_RE.test(keyOf(c))));
  if (hr < 0) hr = rows.slice(0, 20).findIndex(r => r.some(c => /nome/.test(keyOf(c))));
  const width = Math.max(0, ...rows.map(r => r.length));
  const letters = Array.from({length: width}, (_, i) => 'Coluna ' + XLSX.utils.encode_col(i));
  if (hr >= 0) { I.head = letters.map((l, i) => String(rows[hr][i] ?? '').trim() || l); I.data = rows.slice(hr + 1); I.cols = guessCols(I.head); }
  else {
    // sem cabeçalho: o nome é a coluna com mais textos de duas ou mais palavras; o n.º, a de inteiros pequenos
    I.head = letters; I.data = rows; I.cols = {num:-1, proc:-1, nome:-1, sexo:-1, nasc:-1, turma:-1};
    const score = f => letters.map((_, i) => rows.slice(0, 40).filter(r => f(r[i])).length);
    const best = arr => { const mx = Math.max(0, ...arr); return mx ? arr.indexOf(mx) : -1; };
    I.cols.nome = best(score(x => typeof x === 'string' && /\p{L}+\s+\p{L}+/u.test(x)));
    const nums = score(x => /^\d{1,2}$/.test(String(x).trim())); if (I.cols.nome >= 0) nums[I.cols.nome] = 0; I.cols.num = best(nums);
  }
}
function impStr(v) { return v == null ? '' : String(v).replace(/\s+/g, ' ').trim(); }
function impSexo(v) { const s = norm(v); return /^(f|fem|feminino|rapariga|menina)$/.test(s) ? 'F' : /^(m|h|masc|masculino|rapaz|menino)$/.test(s) ? 'M' : ''; }
function impDate(v) {
  if (typeof v === 'number' && v > 1000 && v < 80000) { const d = XLSX.SSF.parse_date_code(v); return d ? d.y + '-' + pad(d.m) + '-' + pad(d.d) : ''; }
  const s = impStr(v); let m, y, mo, d;
  if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(s))) [, y, mo, d] = m;
  else if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})\b/.exec(s))) { [, d, mo, y] = m; if (y.length === 2) y = (+y > new Date().getFullYear() % 100 ? '19' : '20') + y; }
  else return '';
  return +mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31 ? y + '-' + pad(+mo) + '-' + pad(+d) : '';
}
function titleCase(s) { return s.toLowerCase().split(' ').map((w, i) => i && /^(de|da|do|das|dos|e)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
function impRows() {
  const c = IMP.cols, get = (r, f) => c[f] >= 0 ? r[c[f]] : '';
  const out = [];
  IMP.data.forEach(r => {
    let nome = impStr(get(r, 'nome'));
    if (!nome || !/\p{L}/u.test(nome) || NOME_RE.test(keyOf(nome))) return;
    if (nome === nome.toUpperCase()) nome = titleCase(nome);
    const n = parseNum(get(r, 'num'));
    out.push({num: n != null && Number.isInteger(n) ? n : null, proc: impStr(get(r, 'proc')), nome, sexo: impSexo(get(r, 'sexo')), nasc: impDate(get(r, 'nasc')), turma: impStr(get(r, 'turma'))});
  });
  return out;
}
function impTurmas() { return [...new Set(impRows().map(x => x.turma).filter(Boolean))]; }
function findAluno(t, x) { return ((t && t.alunos) || []).find(a => (x.proc && a.proc && String(a.proc) === x.proc) || norm(a.nome) === norm(x.nome)); }
function impPlan() {
  const I = IMP; let list = impRows();
  const grp = (t, nome, ciclo, l) => { const nUpd = l.filter(x => findAluno(t, x)).length; return {t, nome, ciclo, list:l, nNew:l.length - nUpd, nUpd}; };
  if (I.dest === '__split') {
    const g = new Map(); list.forEach(x => { const k = x.turma || 'Sem turma'; if (!g.has(k)) g.set(k, []); g.get(k).push(x); });
    return [...g].map(([nome, l]) => { const t = Object.values(S.turmas).find(y => norm(y.nome) === norm(nome)); return grp(t, nome, t ? t.ciclo : guessCiclo(nome), l); });
  }
  if (I.filter) list = list.filter(x => norm(x.turma) === norm(I.filter));
  if (I.dest === '__new') return [grp(null, I.newName, I.newCiclo, list)];
  const t = S.turmas[I.dest]; return [grp(t, t.nome, t.ciclo, list)];
}
function impDefaults() {
  const I = IMP, ts = impTurmas(), cur = turma();
  const match = cur && ts.find(x => norm(x) === norm(cur.nome));
  I.filter = '';
  if (match) { I.dest = cur.id; I.filter = match; }
  else if (ts.length > 1) I.dest = '__split';
  else if (cur) I.dest = cur.id;
  else I.dest = '__new';
  I.newName = ts.length === 1 ? ts[0] : I.file.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
  I.newCiclo = guessCiclo(I.newName);
}
function sheetImport(update) {
  const I = IMP, plan = impPlan(), ts = impTurmas();
  const tot = plan.reduce((s, g) => s + g.list.length, 0), nNew = plan.reduce((s, g) => s + g.nNew, 0), nUpd = tot - nNew;
  const turmas = Object.values(S.turmas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', {numeric:true}));
  const opt = (v, l, on) => `<option value="${esc(v)}"${on ? ' selected' : ''}>${esc(l)}</option>`;
  const prev = plan.flatMap(g => g.list.map(x => ({x, g}))).slice(0, 8);
  const body = `<div class="form">
    <p class="hint">Ficheiro <b>${esc(I.file)}</b>. Confirme que cada campo está na coluna certa.</p>
    ${I.wb.SheetNames.length > 1 ? `<div class="field"><label for="imp-sheet">Folha</label><select id="imp-sheet" data-in="imp-sheet">${I.wb.SheetNames.map(n => opt(n, n, n === I.sheet)).join('')}</select></div>` : ''}
    <div class="grid2">${IMPF.map(([f, l]) => `<div class="field"><label for="imp-c-${f}">${l}</label><select id="imp-c-${f}" data-in="imp-col" data-f="${f}">${opt(-1, '— não usar —', I.cols[f] < 0)}${I.head.map((h, i) => opt(i, h, I.cols[f] === i)).join('')}</select></div>`).join('')}</div>
    <div class="field"><label for="imp-dest">Importar para</label><select id="imp-dest" data-in="imp-dest">
      ${turmas.map(x => opt(x.id, 'Turma ' + x.nome + ' (' + (x.alunos || []).length + ' alunos)', I.dest === x.id)).join('')}
      ${opt('__new', 'Nova turma…', I.dest === '__new')}
      ${I.cols.turma >= 0 && ts.length ? opt('__split', 'Uma turma por cada valor da coluna Turma (' + ts.length + ')', I.dest === '__split') : ''}
    </select></div>
    ${I.dest === '__new' ? `<div class="grid2"><div class="field"><label for="imp-tname">Nome da nova turma</label><input type="text" id="imp-tname" data-in="imp-tname" value="${esc(I.newName)}" placeholder="Ex.: 7.º B"></div>
      <div class="field"><label for="imp-ciclo">Ciclo</label><select id="imp-ciclo" data-in="imp-ciclo">${Object.entries(CICLOS).map(([k, n]) => opt(k, n, I.newCiclo === k)).join('')}</select></div></div>` : ''}
    ${I.dest !== '__split' && I.cols.turma >= 0 && ts.length > 1 ? `<div class="field"><label for="imp-filter">Linhas a importar</label><select id="imp-filter" data-in="imp-filter">${opt('', 'Todas as turmas do ficheiro', !I.filter)}${ts.map(x => opt(x, 'Só a turma ' + x, I.filter === x)).join('')}</select></div>` : ''}
    <div class="note ${tot ? '' : 'warn'}">${tot ? `<b>${tot} alunos</b>: ${nNew} novos${nUpd ? `, ${nUpd} já existem e são atualizados` : ''}${plan.length > 1 ? `, em ${plan.length} turmas (${plan.map(g => esc(g.nome) + (g.t ? '' : ' nova')).join(', ')})` : ''}.` : 'Não encontrei alunos. Escolha a coluna do nome.'}</div>
    ${prev.length ? `<div class="tbl-wrap"><table><thead><tr><th>N.º</th><th class="l">Nome</th><th>Sexo</th><th>Nascimento</th>${plan.length > 1 ? '<th>Turma</th>' : ''}</tr></thead><tbody>${prev.map(({x, g}) => `<tr><td>${esc(x.num ?? '')}</td><td class="l nm">${esc(x.nome)}</td><td>${esc(x.sexo || '—')}</td><td>${x.nasc ? esc(fmtDate(x.nasc, {day:'numeric', month:'short', year:'numeric'})) : '—'}</td>${plan.length > 1 ? `<td>${esc(g.nome)}</td>` : ''}</tr>`).join('')}</tbody></table></div>${tot > prev.length ? `<p class="hint">… e mais ${tot - prev.length}.</p>` : ''}` : ''}
    <p class="hint">Um aluno que já esteja na turma (mesmo n.º de processo ou mesmo nome) é atualizado, não duplicado. O regime, as observações, as presenças e as avaliações mantêm-se.</p>
  </div>`;
  const foot = `<button class="btn" data-a="sh-close">Cancelar</button><button class="btn primary" data-a="imp-go"${tot ? '' : ' disabled'}>Importar ${tot || ''} alunos</button>`;
  if (update) updSheet(body, foot); else openSheet('Importar alunos', body, foot);
}

