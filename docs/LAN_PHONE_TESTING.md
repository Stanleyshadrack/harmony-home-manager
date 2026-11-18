# Phone access on the same Wi-Fi (local development only)

No tunnel, cloud hosting, or PostgreSQL firewall port is needed.

## Requirements

- Windows PC and phone on the same trusted, non-guest Wi-Fi.
- Backend database, SMTP, and JWT configuration already present in the **untracked** backend `.env`.
- The backend must be built once with Maven so `target/apartment-management-0.0.1-SNAPSHOT.jar` exists.
- Windows network profile **Private**. Never use these scripts on public/shared Wi-Fi.

## 1. Apply Windows Firewall rules once

Open **PowerShell as Administrator** in the frontend root:

```powershell
.\scripts\enable-lan-firewall.ps1
```

It opens only ports 3000 and 8080 for the PC's private IP, private network profile, and local subnet.

## 2. Start backend

In a regular PowerShell in the backend repo:

```powershell
.\scripts\start-lan-backend.ps1
```

This imports the local `.env` without printing secrets, detects the PC's private IPv4 address, sets `APP_LAN_ACCESS_ENABLED=true`, `SERVER_ADDRESS=0.0.0.0`, and `FRONTEND_URL=http://<PC-IP>:3000`, then runs the already built JAR.

Stop the backend already running from IntelliJ to avoid a port-8080 conflict. Alternatively, keep IntelliJ and set `APP_LAN_ACCESS_ENABLED=true`, `SERVER_ADDRESS=0.0.0.0`, `FRONTEND_URL=http://<PC-IP>:3000` in the **IntelliJ Run Configuration**, then restart IntelliJ's backend.

## 3. Start frontend

In a regular PowerShell in the frontend repo:

```powershell
.\scripts\start-lan-frontend.ps1
```

Equivalent to `npm run dev:lan`; Next.js binds to `0.0.0.0:3000`. It prints `http://<PC-IP>:3000`.

## 4. Use phone

Connect to the same Wi-Fi, disable any VPN that blocks LAN, and open `http://<PC-IP>:3000` in Safari or Chrome.

The shared API client automatically maps `localhost:8080` to `<PC-IP>:8080` when the frontend opens from a phone. An explicit non-localhost `NEXT_PUBLIC_API_URL` still takes precedence.

If login fails: test `http://<PC-IP>:8080/api/system-maintenance/status` on the phone, then inspect browser Network requests without sharing bearer tokens.

## 5. Disconnect when finished

Close both dev servers. In an **Administrator** PowerShell remove the firewall rules:

```powershell
Remove-NetFirewallRule -DisplayName "PropManager LAN Frontend"
Remove-NetFirewallRule -DisplayName "PropManager LAN Backend"
```

This does **not** secure the app for production. HTTP over Wi-Fi is plaintext; use synthetic data and test-only credentials on a trusted network. Do not forward router ports 3000/8080, and do not open PostgreSQL port 5432.

### Common issues

- **Phone cannot open site:** Confirm PC/phone are on same Wi-Fi, verify Private Windows network profile, turn off Wi-Fi guest/client isolation, and verify firewall rules.
- **Frontend opens but data fails:** Backend must be reachable on port 8080; start the backend launcher or enable LAN CORS in IntelliJ; look for unexpected hardcoded backend URLs.
- **Next.js shows a port other than 3000:** Stop the existing Next.js process and restart on port 3000 (CORS and scripts assume that port).
- **Local PC's IP changes:** Restart the backend and frontend LAN launchers; rerun the firewall script as Administrator to scope rules to the new IP.
- **Running IntelliJ and JAR together:** Do not run two backends on port 8080.
