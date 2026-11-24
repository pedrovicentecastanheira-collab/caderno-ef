#!/usr/bin/env bash
# PostToolUse (Edit|Write): recompila app/index.html e artifact/index.html quando se edita algo em src/.
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
case "$f" in
  */src/*) cd "${CLAUDE_PROJECT_DIR:-.}" && node build.mjs >/dev/null || { echo "build.mjs falhou depois de editar $f" >&2; exit 2; } ;;
esac
exit 0
