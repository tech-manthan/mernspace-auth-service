import { Request } from "express";
import { UserRole } from "./user.types";

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface RegisterUserRequest extends Request {
  body: RegisterUserData;
}

export interface LoginUserRequest extends Request {
  body: LoginUserData;
}

export interface AuthRequest extends Request {
  auth: {
    id: number;
    role: UserRole;
    refreshTokenId: number;
    tenant: string;
  };
}

export type AuthCookie = {
  accessToken: string;
  refreshToken: string;
};
