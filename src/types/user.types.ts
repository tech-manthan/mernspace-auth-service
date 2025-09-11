import { Request } from "express";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId?: number;
  isBanned?: boolean;
}

export interface UpdateUserData {
  firstName: string | undefined;
  lastName: string | undefined;
  email: string | undefined;
  password: string | undefined;
  role: UserRole | undefined;
  tenantId: number | undefined;
  isBanned: boolean | undefined;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  tenant: {
    id: number;
  } | null;
  isBanned: boolean;
}

export interface CreateUserRequest extends Request {
  body: CreateUserData;
}

export interface UpdateUserRequest extends Request {
  body: UpdateUserData;
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

export interface UserFilter {
  q: string;
  currentPage: number;
  perPage: number;
  role: UserRole;
  isBanned: boolean;
}

export interface CreateAdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
