$path = "c:\Users\swaro\Desktop\Subramanya Temple App & Registry\star-backend\dist\subramanya_temple_app\subramanya_temple_app.exe"
$shortcutPath = "c:\Users\swaro\Desktop\Subramanya Temple App.lnk"
$workDir = "c:\Users\swaro\Desktop\Subramanya Temple App & Registry\star-backend\dist\subramanya_temple_app"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
}

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $path
$Shortcut.WorkingDirectory = $workDir
$Shortcut.Save()
Write-Host "Shortcut created at $shortcutPath"
