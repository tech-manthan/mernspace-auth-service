import { sign } from "jsonwebtoken";
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
  private readonly privateKey: string;
  private readonly refreshTokenSecret: string;

  /**
   * AccessTokenExpiry  -> In Seconds
   */
  public readonly AccessTokenExpiry = 60 * 60;
  /**
   * RefreshTokenExpiry  -> In Seconds
   */
  public readonly RefreshTokenExpiry = 60 * 60 * 24 * 365;

  constructor(
    private readonly tokenRepository: Repository<Token>,
    private readonly logger: Logger,
  ) {
    if (!Config.PRIVATE_KEY) {
      logger.error("Failed to read keys");
      process.exit(1);
      return;
    }
    this.privateKey = Config.PRIVATE_KEY;

    if (!Config.REFRESH_TOKEN_SECRET) {
      logger.error("Failed to read keys");
      process.exit(1);
      return;
    }
    this.refreshTokenSecret = Config.REFRESH_TOKEN_SECRET;
  }

  generateAccessToken(payload: AccessTokenPayload) {
    return sign(payload, this.privateKey, {
      algorithm: "RS256",
      expiresIn: this.AccessTokenExpiry,
      issuer: "auth-service",
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload) {
    return sign(payload, this.refreshTokenSecret, {
      algorithm: "HS256",
      expiresIn: this.RefreshTokenExpiry,
      issuer: "auth-service",
    });
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
