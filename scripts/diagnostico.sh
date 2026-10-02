#!/usr/bin/env bash
# Diagnóstico conservador: solo nombres/versions de comandos, no secretos, no instalaciones.
set -u
printf '%s\n' '=== Diagnóstico local (solo del contexto donde SE EJECUTA esta shell) ==='
printf 'OS: '; uname -s 2>/dev/null || printf 'NO_VERIFICADO\n'
printf 'Arch: '; uname -m 2>/dev/null || printf 'NO_VERIFICADO\n'
printf 'PWD: [directorio de trabajo actual; omitido por privacidad]\n'
if [ -e /proc/version ] && grep -qi microsoft /proc/version 2>/dev/null; then echo 'Contexto probable: WSL (confirmar con humano)'; fi
if [ -e /.dockerenv ]; then echo 'Contexto probable: contenedor (NO equipo fisico)'; fi
for app in git node npm npx go engram opencode claude codex solana anchor rustc cargo curl; do
  if command -v "$app" >/dev/null 2>&1; then
    printf '%-10s INSTALADO' "$app"
    case "$app" in
      git) x=$(git --version 2>/dev/null | head -1);;
      node|npm|npx|go|solana|anchor|rustc|cargo) x=$($app --version 2>/dev/null | head -1);;
      engram) x=$(engram version 2>/dev/null | head -1);;
      *) x='(versión omitida para evitar salidas de cuenta/configuración)';;
    esac
    printf ' | %s\n' "${x:-versión no verificada}"
  else printf '%-10s NO_DETECTADO\n' "$app"; fi
done
if [ -d .git ]; then echo 'Repositorio .git: SI'; else echo 'Repositorio .git: NO'; fi
if [ -d .agents/skills ]; then echo 'Skills locales .agents/skills: PRESENTES'; fi
printf '%s\n' 'No comprueba sesión MCP, Copilot login, wallet ni disponibilidad real de skills: verificar desde el agente.'
