import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "./user.types";

export interface AccessTokenPayload extends JwtPayload {
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  role: UserRole;
  userId: number;
}

export interface CreateRefreshToken {
  userId: number;
}

export interface DeleteRefreshToken {
  tokenId: number;
}

export interface DeleteRefreshTokens {
  userId: number;
}
