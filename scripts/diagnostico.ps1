# Sólo inventario no destructivo del CONTEXTO en que corre PowerShell. No imprime variables ni tokens.
Write-Output '=== Diagnóstico PowerShell (no presume equipo físico) ==='
Write-Output ("SO: " + [System.Environment]::OSVersion.Platform)
Write-Output ("Arquitectura: " + [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)
Write-Output 'Ruta de usuario omitida por privacidad.'
foreach($app in @('git','node','npm','npx','go','engram','opencode','claude','codex','solana','anchor','rustc','cargo','curl')) {
    $c = Get-Command $app -ErrorAction SilentlyContinue
    if($c) {
        $version = '(omitada por seguridad/compatibilidad)'
        if($app -in @('git','node','npm','go','engram','solana','anchor','rustc','cargo')) {
            try {
                if($app -eq 'engram') {$v = & $app version 2>$null}
                elseif($app -eq 'git') {$v = & $app --version 2>$null}
                elseif($app -eq 'go') {$v = & $app version 2>$null}
                else {$v = & $app --version 2>$null}
                $version = ($v | Select-Object -First 1)
            } catch {$version='Versión no verificada'}
        }
        Write-Output ("{0}: INSTALADO | {1}" -f $app,$version)
    } else { Write-Output ("{0}: NO_DETECTADO" -f $app) }
}
Write-Output ("Repo .git presente: " + (Test-Path '.git'))
Write-Output ("Skills SDD locales presentes: " + (Test-Path '.agents/skills'))
Write-Output 'No confirma Copilot OAuth/Engram MCP o sistema físico remoto: verificar dentro del agente.'
