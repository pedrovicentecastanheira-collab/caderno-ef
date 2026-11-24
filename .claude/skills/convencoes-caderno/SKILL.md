---
name: convencoes-caderno
description: Regras do código do Caderno EF (app de Educação Física em JavaScript sem framework). Usar sempre que se edita src/js, src/css, src/index.html ou tests/ deste repositório.
user-invocable: false
---

# Convenções do Caderno EF

## Como o código é montado
- `build.mjs` junta `src/index.html` + todos os `src/css/*.css` + todos os `src/js/*.js` (por ordem alfabética) num só `<script>` em `app/index.html` e `artifact/index.html`. Esses dois ficheiros são gerados: nunca se editam à mão (um hook bloqueia-o) e vão no commit, porque o CI falha se estiverem desatualizados.
- Todos os módulos partilham o mesmo âmbito global. Uma funcionalidade nova vai num módulo novo com número a seguir ao último (`61-...js`, `31-...css`).

## Substituir funções de outros módulos
- Os módulos posteriores acrescentam comportamento substituindo funções globais: `{ const _orig = vGrelha; vGrelha = function (t) { ... _orig(t) ... }; }`.
- A original tem de estar declarada com `function` ou `let`, nunca `const` (senão: «Assignment to constant variable» e a app não arranca).
- Guarde a original numa constante dentro de um bloco `{ }` para não ocupar nomes globais.
- Antes de reutilizar texto HTML de outra função com `.replace(...)`, confirme que o padrão existe mesmo no HTML atual (a grelha do Avaliar, por exemplo, mudou de estrutura e um replace silencioso deixa de funcionar).

## Nomes únicos (a causa de vários erros)
- Classes CSS, valores de `data-in` e ações `A['nome']` são globais. Antes de criar um nome, procure-o em todo o `src/`.
- Já colidiram: `.dom`, `.eq`, `.pa`, `.sem`, `disp` (data-in), `PIN`, `td`, `eqHtml`. Prefira nomes com prefixo do módulo (`rb-`, `ag-`, `go-`).
- Depois de editar, corra `node tools/verificar-colisoes.mjs`.

## Dados e gravação
- Estado em `S.turmas`, `S.aulas`, `S.aval`, `S.fotos`, `S.docs`, `S.hist` e `CFG`. Gravar com `Store.save(tipo, obj)`; avaliações com `touchAval(v)`; configuração com `Store.save('cfg', CFG)`.
- A sincronização é campo a campo (módulo 53): qualquer alteração tem de passar por `Store.save`, senão não chega aos outros aparelhos.
- Registos na conta Claude têm limite de cerca de 256 KB: nada de ficheiros grandes (áudio, vídeo) dentro de `S.aval` ou `CFG`.
- Escrever HTML sempre com `esc(...)` à volta de texto vindo do professor ou de ficheiros.

## Interface
- Toda a interface em português europeu (pt-PT): «registar», «telemóvel», «ecrã», «guardar».
- Ações destrutivas usam `armed(el, 'Confirmar?')` (dois toques).
- Cores só pelas variáveis de `00-tokens.css` (funcionam no modo escuro).
- Verificar no telemóvel (Pixel 7) e no computador; a página nunca pode ficar mais larga do que o ecrã.

## Testes
- `tests/app.spec.js`, projetos «computador» e «telemovel». Cada funcionalidade nova leva um teste.
- O helper `demo(page)` espera por `CFG`. Para testar a sincronização campo a campo, espere também por `FS.on`.
- Na nuvem use `-c pw.local.config.js` (criado pelo hook de arranque) para usar o Chromium pré-instalado.
