---
name: publicar
description: Publica uma alteração do Caderno EF — compila, verifica colisões, corre os testes duas vezes, faz commit, abre o PR por gh api, espera pelo CI, faz squash merge e republica o artifact no mesmo endereço.
disable-model-invocation: true
---

# Publicar o Caderno EF

Fluxo completo que o professor espera em cada ronda. Pare e diga o que falhou se algum passo não passar — nunca faça merge com testes vermelhos.

## 1. Preparar
- O ramo atual não pode ser `main`. Se for, crie um: `git checkout -b <nome-curto-em-portugues>`.
- `node build.mjs` (o hook já o faz ao editar `src/`, mas confirme).
- `node tools/verificar-colisoes.mjs` — tem de sair com código 0. Leia também os avisos: uma classe CSS repetida pode ser um erro visual real (ex.: `.sem` usada para duas coisas).

## 2. Testar (duas vezes seguidas)
- Na nuvem (existe `/opt/pw-browsers/chromium`): `npx playwright test -c pw.local.config.js --trace off`
- No computador do professor: `npx playwright test --trace off`
- As duas corridas têm de passar por inteiro. Um teste que falha só às vezes é um problema a investigar (normalmente o teste corre antes de a app acabar de arrancar), não sorte.
- Se a alteração for visual, corra também o subagente `verificador-visual`.

## 3. Commit e PR
- `git add` só do que pertence à alteração (src, tests, tools, app/index.html, artifact/index.html, .claude); nunca `pw.local.config.js`.
- Mensagem em português, a terminar com as linhas de atribuição que a sessão indicar.
- `git push -u origin <ramo>` (repetir até 4 vezes se a rede falhar).
- O `gh pr` não funciona neste ambiente (GraphQL recusado): crie o PR por REST, com o corpo num ficheiro JSON:
  `gh api repos/pedrovicentecastanheira-collab/caderno-ef/pulls --input pr.json --jq '.number, .head.sha'`
  (`pr.json` = `{"title", "head": "<ramo>", "base": "main", "body"}`; corpo em português, a terminar com as linhas de atribuição do PR.)

## 4. Esperar pelo CI e juntar
- Esperar sem `sleep` solto:
  `until r=$(gh api repos/pedrovicentecastanheira-collab/caderno-ef/commits/<sha>/check-runs --jq '[.check_runs[] | .status + ":" + (.conclusion // "")] | join(",")') && [ -n "$r" ] && ! echo "$r" | grep -q "in_progress\|queued"; do sleep 15; done; echo "$r"`
- Só com `completed:success`:
  `gh api -X PUT repos/pedrovicentecastanheira-collab/caderno-ef/pulls/<n>/merge -f merge_method=squash -f sha=<sha> --jq '.merged'`
- O workflow «Publicar» atualiza sozinho o GitHub Pages depois do merge.

## 5. Republicar o artifact
- Ferramenta Artifact, `file_path` = `artifact/index.html`, `url` = `https://claude.ai/artifact/RnmkpoiWfNdXgZYCGzpbZ8` (mesmo endereço; sem `capabilities` nem `icon`).

## 6. Responder ao professor
- Em português europeu, curto: o que mudou (em termos de uso, não de código), onde encontrar, o que foi verificado e o que não foi possível verificar aqui.
