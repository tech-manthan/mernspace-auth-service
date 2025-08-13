import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/utils/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { UserRole } from "../../src/types/user.types";
import { isJwt } from "../utils";
import { Token } from "../../src/entity/Token";

interface Headers {
  ["set-cookie"]: string[];
}

describe("POST /auth/register", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  describe("Given all fields", () => {
    it("should return 201 status code", async () => {
      // AAA -> Arange,Act,Assert

      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(201);
    });

    it("should return valid json response", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should persist user in the database", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
      expect(users[0].email).toBe(userData.email);
    });

    it("should return an id of the created user", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect((response.body as Record<string, string>).id).toBe(users[0].id);
    });

    it("should assign a customer role", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(UserRole.CUSTOMER);
    });

    it("should store the hash password in database", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2(b|a)\$\d+\$/);
    });

    it("should return 400 status code if email is already exists", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: UserRole.CUSTOMER });

      const response = await request(app).post("/auth/register").send(userData);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return the access token & refresh token inside a cookie", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

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
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const tokenRepository = connection.getRepository(Token);

      // const tokens = await tokenRepository.find({
      //   where: {
      //     user: {
      //       id: (response.body as Record<string, number>).id,
      //     },
      //   },
      // });

      const tokens = await tokenRepository
        .createQueryBuilder("token")
        .where("token.userId = :userId", {
          userId: (response.body as Record<string, number>).id,
        })
        .getMany();

      expect(tokens).toHaveLength(1);
    });
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        (response.body as Record<string, Array<object>>).errors.length,
      ).toBeGreaterThanOrEqual(1);
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if firstName is missing", async () => {
      const userData = {
        firstName: "",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if lastName is missing", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "",
        email: "manthan@gmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if password is missing", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthan@gmail.com",
        password: "",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
  });

  describe("Fields are in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "   manthan@gmail.com   ",
        password: "Password@123",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0].email).toBe("manthan@gmail.com");
    });

    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthangmail.com",
        password: "Password@123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if password length is less than 8 characters", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthangmail.com",
        password: "hdh",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if password is invalid", async () => {
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "manthangmail.com",
        password: "hdh2535h@",
      };

      const response = await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
  });
});
