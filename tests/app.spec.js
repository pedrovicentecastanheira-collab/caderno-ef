// Testes de ponta a ponta do Caderno EF (Playwright). Cada teste começa sem dados (contexto novo).
import {test, expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const XLSX_FILE = fileURLToPath(new URL('../node_modules/xlsx/dist/xlsx.full.min.js', import.meta.url));
let errs;
test.beforeEach(async ({page}) => {
  errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // Sem internet nos testes: a biblioteca do Excel vem do node_modules e os tipos de letra não são carregados.
  await page.route(/cdnjs\.cloudflare\.com.*xlsx/, r => r.fulfill({path: XLSX_FILE, contentType: 'application/javascript'}));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});
test.afterEach(() => expect(errs, 'erros de JavaScript na página').toEqual([]));

const isMobile = testInfo => testInfo.project.name === 'telemovel';
async function demo(page) {
  await page.goto('/');
  await page.evaluate(() => makeDemo());
  await expect(page.locator('#top .turma-sel select')).toBeVisible();
}
const go = (page, tab) => page.locator(`#nav [data-a="tab"][data-t="${tab}"]`).click();

test('assistente inicial em três passos', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.wiz h1')).toHaveText('Bem-vindo');
  await page.fill('#w-escola', 'Escola Secundária do Exemplo'); await page.locator('#w-escola').blur();
  await page.click('[data-a="wiz"][data-s="2"]');
  await expect(page.locator('.wiz h1')).toHaveText('A primeira turma');
  await page.click('.wiz [data-a="demo"]');
  await expect(page.locator('.wiz-h')).toBeVisible();
  await page.click('[data-a="wiz-fim"]');
  await expect(page.locator('.wiz-h')).toHaveCount(0);
  expect(await page.evaluate(() => CFG.escola)).toBe('Escola Secundária do Exemplo');
});

test('navegação: 4 separadores, período, definições por secções', async ({page}) => {
  await demo(page);
  await expect(page.locator('#nav [data-a="tab"]')).toHaveCount(4);
  await page.selectOption('select.perchip', '2');
  expect(await page.evaluate(() => UI.p)).toBe(2);
  await page.click('#top .gear');
  await expect(page.locator('h1.ptitle')).toHaveText('Definições');
  await page.click('[data-a="dsec"][data-k="ver"]');
  await page.click('[data-a="ver"][data-k="zoom"][data-v="1.25"]');
  await page.click('[data-a="ver"][data-k="contrast"][data-v="high"]');
  await page.click('[data-a="ver"][data-k="theme"][data-v="dark"]');
  expect(await page.evaluate(() => [document.body.style.zoom, document.documentElement.dataset.contrast, document.documentElement.dataset.theme])).toEqual(['1.25', 'high', 'dark']);
});

test('grelha: lançar, realçar, desfazer duas vezes e histórico', async ({page}, ti) => {
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; render(); });
  const cell = page.locator('td.c[data-k="m:Voleibol"]').nth(0), before = await cell.textContent();
  await cell.click();
  await page.click('#ged [data-a="g-set"][data-v="A"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('A');
  await expect(page.locator('td.c.flash')).toHaveCount(1);
  await page.click('#ged [data-a="g-set"][data-v="NI"]'); // passou ao aluno seguinte
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(1)).toHaveText('NI');
  await page.click('[data-a="g-undo"]'); await page.click('[data-a="g-undo"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText(before);
  const ev = await page.evaluate(() => Object.values(S.hist)[0].ev.length);
  expect(ev).toBeGreaterThan(0);
  if (isMobile(ti)) {
    await page.locator('td.c[data-k="m:Voleibol"]').nth(2).click();
    await expect(page.locator('#ged')).toHaveClass(/min/);
    await page.click('#ged .ged-grab');
    await expect(page.locator('#ged')).not.toHaveClass(/min/);
  }
});

test('competências assinaladas definem o nível', async ({page}) => {
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; UI.gedOpen = true; UI.domOpen = true; render(); });
  await page.locator('td.c[data-k="m:Voleibol"]').nth(0).click();
  await page.evaluate(() => { UI.gedOpen = true; UI.domOpen = true; gEditor(); });
  await page.click('#ged [data-a="comp-all"][data-k="I"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('I');
  await page.click('#ged input[data-in="comp"][data-id="E0"]'); await page.click('#ged input[data-in="comp"][data-id="E1"]'); await page.click('#ged input[data-in="comp"][data-id="E2"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('PE');
  await expect(page.locator('#ged .domd summary')).toContainText('Para melhorar');
});

