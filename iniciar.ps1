# ============================================================================
#  VulnShop — sobe tudo (MariaDB + backend + frontend) em janelas separadas.
#  Uso:  .\iniciar.ps1        (AMBIENTE DE TREINO — so local)
#  Alternativa (um processo so):  npm run dev   (usa concurrently)
# ============================================================================
try { Start-Service MariaDB -ErrorAction Stop; Write-Host 'MariaDB: OK' } catch { Write-Host 'MariaDB ja rodando ou sem permissao (rode como admin se preciso).' }

$raiz = $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$raiz\backend'; npm start"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$raiz\frontend'; npm run dev"

Write-Host ''
Write-Host 'VulnShop subindo:'
Write-Host '  Loja:    http://localhost:5444'
Write-Host '  API:     http://localhost:4000/api/health'
Write-Host '  Atacante (opcional): node atacante/servir.js  -> http://localhost:4444'
