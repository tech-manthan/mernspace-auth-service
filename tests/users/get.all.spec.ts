import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { hashPassword } from "../utils";
import { User } from "../../src/entity/User";
import { UserRole } from "../../src/types/user.types";
import { JWKSMock, createJWKSMock } from "mock-jwks";

describe("GET /users", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let user: User;
  let accessToken: string;
  beforeAll(async () => {
    jwks = createJWKSMock("http://127.0.0.1:5501/");

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
      email: "admin@gmail.com",
      password: hashedPassword,
    };

    const userRepository = connection.getRepository(User);

    user = await userRepository.save({
      ...userData,
      role: UserRole.ADMIN,
    });

    accessToken = jwks.token({
      sub: String(user.id),
      id: user.id,
      role: user.role,
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
      const response = await request(app)
        .get("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(200);
    });

    it("should return total count,perPage,currentPage & users as data field", async () => {
      const response = await request(app)
        .get(`/users?perPage=2&pageNumber=2&q=Mayank`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("perPage");
      expect(response.body).toHaveProperty("currentPage");
      expect(response.body).toHaveProperty("data");

      const responseData = response.body as Record<string, object>;

      expect(Number.isInteger(responseData.total)).toBe(true);
      expect(Number.isInteger(responseData.perPage)).toBe(true);
      expect(Number.isInteger(responseData.currentPage)).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    it("should return 400 status code if role is invalid", async () => {
      const response = await request(app)
        .get(`/users?perPage=2&pageNumber=2&q=Tenant&role=Role`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(400);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const response = await request(app)
        .get(`/users?perPage=2&pageNumber=2&q=Tenant&role=Admin`)
        .set("Cookie", [`accessToken=${"accessToken"};`])
        .send();

      expect(response.statusCode).toBe(401);
    });

    it("should return 403 status code if user is not admin", async () => {
      const hashedPassword = await hashPassword("Password@123");
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: hashedPassword,
      };

      const userRepository = connection.getRepository(User);

      const user = await userRepository.save({
        ...userData,
        role: UserRole.CUSTOMER,
      });

      accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
      });

      const response = await request(app)
        .get(`/users?perPage=2&pageNumber=2&q=Tenant&role=Admin`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(403);
    });
  });
});
