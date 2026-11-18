# Run from frontend project root: .\scripts\start-lan-frontend.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object {
        $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)' -and
        $_.AddressState -eq 'Preferred' -and
        $_.InterfaceAlias -notmatch '(vEthernet|Virtual|WSL|Docker|Loopback|VPN)'
    } | Sort-Object @{ Expression = { if ($_.InterfaceAlias -match 'Wi-Fi|Wireless') { 0 } else { 1 } } })
if (!$ips.Count) { throw "Connect the computer to private Wi-Fi and retry." }
$ip = $ips[0].IPAddress
Write-Host "Open PropManager on the phone at http://${ip}:3000" -ForegroundColor Green
Write-Host "Keep the Next.js and Spring Boot terminal windows running." -ForegroundColor Yellow
npm run dev:lan
