import { UserRole } from "@/contexts/AuthContext";

export interface JwtPayload {
  sub: string;        // email
  userId: number;
  role: UserRole | string;
  iat: number;
  exp: number;
}
