# System screen lock

A manual and inactivity-based screen lock is implemented for all authenticated roles.

## User flows
- Account avatar menu -> **Lock screen**: immediately removes browser access/refresh tokens and navigates to /locked.
- Inactivity for the user-selected interval (1, 5 or 30 minutes): same lock automatically. Defaults to 30 minutes until the user selects an interval. User activity is pointer, keyboard, wheel or touch.
- Other open application tabs: locking one tab broadcasts a lock event to other tabs in the same browser origin.
- /locked shows the previously authenticated account email and a **Sign in to unlock** button.
- Unlock requires the full configured backend login flow, including email OTP when required.
- After authenticating as the same email, the user returns to the previously opened route. Other accounts go to their own home route.
- Use a different account clears the saved return path.
- The route guard blocks access when a lock marker remains after reload.

## Verify locally
1. Login as landlord. Open Settings. Choose avatar -> Lock screen. Confirm that /locked appears.
2. In DevTools Application -> Local Storage verify accessToken and refreshToken are absent. Do not share token contents.
3. Try browsing directly to /billing or /properties while locked. Expect /locked, not private data.
4. Use Sign in to unlock. Authenticate with password and OTP if required. Confirm return to Settings.
5. Open two browser tabs on the same origin. Lock one; verify the second locks.
6. Visit Settings > Security > Automatic screen lock. Choose 1 minute and confirm the screen locks after inactivity. Repeat for 5 or 30 minutes as needed. Check that the interval remains selected after a refresh.
7. Verify tenant, employee, landlord, super admin roles all have the Lock screen menu action.
8. Confirm the app's API endpoints reject unauthenticated calls after the stored tokens are cleared.

## Security limits
This is an authenticated browser session lock, not a global maintenance mode or a server-side JWT revocation endpoint.
A previously stolen access token remains potentially usable until its normal expiration unless the backend separately revokes/invalidates it.
Tokens are currently kept in localStorage by the existing authentication system. A production-hardening phase should move refresh tokens into secure HttpOnly cookies and implement server-side session invalidation.

## User-selectable idle lock options
- Settings > Security: 1 minute, 5 minutes, or 30 minutes of inactivity.
- Settings > Security > Lock now and profile dropdown > Lock screen: immediate user-initiated lock.
- The interval is stored per-account in localStorage on this browser, not synced between devices.
- Lock screen states the configured interval when it locks for inactivity.
- Returning to a backgrounded tab checks elapsed inactivity immediately.
- This is separate from the Super Admin's system-wide maintenance lock.

## Five-second inactivity warning and Keep Alive
- The existing per-user idle intervals (1, 5 and 30 minutes) remain unchanged.
- Five seconds **before** the selected idle interval expires, a blocking warning appears with an animated circular progress ring and the number counting **5 → 4 → 3 → 2 → 1 → 0**.
- **Keep Alive** is the only action that resets the idle clock once this warning is visible; clicking elsewhere, moving the pointer, scrolling or tapping outside must not dismiss the warning.
- **Lock Now** bypasses the remaining countdown and immediately uses the existing session lock.
- If no button is pressed, the app briefly displays zero and calls the existing `lockSession('idle')` function. The browser's access and refresh tokens are cleared; the locked screen requires normal login and OTP where applicable.
- When a backgrounded tab is restored after the deadline, it locks immediately rather than restarting the countdown. In another tab, a completed lock still broadcasts to other open tabs.
- The Keep Alive action resets only the **personal idle screen-lock timer**. It cannot override backend token expiry, logout, or a Super Admin's global/individual maintenance lock.

### Countdown verification
1. Log in as any role, choose **Settings > Security > Automatic screen lock > 1 minute**.
2. Remain inactive. At approximately 55 seconds a modal appears, with its ring shrinking and its center displaying 5 down to 0.
3. During the countdown, move the mouse or scroll; verify it does **not** dismiss the modal.
4. Press **Keep Alive** while the number is above 0. Verify the dialog closes and the full one-minute idle interval restarts.
5. Repeat without pressing Keep Alive; verify the UI locks and the previous tokens are removed, as before.
6. Repeat with **Lock Now**, and test on a narrow phone viewport.
7. Put the browser tab in the background until after the idle deadline. Return and verify immediate lock.
8. Activate the separate Super Admin global maintenance lock; Keep Alive must not restore access under server-enforced maintenance.
