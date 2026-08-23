$ErrorActionPreference = 'Stop'

$apiRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$phpPath = (Get-Command php).Source
$taskName = 'ArduFlow SQLite to MySQL Sync'
$syncScript = Join-Path $apiRoot 'scripts\sync-sqlite-to-mysql.php'
$logDirectory = Join-Path $apiRoot 'storage\logs'
$logPath = Join-Path $logDirectory 'sync-scheduler.log'

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

$action = New-ScheduledTaskAction `
    -Execute 'cmd.exe' `
    -Argument "/c `"`"$phpPath`" `"$syncScript`" >> `"$logPath`" 2>>&1`"" `
    -WorkingDirectory $apiRoot

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 4) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Run ArduFlow SQLite to MySQL sync every 5 minutes.' `
    -Force | Out-Null

Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State
