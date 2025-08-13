export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateUserData extends UserData {
  role: UserRole;
}

export interface FindUserByEmail {
  email: string;
  hasPassword?: boolean;
}

export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
  MANAGER = "manager",
}
