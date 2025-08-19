import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { JWKSMock, createJWKSMock } from "mock-jwks";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { Tenant } from "../../src/entity/Tenant";

describe("PATCH /users/:id", () => {
  let connection: DataSource;
  let jwks: JWKSMock;
  let stopJwks: () => void;
  let admin: User;
  let manager: User;
  let accessToken: string;
  let tenant1: Tenant;
  let tenant2: Tenant;

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

    admin = await userRepository.save({
      ...userData,
      role: UserRole.ADMIN,
    });

    accessToken = jwks.token({
      sub: String(admin.id),
      id: admin.id,
      role: admin.role,
    });

    const tennatRepository = connection.getRepository(Tenant);
    tenant1 = await tennatRepository.save({
      name: "Tenant 1",
      address: "Tenant 1 Address",
    });

    tenant2 = await tennatRepository.save({
      name: "Tenant 2",
      address: "Tenant 2 Address",
    });

    manager = await userRepository.save({
      firstName: "Raman",
      lastName: "Dahiya",
      email: "raman@gmail.com",
      password: hashedPassword,
      role: UserRole.MANAGER,
      tenant: {
        id: tenant1.id,
      },
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
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(200);
    });

    it("should update user in the database", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: manager.id,
        },
        relations: ["tenant"],
      });

      expect(user).not.toBeNull();
      expect(user?.firstName).toBe(userData.firstName);
      expect(user?.lastName).toBe(userData.lastName);
      expect(user?.email).toBe(userData.email);
      expect(user?.role).toBe(userData.role);
      expect(user?.tenant?.id).toBe(userData.tenantId);
    });

    it("should set null in tenant if user is not manager", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.ADMIN,
        tenantId: tenant2.id,
      };

      await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: manager.id,
        },
        relations: ["tenant"],
      });

      expect(user?.role).toBe(UserRole.ADMIN);
      expect(user?.tenant).toBeNull();
    });

    it("should return id of the updated tenant", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.body).toHaveProperty("id");
      expect(manager.id).toBe((response.body as Record<string, number>).id);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${"accessToken"};`])
        .send(userData);

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

      const updateUserData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(updateUserData);

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Fields are in proper format", () => {
    it("should return 400 status code if id is invalid", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanu@gmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/dbs`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should trim the email field", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "  ramanu@gmail.com  ",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: (response.body as Record<string, number>).id,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe("ramanu@gmail.com");
    });

    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanugmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if password length is less than 8 characters", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanugmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if password is invalid", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanugmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if role is invalid", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanugmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: tenant2.id,
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 status code if user id is not valid", async () => {
      const userData = {
        firstName: "Raman U",
        lastName: "Dahiya U",
        email: "ramanugmail.com",
        password: "Raman@123",
        role: UserRole.MANAGER,
        tenantId: "gee",
      };

      const response = await request(app)
        .patch(`/users/${manager.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(400);
    });
  });
});
