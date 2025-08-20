import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { JWKSMock, createJWKSMock } from "mock-jwks";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { Tenant } from "../../src/entity/Tenant";

describe("GET /users/:id", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let user: User;
  let tenant: Tenant;
  let admin: User;
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

    const userRepository = connection.getRepository(User);

    const adminData = {
      firstName: "Mayank",
      lastName: "Sharma",
      email: "mayank@gmail.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    };

    admin = await userRepository.save(adminData);

    accessToken = jwks.token({
      sub: String(admin.id),
      id: admin.id,
      role: admin.role,
    });

    const tennatRepository = connection.getRepository(Tenant);

    tenant = await tennatRepository.save({
      name: "Tenant",
      address: "Tenant Address",
    });

    const userData = {
      firstName: "Manthan",
      lastName: "Sharma",
      email: "manthan@gmail.com",
      password: hashedPassword,
      role: UserRole.MANAGER,
    };
    user = await userRepository.save({
      ...userData,
      tenant: tenant,
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
        .get(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(200);
    });

    it("should return user in response body", async () => {
      const response = await request(app)
        .get(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      const responseData = response.body as Record<string, object>;

      expect(responseData).toHaveProperty("id");
      expect(responseData).toHaveProperty("firstName");
      expect(responseData).toHaveProperty("lastName");
      expect(responseData).toHaveProperty("email");
      expect(responseData).toHaveProperty("role");
      expect(responseData).toHaveProperty("tenant");

      expect(responseData.id).toBe(user.id);
      expect(responseData.firstName).toBe(user.firstName);
      expect(responseData.lastName).toBe(user.lastName);
      expect(responseData.email).toBe(user.email);
      expect(responseData.role).toBe(user.role);
      expect((responseData.tenant as Record<string, number>).id).toBe(
        user.tenant?.id,
      );
    });

    it("should not return password in user", async () => {
      const response = await request(app)
        .get(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.body as Record<string, object>).not.toHaveProperty(
        "password",
      );
    });

    it("should return 400 status code if id is invalid", async () => {
      const response = await request(app)
        .get(`/users/sss`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(400);
    });

    it("should return 404 status code if user is not found", async () => {
      const response = await request(app)
        .get(`/users/4`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(404);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const response = await request(app)
        .get(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${"accessToken"};`])
        .send();

      expect(response.statusCode).toBe(401);
    });

    it("should return 403 status code if user is not admin", async () => {
      const hashedPassword = await hashPassword("Password@123");
      const userData = {
        firstName: "Nikhil",
        lastName: "Matta",
        email: "nikhil@gmail.com",
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
        .get(`/users/${user.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.statusCode).toBe(403);
    });
  });
});