test('cartões: arrastar o aluno para outro nível', async ({page}, ti) => {
  test.skip(isMobile(ti), 'o toque longo é testado à parte');
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'cartoes'; render(); });
  const card = page.locator('.kc[data-v="PI"] .kcard').first(), nome = (await card.textContent()).trim(), cb = await card.boundingBox(), tb = await page.locator('.kc[data-v="E"]').boundingBox();
  await page.mouse.move(cb.x + 20, cb.y + 10); await page.mouse.down(); await page.mouse.move(cb.x + 40, cb.y + 20, {steps: 3}); await page.mouse.move(tb.x + 40, tb.y + 60, {steps: 8}); await page.mouse.up();
  await expect(page.locator('.kc[data-v="E"] .kcard', {hasText: nome.slice(2)})).toHaveCount(1);
});

test('cartões no telemóvel: toque longo e arrastar; deslizar não arrasta', async ({page}, ti) => {
  test.skip(!isMobile(ti), 'só telemóvel');
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'cartoes'; render(); });
  const r = await page.evaluate(async () => {
    const kb = document.getElementById('kb'); kb.scrollLeft = 300; await new Promise(r => setTimeout(r, 60));
    const card = document.querySelector('.kc[data-v="PI"] .kcard'), name = card.dataset.aid, cr = card.getBoundingClientRect(), tr = document.querySelector('.kc[data-v="I"]').getBoundingClientRect();
    const ev = (type, el, x, y, id) => el.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: x, clientY: y, pointerType: 'touch', pointerId: id}));
    ev('pointerdown', card, cr.x + 20, cr.y + 10, 1); await new Promise(r => setTimeout(r, 320));
    ev('pointermove', document, cr.x + 22, cr.y + 12, 1); ev('pointermove', document, tr.x + 30, tr.y + 50, 1); ev('pointerup', document, tr.x + 30, tr.y + 50, 1);
    await new Promise(r => setTimeout(r, 120));
    const moved = [...document.querySelectorAll('.kc[data-v="I"] .kcard')].some(x => x.dataset.aid === name);
    const c2 = document.querySelector('.kc[data-v="PA"] .kcard'), r2 = c2.getBoundingClientRect(), n0 = document.querySelectorAll('.kc[data-v="PA"] .kcard').length;
    ev('pointerdown', c2, r2.x + 10, r2.y + 10, 2); ev('pointermove', document, r2.x + 70, r2.y + 10, 2); ev('pointerup', document, r2.x - 150, r2.y + 10, 2);
    await new Promise(r => setTimeout(r, 350));
    return {moved, kept: n0 === document.querySelectorAll('.kc[data-v="PA"] .kcard').length};
  });
  expect(r).toEqual({moved: true, kept: true});
});

test('página do aluno: separadores, observação, dados e duas colunas no PC', async ({page}, ti) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="tsub"][data-k="alunos"]');
  if (!isMobile(ti)) await expect(page.locator('.split .split-r .apage')).toBeVisible();
  await page.locator('.li[data-a="aluno-edit"]').nth(2).click();
  await expect(page.locator('.apage .ap-nm h1')).toHaveText(await page.evaluate(() => alunosOf(turma())[2].nome));
  await expect(page.locator('.apage .retrato svg.viz')).toBeVisible();
  for (const k of ['comp', 'fit', 'ass', 'hist', 'resumo']) { await page.click(`[data-a="ap-tab"][data-k="${k}"]`); await expect(page.locator(`[data-a="ap-tab"][data-k="${k}"]`)).toHaveClass(/on/); }
  await page.click('[data-a="obs-sug"]');
  expect(await page.evaluate(() => Object.values(avalOf(turma().id, UI.p).obs || {}).length)).toBe(1);
  await page.click('[data-a="ap-edit"]');
  await expect(page.locator('#sheet #a-nome')).toBeVisible();
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  if (isMobile(ti)) { await page.click('[data-a="ap-back"]'); await expect(page.locator('.li[data-a="aluno-edit"]').first()).toBeVisible(); }
});

