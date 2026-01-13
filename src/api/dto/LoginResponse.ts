export type LoginResponse = {
      mfaRequired: true;
      accessToken: null;
      refreshToken: null;
    }
  | {
      mfaRequired: false;
      accessToken: string;
      refreshToken: string;
    };
