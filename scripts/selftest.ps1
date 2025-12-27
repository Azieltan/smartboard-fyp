# SmartBoard E2E Smoke Test (PowerShell)
# - Requires backend running on http://localhost:3001
# - Uses demo login + creates a temporary second user
# - Prints a compact JSON summary (no JWTs)
#
# Run:
#   powershell -ExecutionPolicy Bypass -File .\scripts\selftest.ps1

$ErrorActionPreference = 'Stop'

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory=$true)][string]$Uri,
    [Parameter(Mandatory=$true)][hashtable]$Body,
    [hashtable]$Headers = @{}
  )
  return Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10)
}

function Invoke-JsonPut {
  param(
    [Parameter(Mandatory=$true)][string]$Uri,
    [hashtable]$Body = $null,
    [hashtable]$Headers = @{}
  )
  if ($null -eq $Body) {
    return Invoke-RestMethod -Method Put -Uri $Uri -Headers $Headers
  }
  return Invoke-RestMethod -Method Put -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10)
}

function Invoke-JsonGet {
  param(
    [Parameter(Mandatory=$true)][string]$Uri,
    [hashtable]$Headers = @{}
  )
  return Invoke-RestMethod -Method Get -Uri $Uri -Headers $Headers
}

try {
  # 1) Login primary demo user
  $u1 = Invoke-JsonPost -Uri 'http://localhost:3001/auth/login' -Body @{ email='test_theme@example.com'; password='123456' }
  $u1Id = $u1.user.user_id
  $u1Headers = @{ Authorization = "Bearer $($u1.token)" }

  # 2) Register + login a second temporary user
  $suffix = Get-Date -Format 'yyyyMMdd_HHmmss'
  $u2Email = "test_theme2_$suffix@example.com"
  $u2Username = "testuser_theme2_$suffix"

  Invoke-JsonPost -Uri 'http://localhost:3001/auth/register' -Body @{ username=$u2Username; email=$u2Email; password='123456' } | Out-Null
  $u2 = Invoke-JsonPost -Uri 'http://localhost:3001/auth/login' -Body @{ email=$u2Email; password='123456' }
  $u2Id = $u2.user.user_id
  $u2Headers = @{ Authorization = "Bearer $($u2.token)" }

  # 3) Friend request u1 -> u2, then accept as u2
  Invoke-JsonPost -Uri 'http://localhost:3001/friends' -Headers $u1Headers -Body @{ userId=$u1Id; friendIdentifier=$u2Email } | Out-Null
  $u2NotifsAfterFriendRequest = Invoke-JsonGet -Uri "http://localhost:3001/notifications/$u2Id" -Headers $u2Headers

  $u2Friends = Invoke-JsonGet -Uri "http://localhost:3001/friends/$u2Id" -Headers $u2Headers
  $pending = $u2Friends | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1
  if ($null -eq $pending) { throw "Expected a pending friend request for $u2Email" }
  Invoke-JsonPut -Uri "http://localhost:3001/friends/$($pending.id)/accept" -Headers $u2Headers | Out-Null

  # 4) DM chat create + send/fetch 1 message
  $dm = Invoke-JsonPost -Uri 'http://localhost:3001/chats/dm' -Headers $u1Headers -Body @{ user1Id=$u1Id; user2Id=$u2Id }
  Invoke-JsonPost -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers -Body @{ userId=$u1Id; content="hello ($suffix)" } | Out-Null
  $msgs = Invoke-JsonGet -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers

  # 5) Task create -> submit -> review
  $task = Invoke-JsonPost -Uri 'http://localhost:3001/tasks' -Headers $u1Headers -Body @{ 
    title="E2E Task $suffix";
    description='self-test';
    due_date=(Get-Date).AddDays(3).ToString('o');
    status='todo';
    priority='low';
    created_by=$u1Id;
    user_id=$u2Id
  }

  $submission = Invoke-JsonPost -Uri "http://localhost:3001/tasks/$($task.task_id)/submit" -Headers $u2Headers -Body @{ userId=$u2Id; content='submitted via selftest'; attachments=@() }
  Invoke-JsonPut -Uri "http://localhost:3001/tasks/submissions/$($submission.submission_id)/review" -Headers $u1Headers -Body @{ status='approved'; feedback='looks good' } | Out-Null

  # 6) Notifications sanity check
  $u1Notifs = Invoke-JsonGet -Uri "http://localhost:3001/notifications/$u1Id" -Headers $u1Headers
  $u2NotifsFinal = Invoke-JsonGet -Uri "http://localhost:3001/notifications/$u2Id" -Headers $u2Headers

  # Output summary (no tokens)
  [PSCustomObject]@{
    ok = $true
    createdUser2Email = $u2Email
    friendRequestNotificationCount = @($u2NotifsAfterFriendRequest).Count
    dmMessagesCount = @($msgs).Count
    createdTaskId = $task.task_id
    submissionStatus = $submission.status
    u1UnreadNotifsCount = @($u1Notifs).Count
    u2UnreadNotifsCount = @($u2NotifsFinal).Count
  } | ConvertTo-Json -Depth 6
}
catch {
  [PSCustomObject]@{
    ok = $false
    error = $_.Exception.Message
  } | ConvertTo-Json -Depth 6
  exit 1
}
