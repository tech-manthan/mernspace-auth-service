import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { Request } from "express";
import { AuthCookie } from "../types/auth.types";
import { AppDataSource } from "../utils/data-source";
import { Token } from "../entity/Token";
import logger from "../utils/logger";
import { RefreshTokenPayload } from "../types/token.types";

export default expressjwt({
  secret: Config.REFRESH_TOKEN_SECRET!,
  algorithms: ["HS256"],
  getToken(req: Request) {
    const { refreshToken } = req.cookies as AuthCookie;
    return refreshToken;
  },
  async isRevoked(req: Request, refreshToken) {
    if (!refreshToken) {
      return false;
    }
    try {
      const refreshhTokenPayload = refreshToken.payload as RefreshTokenPayload;
      const tokenRepository = AppDataSource.getRepository(Token);
      const token = await tokenRepository.findOne({
        where: {
          id: refreshhTokenPayload.refreshTokenId,
          user: {
            id: refreshhTokenPayload.id,
          },
        },
      });

      return token === null;
    } catch {
      logger.error("Failed to validate refresh token");
      return false;
    }
  },
});
