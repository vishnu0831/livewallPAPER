Unregister-ScheduledTask -TaskName "LiveWall_Startup" -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "Old LiveWall_Startup task removed successfully."
Pause
