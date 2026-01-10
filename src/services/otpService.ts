// OTP service for email-based MFA verification

export interface OTPData {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

const OTP_STORAGE_PREFIX = 'otp_';
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

// Generate a 6-digit OTP
const generateOTP = (): string => {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return (randomValues[0] % 1000000).toString().padStart(6, '0');
};

export const otpService = {
  // Generate and store OTP for email
  generateOTP(email: string): string {
    const code = generateOTP();
    const otpData: OTPData = {
      code,
      email,
      expiresAt: Date.now() + OTP_EXPIRY,
      attempts: 0,
    };
    localStorage.setItem(`${OTP_STORAGE_PREFIX}${email}`, JSON.stringify(otpData));
    return code;
  },

  // Verify OTP
  verifyOTP(email: string, code: string): { valid: boolean; error?: string } {
    const stored = localStorage.getItem(`${OTP_STORAGE_PREFIX}${email}`);
    if (!stored) {
      return { valid: false, error: 'No verification code found. Please request a new one.' };
    }

    const otpData: OTPData = JSON.parse(stored);

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      this.clearOTP(email);
      return { valid: false, error: 'Verification code has expired. Please request a new one.' };
    }

    // Check attempts
    if (otpData.attempts >= MAX_ATTEMPTS) {
      this.clearOTP(email);
      return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts++;
      localStorage.setItem(`${OTP_STORAGE_PREFIX}${email}`, JSON.stringify(otpData));
      const remaining = MAX_ATTEMPTS - otpData.attempts;
      return { 
        valid: false, 
        error: remaining > 0 
          ? `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many failed attempts. Please request a new code.'
      };
    }

    // Valid - clear OTP
    this.clearOTP(email);
    return { valid: true };
  },

  // Clear OTP data
  clearOTP(email: string): void {
    localStorage.removeItem(`${OTP_STORAGE_PREFIX}${email}`);
  },

  // Get remaining time for OTP
  getRemainingTime(email: string): number {
    const stored = localStorage.getItem(`${OTP_STORAGE_PREFIX}${email}`);
    if (!stored) return 0;
    
    const otpData: OTPData = JSON.parse(stored);
    const remaining = otpData.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  // Simulate sending OTP via email (in real app, this would call an API)
  sendOTPEmail(email: string): { code: string; success: boolean } {
    const code = this.generateOTP(email);
    
    // Log the code for demo purposes
    console.log(`[OTP Service] Verification code for ${email}: ${code}`);
    
    return { code, success: true };
  },
};