test('lesão ou dispensa: regime do período e D nas aulas novas', async ({page}) => {
  await demo(page);
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = alunosOf(turma())[1].id; render(); });
  await page.click('[data-a="ap-edit"]'); await page.click('[data-a="disp-add"]');
  await page.selectOption('select[data-in="disp"][data-k="tipo"]', 'Dispensa Total');
  for (const [k, v] of [['ini', '2026-09-14'], ['fim', '2027-06-18']]) { await page.fill(`input[data-in="disp"][data-k="${k}"]`, v); await page.dispatchEvent(`input[data-in="disp"][data-k="${k}"]`, 'change'); }
  await page.click('[data-a="aluno-save"]');
  expect(await page.evaluate(() => regAt(alunosOf(turma())[1], 1))).toBe('Dispensa Total');
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'aulas'; render(); });
  await page.click('[data-a="aula-new"]');
  expect(await page.evaluate(() => UI.draft.presencas[alunosOf(turma())[1].id])).toBe('D');
});

test('calendário do ano abre a aula do dia', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="aview"][data-k="cal"]');
  expect(await page.locator('.cd.au').count()).toBe(10);
  await page.locator('.cd.au').first().click();
  await expect(page.locator('#sheet .sh-h h2')).toHaveText('Lição 1');
});

test('relatório individual em PDF', async ({page, browserName}, ti) => {
  test.skip(isMobile(ti), 'o PDF gera-se no computador');
  await demo(page);
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = alunosOf(turma())[0].id; render(); });
  await page.click('.apage [data-a="rel-one"]');
  await expect(page.locator('#print .rel h1')).toBeVisible();
  await page.emulateMedia({media: 'print'});
  const pdf = await page.pdf({format: 'A4', printBackground: true});
  expect(pdf.length).toBeGreaterThan(30000);
});

test('importar turmas do Excel', async ({page}) => {
  await page.goto('/'); await page.waitForFunction(() => window.XLSX);
  await page.evaluate(() => {
    const rows = [['Nº', 'Nº Processo', 'Nome do Aluno', 'Sexo', 'Data Nasc.', 'Turma'], [1, 5001, 'ANA DA SILVA', 'F', '12/03/2013', '7B'], [2, 5002, 'BRUNO COSTA', 'M', '30/07/2013', '7B'], [1, 6001, 'DIOGO PIRES', 'M', '01/02/2012', '8A']];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Alunos');
    const dt = new DataTransfer(); dt.items.add(new File([XLSX.write(wb, {bookType: 'xlsx', type: 'array'})], 'turmas.xlsx'));
    const i = document.getElementById('file-xls'); i.files = dt.files; i.dispatchEvent(new Event('change'));
  });
  await page.click('[data-a="imp-go"]');
  expect(await page.evaluate(() => Object.values(S.turmas).map(t => t.nome + ':' + t.alunos.length + ':' + t.ano).sort())).toEqual(['7B:2:7', '8A:1:8']);
});

test('dados antigos do localStorage passam para o IndexedDB e são migrados', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('ef:turmas:t1', JSON.stringify({id: 't1', nome: '8.º C', ciclo: '3', escala: '0-20', alunos: [{id: 'a1', num: 1, nome: 'Rui Sá', sexo: 'M', nasc: '2012-05-01', regime: 'Normal'}]}));
    localStorage.setItem('ef:aval:t1_1', JSON.stringify({id: 't1_1', turmaId: 't1', p: 1, materias: ['Voleibol'], af: {a1: {Voleibol: 'I'}}, fit: {}, con: {}, av: {}}));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Store.mode)).toBe('idb');
  expect(await page.evaluate(() => [S.turmas.t1.ano, S.turmas.t1.alunos[0].disp.length, CFG.schema, Object.keys(localStorage).filter(k => /^ef:(turmas|aval):/.test(k)).length])).toEqual([8, 0, 2, 0]);
  await page.waitForTimeout(700); await page.reload();
  expect(await page.evaluate(() => S.aval.t1_1.af.a1.Voleibol)).toBe('I');
});

test('gráficos, documentos e ferramentas abrem sem erros', async ({page}) => {
  await demo(page); await go(page, 'relatorios');
  await page.click('[data-a="pview"][data-k="graf"]');
  expect(await page.locator('figure svg.viz').count()).toBeGreaterThan(4);
  await page.click('[data-a="pview"][data-k="rel"]');
  await page.click('[data-a="doc-crit"]'); await expect(page.locator('#print .rel')).toBeVisible(); await page.click('[data-a="print-close"]');
  await page.click('[data-a="doc-plan"]'); await expect(page.locator('#print .rel')).toBeVisible(); await page.click('[data-a="print-close"]');
  await go(page, 'turma'); await page.click('[data-a="tools"]'); await page.click('[data-a="tool-eq"]');
  await expect(page.locator('.eq')).toHaveCount(2);
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  await go(page, 'inicio'); await expect(page.locator('.tcard')).toHaveCount(1);
});
