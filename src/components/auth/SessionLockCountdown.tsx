import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

const COUNTDOWN_MS = 5_000;
const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SessionLockCountdownProps {
  open: boolean;
  remainingMs: number;
  onKeepAlive: () => void;
  onLockNow: () => void;
}

/**
 * Five-second, time-based warning for a personal idle screen lock.
 * The deadline is owned by SessionLockManager so timers remain correct
 * even if the browser throttles rendering in the background.
 */
export function SessionLockCountdown({
  open,
  remainingMs,
  onKeepAlive,
  onLockNow,
}: SessionLockCountdownProps) {
  const remaining = Math.max(0, Math.min(COUNTDOWN_MS, remainingMs));
  const seconds = Math.ceil(remaining / 1_000);
  const progress = remaining / COUNTDOWN_MS;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="w-[calc(100vw-2rem)] max-w-sm rounded-xl"
        onEscapeKeyDown={event => event.preventDefault()}
      >
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <AlertDialogTitle>Screen locking soon</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your session is about to lock due to inactivity.
            Select <strong>Keep Alive</strong> to continue working.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col items-center gap-2 py-3">
          <div className="relative h-40 w-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
              <circle
                cx="80" cy="80" r={RADIUS}
                fill="none" stroke="currentColor" strokeWidth="10"
                className="text-muted"
              />
              <circle
                cx="80" cy="80" r={RADIUS}
                fill="none" stroke="currentColor" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                className={seconds <= 2 ? 'text-destructive' : 'text-amber-500'}
                style={{ transition: 'stroke-dashoffset 100ms linear, stroke 200ms ease' }}
              />
            </svg>
            <div
              role="timer"
              aria-live="polite"
              aria-label={`${seconds} seconds until screen lock`}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-5xl font-bold tabular-nums leading-none">{seconds}</span>
              <span className="mt-2 text-xs text-muted-foreground">
                {seconds === 1 ? 'second' : 'seconds'}
              </span>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Your session will require sign-in after locking.
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLockNow}
            className="min-h-11 flex-1"
          >
            Lock Now
          </Button>
          <Button
            type="button"
            onClick={onKeepAlive}
            disabled={remaining <= 0}
            className="min-h-11 flex-1"
          >
            Keep Alive
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
