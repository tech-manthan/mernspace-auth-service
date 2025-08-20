import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { JWKSMock, createJWKSMock } from "mock-jwks";

describe("DELETE /tenants/:id", () => {
  let connection: DataSource;
  let tenant: Tenant;
  let adminUser: User;
  let accessToken: string;
  let jwks: JWKSMock;

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

    const tennatRepository = connection.getRepository(Tenant);
    tenant = await tennatRepository.save({
      name: "Tenant",
      address: "Tenant Address",
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
        .delete(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });

    it("should delete tenant from the database", async () => {
      await request(app)
        .delete(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(tenants).toHaveLength(0);
    });

    it("should return tenant id of deleted tenant in body", async () => {
      const response = await request(app)
        .delete(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      const responseData = response.body as Record<string, object>;

      expect(responseData).toHaveProperty("id");
      expect(responseData.id).toBe(tenant.id);
    });

    it("should return 400 status code if id is invalid", async () => {
      const response = await request(app)
        .delete(`/tenants/sdd`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(400);
    });

    it("should return 404 status code if tenant is not found", async () => {
      const response = await request(app)
        .delete(`/tenants/2`)
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();

      expect(response.statusCode).toBe(404);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const response = await request(app)
        .delete(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${""};`])
        .send();
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(response.statusCode).toBe(401);
      expect(tenants).toHaveLength(1);
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
        .delete(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(response.statusCode).toBe(403);
      expect(tenants).toHaveLength(1);
    });
  });
});
