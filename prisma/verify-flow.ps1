# 端到端 API 验证脚本
$base = "http://localhost:3000"

# 1. admin 登录拿 cookie
Write-Host "=== 1. Admin 登录 ==="
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}' -SessionVariable sess
Write-Host "登录 OK, user:" ($login | ConvertTo-Json -Compress)

# 2. 查 confirmed demand（应该有 REQ-TEST-063767）
Write-Host "`n=== 2. 查 confirmed demand ==="
$demands = Invoke-RestMethod -Uri "$base/api/demands?status=confirmed" -WebSession $sess
$testDemand = $demands | Where-Object { $_.no -match "TEST" } | Select-Object -First 1
Write-Host "Confirmed demand count:" $demands.Count
Write-Host "Test demand:" ($testDemand | ConvertTo-Json -Compress)
if (-not $testDemand) { Write-Host "没有 test demand"; exit 1 }

# 3. 查 shooter
Write-Host "`n=== 3. 查拍摄人员 ==="
$shooters = Invoke-RestMethod -Uri "$base/api/users/shooters" -WebSession $sess
Write-Host "Shooters:" ($shooters | ConvertTo-Json -Compress)
$shooter = $shooters | Select-Object -First 1

# 4. POST /api/sessions — 关联 demand 创建场次
Write-Host "`n=== 4. 创建 session (关联 demand) ==="
$today = Get-Date -Format "yyyy-MM-dd"
$body = @{
  title     = "API 端到端测试排期"
  date      = $today
  startTime = "10:00"
  location  = "测试"
  shooterId = $shooter.id
  shooterName = $shooter.name
  demandIds = @($testDemand.id)
} | ConvertTo-Json
Write-Host "POST body:" $body
$session = Invoke-RestMethod -Uri "$base/api/sessions" -Method POST -ContentType "application/json" -Body $body -WebSession $sess
Write-Host "Created session:" ($session | ConvertTo-Json -Compress)

# 5. 查 scheduled demand — 应该有了！
Write-Host "`n=== 5. 查 scheduled demand ==="
$scheduled = Invoke-RestMethod -Uri "$base/api/demands?status=scheduled" -WebSession $sess
Write-Host "Scheduled demand count:" $scheduled.Count
$scheduled | ForEach-Object { Write-Host "  $($_.no) | $($_.title) | status=$($_.status)" }

# 6. 查 dashboard 今日拍摄 — 应该有 taskCount > 0
Write-Host "`n=== 6. Dashboard 今日拍摄（任务数）==="
$dash = Invoke-RestMethod -Uri "$base/api/dashboard" -WebSession $sess
Write-Host "Stats:" ($dash.stats | ConvertTo-Json -Compress)
Write-Host "Today sessions:"
$dash.todaySessions | ForEach-Object { Write-Host "  $($_.title) | taskCount=$($_.PSObject.Properties['_count'].Value.tasks)" }

Write-Host "`n=== ✅ 端到端验证完成 ==="
