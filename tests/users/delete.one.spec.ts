import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { JWKSMock, createJWKSMock } from "mock-jwks";

describe("DELETE /tenants/:id", () => {
  let connection: DataSource;
  let user: User;
  let adminUser: User;
  let accessToken: string;
  let jwks: JWKSMock;
  let stopJwks: () => void;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");

    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    stopJwks = jwks.start();

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

    adminUser = await userRepository.save({
      ...userData,
      role: UserRole.ADMIN,
    });

    accessToken = jwks.token({
      sub: String(adminUser.id),
      id: adminUser.id,
      role: adminUser.role,
    });

    const password = await hashPassword("Mayank@123");
    user = await userRepository.save({
      firstName: "Mayank",
      lastName: "Sharma",
      email: "mayank@gmail.com",
      password: password,
      role: UserRole.MANAGER,
    });
  });

  afterEach(() => {
    stopJwks();
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });

    it("should delete user from the database", async () => {
      await request(app)
        .delete(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      const userRepository = AppDataSource.getRepository(User);
      const userFromDb = await userRepository.findOne({
        where: {
          id: user.id,
        },
      });

      expect(userFromDb).toBeNull();
    });

    it("should return user id of deleted user in body", async () => {
      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      const responseData = response.body as Record<string, object>;

      expect(responseData).toHaveProperty("id");
      expect(responseData.id).toBe(user.id);
    });

    it("should return 400 status code if id is invalid", async () => {
      const response = await request(app)
        .delete(`/users/sdd`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(400);
    });

    it("should return 404 status code if user is not found", async () => {
      const response = await request(app)
        .delete(`/users/5`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(404);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${""};`])
        .send();
      const userRepository = connection.getRepository(User);
      const userFromDb = await userRepository.findOne({
        where: {
          id: user.id,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(userFromDb).not.toBeNull();
    });

    it("should return 403 status code if user is not admin", async () => {
      const hashedPassword = await hashPassword("Password@123");
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "raman@gmail.com",
        password: hashedPassword,
      };

      const userRepository = connection.getRepository(User);

      const newUser = await userRepository.save({
        ...userData,
        role: UserRole.CUSTOMER,
      });

      accessToken = jwks.token({
        sub: String(newUser.id),
        id: newUser.id,
        role: newUser.role,
      });

      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      const userFromDb = await userRepository.findOne({
        where: {
          id: user.id,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(userFromDb).not.toBeNull();
    });

    it("should return 400 status code if deleting user is customer", async () => {
      const hashedPassword = await hashPassword("Password@123");
      const userData = {
        firstName: "Manthan",
        lastName: "Sharma",
        email: "raman@gmail.com",
        password: hashedPassword,
      };

      const userRepository = connection.getRepository(User);

      const newUser = await userRepository.save({
        ...userData,
        role: UserRole.CUSTOMER,
      });

      const response = await request(app)
        .delete(`/users/${newUser.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      const userFromDb = await userRepository.findOne({
        where: {
          id: newUser.id,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(userFromDb).not.toBeNull();
    });
  });
});
