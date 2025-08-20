import request from "supertest";
import app from "../../src/app";
import { createJWKSMock, JWKSMock } from "mock-jwks";

import { AppDataSource } from "../../src/utils/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";

describe("GET /auth/self", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let user: User;

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
      email: "manthan@gmail.com",
      password: hashedPassword,
    };

    const userRepository = connection.getRepository(User);
    user = await userRepository.save({
      ...userData,
      role: UserRole.CUSTOMER,
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
      });

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(200);
    });

    it("should return the user data", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
      });

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      console.log(response.body);

      expect((response.body as Record<string, object>).id).toBe(user.id);
    });

    it("should not return password in user", async () => {
      const accessToken = jwks.token({
        sub: String(user.id),
        id: user.id,
        role: user.role,
      });

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.body as Record<string, object>).not.toHaveProperty(
        "password",
      );
    });

    it("should  return 401 status code if token does not exist", async () => {
      const response = await request(app).get("/auth/self").send();

      expect(response.statusCode).toBe(401);
    });
  });
});
