export interface InviteUserRequest {
  email: string;
  role: "LANDLORD" | "TENANT" | "ADMIN" | "SUPER_ADMIN";
}

export interface InviteUserResponse {
  status: number;
  message: string;
  timestamp: string;
}
