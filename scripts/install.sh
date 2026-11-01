#!/usr/bin/env bash
# Instala el Oblivion FX Kit en Claude Code.
#
#   scripts/install.sh                 skills y agentes propios (symlinks a ~/.claude)
#   scripts/install.sh --companions    + skills de terceros (Impeccable, Taste, Emil, GSAP, Three.js)
#   scripts/install.sh --mcp           + servidores MCP (Chrome DevTools, Spline)
#   scripts/install.sh --all           todo lo anterior
#   scripts/install.sh --dry-run …     muestra lo que haría, sin tocar nada
#   scripts/install.sh --force …       reemplaza skills de terceros ya instaladas
#
# Los symlinks hacen que los cambios en este repo se reflejen solos. Nada de esto toca proyectos.

set -euo pipefail

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE="${CLAUDE_HOME:-$HOME/.claude}"
DRY=0; FORCE=0; COMPANIONS=0; MCP=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    --force) FORCE=1 ;;
    --companions) COMPANIONS=1 ;;
    --mcp) MCP=1 ;;
    --all) COMPANIONS=1; MCP=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $arg" >&2; exit 1 ;;
  esac
done

run() { if [ "$DRY" = 1 ]; then echo "  [dry-run] $*"; else eval "$@"; fi; }
say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "Skills propias → $CLAUDE/skills"
run "mkdir -p '$CLAUDE/skills' '$CLAUDE/agents'"
for dir in "$KIT"/skills/*/; do
  name="$(basename "$dir")"
  target="$CLAUDE/skills/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "  ! $name ya existe y no es un symlink del kit: lo dejo como está"
    continue
  fi
  run "ln -sfn '${dir%/}' '$target'"
  echo "  ✓ $name"
done

say "Agentes → $CLAUDE/agents"
for file in "$KIT"/agents/*.md; do
  name="$(basename "$file")"
  target="$CLAUDE/agents/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "  ! $name ya existe y no es un symlink del kit: lo dejo como está"
    continue
  fi
  run "ln -sfn '$file' '$target'"
  echo "  ✓ ${name%.md}"
done

# Copia toda carpeta con SKILL.md de un repo (o solo las nombradas) a ~/.claude/skills.
install_repo() {
  local url="$1"; shift
  local only=" $* " count=$#
  local tmp; tmp="$(mktemp -d)"
  echo "  · $url"
  if [ "$DRY" = 1 ]; then echo "  [dry-run] git clone --depth 1 $url"; return; fi
  git clone -q --depth 1 "$url" "$tmp/repo"
  while IFS= read -r skill_md; do
    local dir name; dir="$(dirname "$skill_md")"; name="$(basename "$dir")"
    if [ "$count" -gt 0 ] && [[ "$only" != *" $name "* ]]; then continue; fi
    if [ -e "$CLAUDE/skills/$name" ] && [ "$FORCE" != 1 ]; then echo "    = $name (ya instalada)"; continue; fi
    rm -rf "$CLAUDE/skills/$name"
    cp -R "$dir" "$CLAUDE/skills/$name"
    echo "    ✓ $name"
  done < <(find "$tmp/repo" -name SKILL.md -not -path '*/node_modules/*')
  rm -rf "$tmp"
}

if [ "$COMPANIONS" = 1 ]; then
  say "Skills compañeras (de terceros, con su licencia)"
  install_repo https://github.com/pbakaus/impeccable impeccable
  install_repo https://github.com/Leonxlnx/taste-skill taste-skill
  install_repo https://github.com/emilkowalski/skills animate improve-animations review-animations animation-performance \
    animation-vocabulary find-animation-opportunities remove-animations emil-design-eng apple-design mobile-native break-ui
  install_repo https://github.com/greensock/gsap-skills
  install_repo https://github.com/cloudai-x/threejs-skills
fi

if [ "$MCP" = 1 ]; then
  say "Servidores MCP"
  if command -v claude >/dev/null 2>&1; then
    run "claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest || true"
    run "claude mcp add --transport http --scope user spline https://mcp.spline.design/mcp || true"
    echo "  Higgsfield se conecta como integración de claude.ai (Ajustes → Conectores), no por CLI."
  else
    echo "  ! No encontré el CLI 'claude'. Instalá Claude Code y volvé a correr con --mcp."
  fi
fi

say "Listo"
echo "  Kit: $KIT"
echo "  Para la pasada: export OBLIVION_FX_KIT=\"$KIT\"  y en el proyecto: /oblivion-pass"
