import { Request } from "express";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserRequest extends Request {
  body: CreateUserData;
}

export interface FindUserByEmail {
  email: string;
  hasPassword?: boolean;
}

export interface FindUserById {
  id: number;
  hasPassword?: boolean;
}

export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
  MANAGER = "manager",
}
