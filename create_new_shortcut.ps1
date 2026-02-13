$path = "c:\Users\swaro\Desktop\Subramanya Temple App & Registry\star-backend\dist\subramanya_temple_app\subramanya_temple_app.exe"
$shortcutPath = "c:\Users\swaro\Desktop\STAR_App_Fixed.lnk"
$workDir = "c:\Users\swaro\Desktop\Subramanya Temple App & Registry\star-backend\dist\subramanya_temple_app"

# Remove old broken shortcuts
Remove-Item "c:\Users\swaro\Desktop\Subramanya Temple App.lnk" -ErrorAction SilentlyContinue

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $path
$Shortcut.WorkingDirectory = $workDir
$Shortcut.Description = "Subramanya Temple App & Registry"
$Shortcut.IconLocation = "shell32.dll, 13"
$Shortcut.Save()
Write-Host "New Shortcut created at $shortcutPath"
