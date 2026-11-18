# Run ONCE in PowerShell as Administrator, on a trusted PRIVATE Wi-Fi network:
#   powershell -ExecutionPolicy Bypass -File .\scripts\enable-lan-firewall.ps1
# Remove the rules after testing:
#   Remove-NetFirewallRule -DisplayName "PropManager LAN Frontend"
#   Remove-NetFirewallRule -DisplayName "PropManager LAN Backend"
$ErrorActionPreference = "Stop"
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator to create Windows Firewall rules."
}
$ips = @(Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)' -and
        $_.InterfaceAlias -notmatch '(vEthernet|Virtual|WSL|Docker|Loopback|VPN)'
    } | Sort-Object @{ Expression = { if ($_.InterfaceAlias -match 'Wi-Fi|Wireless') { 0 } else { 1 } } })
if (!$ips.Count) { throw "No local private IP found. Connect to Wi-Fi first." }
$ip = $ips[0].IPAddress
foreach ($spec in @(
    @{ Name = "PropManager LAN Frontend"; Port = 3000 },
    @{ Name = "PropManager LAN Backend"; Port = 8080 }
)) {
    Get-NetFirewallRule -DisplayName $spec.Name -ErrorAction SilentlyContinue |
        Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $spec.Name -Direction Inbound -Action Allow `
        -Profile Private -Protocol TCP -LocalPort $spec.Port `
        -LocalAddress $ip -RemoteAddress LocalSubnet | Out-Null
}
Write-Host "Local Wi-Fi only: http://${ip}:3000" -ForegroundColor Green
Write-Host "Firewall rules limited to Private profile and LocalSubnet." -ForegroundColor Yellow
