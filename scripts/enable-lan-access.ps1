# Run in an elevated PowerShell window on the Windows PC hosting the app.
# This allows only devices on the local subnet to reach the Next.js frontend.
# Spring Boot (8080) and PostgreSQL (5432) remain unexposed by this rule.
$ErrorActionPreference = "Stop"
$ruleName = "Apartment Manager - Next.js LAN (TCP 3000)"
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator to configure the Windows firewall."
}
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -RemoteAddress LocalSubnet | Out-Null
} else {
    Set-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Profile Private -Enabled True
    Set-NetFirewallAddressFilter -AssociatedNetFirewallRule (Get-NetFirewallRule -DisplayName $ruleName) -RemoteAddress LocalSubnet
    Set-NetFirewallPortFilter -AssociatedNetFirewallRule (Get-NetFirewallRule -DisplayName $ruleName) -Protocol TCP -LocalPort 3000
}
Write-Host "Configured: only Private-network LocalSubnet traffic can access TCP port 3000."
Write-Host "Make sure your active Wi-Fi network is set to Private (trusted network only)."
Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object InterfaceAlias,IPAddress |
    Format-Table -AutoSize
Write-Host "Open http://<your-WiFi-IPv4-address>:3000 on your phone while both devices use the same Wi-Fi."
