import { sign, verify } from "jsonwebtoken";
import fs from "node:fs";

import path from "node:path";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { Config } from "../config";
import { Repository } from "typeorm";
import { Token } from "../entity/Token";
import {
  AccessTokenPayload,
  CreateRefreshToken,
  DeleteRefreshToken,
  DeleteRefreshTokens,
  RefreshTokenPayload,
} from "../types/token.types";

export class TokenService {
  private privateKey: Buffer;

  /**
   * AccessTokenExpiry  -> In Seconds
   */
  public AccessTokenExpiry = 60 * 60;
  /**
   * RefreshTokenExpiry  -> In Seconds
   */
  public RefreshTokenExpiry = 60 * 60 * 24 * 365;

  constructor(
    private tokenRepository: Repository<Token>,
    private logger: Logger,
  ) {
    try {
      this.privateKey = fs.readFileSync(
        path.join(__dirname, "../../certs/private.pem"),
      );
      // this.publicKey = fs.readFileSync(
      //   path.join(__dirname, "../../certs/public.pem"),
      // );
    } catch {
      logger.error("Failed to read keys");
      process.exit(1);
    }
  }

  generateAccessToken(payload: AccessTokenPayload) {
    return sign(payload, this.privateKey, {
      algorithm: "RS256",
      expiresIn: this.AccessTokenExpiry,
      issuer: "auth-service",
    });
  }

  static validateAccessToken(accessToken: string): AccessTokenPayload {
    const decodedToken = verify(accessToken, "publicKey");

    if (typeof decodedToken === "string") {
      const err = createHttpError(403, "Invalid access token");
      throw err;
    }

    return decodedToken as AccessTokenPayload;
  }

  generateRefreshToken(payload: RefreshTokenPayload) {
    return sign(payload, Config.REFRESH_TOKEN_SECRET!, {
      algorithm: "HS256",
      expiresIn: this.RefreshTokenExpiry,
      issuer: "auth-service",
    });
  }

  validateRefreshToken(refreshToken: string): RefreshTokenPayload {
    const decodedToken = verify(refreshToken, Config.REFRESH_TOKEN_SECRET!);

    if (typeof decodedToken === "string") {
      const err = createHttpError(403, "Invalid refresh token");
      throw err;
    }

    return decodedToken as RefreshTokenPayload;
  }

  async createRefreshToken({ userId }: CreateRefreshToken) {
    try {
      return await this.tokenRepository.save({
        user: {
          id: userId,
        },
        expiresAt: new Date(Date.now() + this.RefreshTokenExpiry * 1000),
      });
    } catch {
      const err = createHttpError(
        500,
        "Failed to create refresh token in database",
      );
      throw err;
    }
  }

  async deleteRefreshToken({ tokenId }: DeleteRefreshToken) {
    try {
      return await this.tokenRepository.delete({
        id: tokenId,
      });
    } catch {
      const err = createHttpError(
        500,
        "Failed to delete refresh token from database",
      );
      throw err;
    }
  }

  async deleteRefreshTokens({ userId }: DeleteRefreshTokens) {
    try {
      return await this.tokenRepository.delete({
        user: {
          id: userId,
        },
      });
    } catch {
      const err = createHttpError(
        500,
        "Failed to delete refresh tokens from database",
      );
      throw err;
    }
  }
}
