import { Request } from "express";

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
