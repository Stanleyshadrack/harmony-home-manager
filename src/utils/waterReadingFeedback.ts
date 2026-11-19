import { ApiHttpError } from '@/api/https';
import type { OperationFeedback } from '@/components/ui/OperationFeedbackDialog';

/** Convert backend water-reading rejections to actionable, non-technical messages. */
export function waterReadingFailure(error: unknown): OperationFeedback {
  const raw = error instanceof Error ? error.message : '';
  const message = raw.toLowerCase();
  const status = error instanceof ApiHttpError ? error.status : undefined;

  if (status === 400 && /pending or approved reading already exists for this date|reading already exists for this date/.test(message)) {
    return {
      kind: 'info',
      title: 'Reading already recorded',
      message: 'A pending or approved water reading already exists for this unit and date. No duplicate reading has been saved.',
      guidance: 'Check the unit’s reading history. If it is pending, ask the landlord to approve or reject it. If it is approved, use the next reading date. Do not change a valid approved reading just to bypass this check.',
    };
  }
  if (status === 400 && /outstanding.*reading|approve or reject.*reading/.test(message)) {
    return {
      kind: 'warning', title: 'Previous reading needs review',
      message: 'There is a reading still awaiting a decision for this unit.',
      guidance: 'Ask the landlord to review the pending reading before another one is submitted.',
    };
  }
  if (status === 400 && /reading date|go backwards|not after the last approved/.test(message)) {
    return {
      kind: 'warning', title: 'Reading date is out of sequence',
      message: 'The selected date cannot be earlier than or equal to the last approved meter-reading date.',
      guidance: 'Check the last approved reading date and enter the next valid date. Contact the landlord if historical records need correction.',
    };
  }
  if (status === 400 && /current reading.*previous|current reading.*baseline|cannot be below/.test(message)) {
    return {
      kind: 'warning', title: 'Meter reading is too low',
      message: 'The current reading cannot be below the previously approved meter value.',
      guidance: 'Verify the physical meter reading and the meter assigned to this unit. Report meter replacement or rollover to the landlord.',
    };
  }
  if (status === 400 && /meter.*unit|meter.*active|active meters/.test(message)) {
    return {
      kind: 'warning', title: 'Meter assignment needs attention',
      message: 'The selected meter is not an active meter assigned to this unit.',
      guidance: 'Ask the landlord to check the meter assignment and status under Water Meters.',
    };
  }
  if (status === 401) return {
    kind: 'warning', title: 'Sign in required',
    message: 'Your login has expired or could not be verified.',
    guidance: 'Sign in again, then confirm whether the reading was saved before retrying.',
  };
  if (status === 403) return {
    kind: 'error', title: 'Unit is not assigned to you',
    message: 'Your account cannot record a water reading for this property.',
    guidance: 'Contact the landlord to verify your employee-to-property assignment.',
  };
  if (status === 404) return {
    kind: 'error', title: 'Unit or meter not found',
    message: 'The selected unit or meter could not be found on the server.',
    guidance: 'Refresh the page and confirm that the meter is still assigned to the unit.',
  };
  if (status === 423) return {
    kind: 'warning', title: 'System temporarily locked',
    message: 'Maintenance mode is preventing new water readings.',
    guidance: 'Contact your administrator or retry when maintenance has ended.',
  };
  if (status === 400) return {
    kind: 'warning', title: 'Reading not accepted',
    message: 'The system rejected this reading because it did not pass validation.',
    guidance: 'Review the unit, meter, reading date and current value. Ask the landlord to inspect the reading history if the issue continues.',
  };
  return {
    kind: 'error', title: 'Unable to save water reading',
    message: 'The reading could not be saved. It may be a connection or server problem.',
    guidance: 'Check your connection and ask the landlord to confirm whether a reading was recorded before trying again.',
  };
}
