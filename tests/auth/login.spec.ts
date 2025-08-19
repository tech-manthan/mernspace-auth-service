import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/utils/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { hashPassword, isJwt } from "../utils";
import { Token } from "../../src/entity/Token";
import { UserRole } from "../../src/types/user.types";

interface Headers {
  ["set-cookie"]: string[];
}

describe("POST /auth/login", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
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
    await userRepository.save({
      ...userData,
      role: UserRole.CUSTOMER,
    });
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(200);
    });

    it("should return valid json response", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should return an id of the logged in user", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.body).toHaveProperty("id");
      expect((response.body as Record<string, string>).id).toBe(users[0].id);
    });

    it("should return 401 status code if user is not registered", async () => {
      const userData = {
        email: "mayank@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(401);
    });

    it("should return 401 status code if password is not correct", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Passwor@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(401);
    });

    it("should return the access token & refresh token inside a cookie", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }
        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });

    it("should store refresh token in database", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

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
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      const userData = {
        email: "",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        (response.body as Record<string, Array<object>>).errors.length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("should return 400 status code if password is missing", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("Fields are in proper format", () => {
    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        email: "manthangmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if password length is less than 8 characters", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if password is invalid", async () => {
      const userData = {
        email: "manthan@gmail.com",
        password: "123",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });
  });
});
