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
