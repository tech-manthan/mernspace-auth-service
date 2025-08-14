import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "./user.types";

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: number;
  role: UserRole;
  refreshTokenId: number;
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
