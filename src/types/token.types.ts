import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "./user.types";

export interface GenerateTokenData {
  id: number;
  role: UserRole;
  tenant: string;
}

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  role: UserRole;
  tenant: string;
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
