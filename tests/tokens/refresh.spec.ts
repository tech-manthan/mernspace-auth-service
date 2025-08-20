import request from "supertest";
import app from "../../src/app";
import { createJWKSMock, JWKSMock } from "mock-jwks";

import { AppDataSource } from "../../src/utils/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { hashPassword, isJwt } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { Token } from "../../src/entity/Token";
import { sign } from "jsonwebtoken";
import { Config } from "../../src/config";

interface Headers {
  ["set-cookie"]: string[];
}

describe("POST /auth/refresh", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let user: User;
  let token: Token;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501/");
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();

    const hashedPassword = await hashPassword("Password@123");
    const userData = {
      firstName: "Manthan",
      lastName: "Sharma",
      email: "manthan@gmail.com",
      password: hashedPassword,
    };

    const userRepository = connection.getRepository(User);
    const tokenRepository = connection.getRepository(Token);

    user = await userRepository.save({
      ...userData,
      role: UserRole.CUSTOMER,
    });
    token = await tokenRepository.save({
      user: {
        id: user.id,
      },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
  });

  afterEach(() => {
    jwks.stop();
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
        exp: -1000,
      });
      const refreshToken = sign(
        {
          sub: String(user.id),
          id: user.id,
          role: user.role,
          refreshTokenId: token.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        {
          algorithm: "HS256",
          expiresIn: 60 * 60 * 24 * 365,
        },
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `accessToken=${accessToken};`,
          `refreshToken=${refreshToken}`,
        ])
        .send();
      expect(response.statusCode).toBe(200);
    });

    it("should return the new access token & new refresh token inside a cookie", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
        exp: -1000,
      });
      const refreshToken = sign(
        {
          sub: String(user.id),
          id: user.id,
          role: user.role,
          refreshTokenId: token.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        {
          algorithm: "HS256",
          expiresIn: 60 * 60 * 24 * 365,
        },
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `accessToken=${accessToken};`,
          `refreshToken=${refreshToken}`,
        ])
        .send();

      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      let newAccessToken: string | null = null;
      let newRefreshToken: string | null = null;

      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          newAccessToken = cookie.split(";")[0].split("=")[1];
        }
        if (cookie.startsWith("refreshToken=")) {
          newRefreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(newAccessToken).not.toBeNull();
      expect(newRefreshToken).not.toBeNull();
      expect(newAccessToken).not.toBe(accessToken);
      expect(newRefreshToken).not.toBe(refreshToken);

      expect(isJwt(newAccessToken)).toBeTruthy();
      expect(isJwt(newRefreshToken)).toBeTruthy();
    });

    it("should store refresh token in database", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
        exp: -1000,
      });
      const refreshToken = sign(
        {
          sub: String(user.id),
          id: user.id,
          role: user.role,
          refreshTokenId: token.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        {
          algorithm: "HS256",
          expiresIn: 60 * 60 * 24 * 365,
        },
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `accessToken=${accessToken};`,
          `refreshToken=${refreshToken}`,
        ])
        .send();

      const tokenRepository = connection.getRepository(Token);

      const tokens = await tokenRepository.find({
        where: {
          user: {
            id: (response.body as Record<string, number>).id,
          },
        },
      });

      expect(tokens).toHaveLength(1);
    });

    it("should  return 401 status code if refresh token does not exist or invalid", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
        exp: -1000,
      });
      const refreshToken = sign(
        {
          sub: String(user.id),
          id: user.id,
          role: user.role,
          refreshTokenId: token.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        {
          algorithm: "HS256",
          expiresIn: -1000,
        },
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `accessToken=${accessToken};`,
          `refreshToken=${refreshToken}`,
        ])
        .send();

      expect(response.statusCode).toBe(401);
    });
  });
});
