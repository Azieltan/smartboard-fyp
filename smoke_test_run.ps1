$ErrorActionPreference = 'Stop'

# 1) Login primary demo user
$u1 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/login' -ContentType 'application/json' -Body (@{ email='abc1@gmail.com'; password='123456' } | ConvertTo-Json)
$u1Id = $u1.user.user_id
$u1Headers = @{ Authorization = "Bearer $($u1.token)" }

# 2) Register + login a second temporary user
$suffix = Get-Date -Format 'yyyyMMdd_HHmmss'
$u2Email = "test_theme2_$suffix@example.com"
$u2Username = "testuser_theme2_$suffix"

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/register' -ContentType 'application/json' -Body (@{ username=$u2Username; email=$u2Email; password='123456' } | ConvertTo-Json) | Out-Null
$u2 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/login' -ContentType 'application/json' -Body (@{ email=$u2Email; password='123456' } | ConvertTo-Json)
$u2Id = $u2.user.user_id
$u2Headers = @{ Authorization = "Bearer $($u2.token)" }

# 3) Friend request u1 -> u2, then accept as u2
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/friends' -Headers $u1Headers -ContentType 'application/json' -Body (@{ userId=$u1Id; friendIdentifier=$u2Email } | ConvertTo-Json) | Out-Null
$u2Friends = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/friends/$u2Id" -Headers $u2Headers
$pending = $u2Friends | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1
Invoke-RestMethod -Method Put -Uri "http://localhost:3001/friends/$($pending.id)/accept" -Headers $u2Headers | Out-Null

# 4) DM chat create + send/fetch 1 message
$dm = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/chats/dm' -Headers $u1Headers -ContentType 'application/json' -Body (@{ user1Id=$u1Id; user2Id=$u2Id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers -ContentType 'application/json' -Body (@{ userId=$u1Id; content="hello ($suffix)" } | ConvertTo-Json) | Out-Null
$msgs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers

# 5) Task create -> submit -> review (checks task submission workflow)
$task = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/tasks' -Headers $u1Headers -ContentType 'application/json' -Body (@{ title="E2E Task $suffix"; description='self-test'; due_date=(Get-Date).AddDays(3).ToString('o'); status='todo'; priority='low'; created_by=$u1Id; user_id=$u2Id } | ConvertTo-Json)
$submission = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/tasks/$($task.task_id)/submit" -Headers $u2Headers -ContentType 'application/json' -Body (@{ userId=$u2Id; content='submitted via API self-test'; attachments=@() } | ConvertTo-Json)
Invoke-RestMethod -Method Put -Uri "http://localhost:3001/tasks/submissions/$($submission.submission_id)/review" -Headers $u1Headers -ContentType 'application/json' -Body (@{ status='approved'; feedback='looks good' } | ConvertTo-Json) | Out-Null

# 6) Notifications sanity check
$u1Notifs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/notifications/$u1Id" -Headers $u1Headers
$u2Notifs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/notifications/$u2Id" -Headers $u2Headers

Write-Host "--- SMOKE TEST RESULTS ---"
Write-Host "Created User 2: $u2Email"
Write-Host "DM Messages Count: $( @($msgs).Count )"
Write-Host "U1 Unread Notifs: $( @($u1Notifs).Count )"
Write-Host "U2 Unread Notifs: $( @($u2Notifs).Count )"
Write-Host "--- END ---"
