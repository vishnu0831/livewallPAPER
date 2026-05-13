$ErrorActionPreference = "Stop"

# Use local node environment
$nodeDir = "c:\Users\visha\Downloads\wallpaper project\livewall\.node\node-v20.18.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Running dependencies installation..."
& "$nodeDir\node.exe" "$nodeDir\node_modules\npm\bin\npm-cli.js" install

Write-Host "Building UI..."
& "$nodeDir\node.exe" "$nodeDir\node_modules\npm\bin\npm-cli.js" run build:ui

Write-Host "Re-registering startup task with highest permissions..."
$taskName = "LiveWall_Startup"
$actionPath = "c:\Users\visha\Downloads\wallpaper project\livewall\start-app.cmd"
$actionArgs = "--hidden"
$workingDir = "c:\Users\visha\Downloads\wallpaper project\livewall"

$action = New-ScheduledTaskAction -Execute $actionPath -Argument $actionArgs -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 0) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

$task = Get-ScheduledTask -TaskName $taskName
$task.Settings.Priority = 4
Set-ScheduledTask -InputObject $task

Write-Host "Permissions configured and Task Setup Completed Successfully."
Start-Sleep -Seconds 3
