import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { JWKSMock, createJWKSMock } from "mock-jwks";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { Tenant } from "../../src/entity/Tenant";

describe("PATCH /tenants/:id", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let adminUser: User;
  let accessToken: string;
  let tenant: Tenant;

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
      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      expect(response.statusCode).toBe(200);
    });

    it("should update tenant in the database", async () => {
      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(tenants).toHaveLength(1);
      expect(tenants[0].address).toBe(tenantData.address);
      expect(tenants[0].name).toBe(tenantData.name);
    });

    it("should return id of the updated tenant", async () => {
      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(response.body).toHaveProperty("id");
      expect(tenants[0].id).toBe((response.body as Record<string, number>).id);

      //   const tenantRepository = AppDataSource.getRepository(Tenant);
      //   const tenants = await tenantRepository.find({
      //     where: {
      //       id: (response.body as Record<string, number>).id,
      //     },
      //   });

      //   expect(tenants).toHaveLength(1);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${"accessToken"};`])
        .send(tenantData);

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

      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Fields are in proper format", () => {
    it("should return 400 status code if id is invalid", async () => {
      const tenantData = {
        name: "Tenant Updated",
        address: "Tenant Updated Address",
      };

      const response = await request(app)
        .patch(`/tenants/ddd`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 if name length is less than 3 and greater than 100", async () => {
      const tenantData = {
        name: "Te",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 if address length is less than 10 and greater than 255", async () => {
      const tenantData = {
        address: "Tenant",
      };

      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(tenantData);

      expect(response.statusCode).toBe(400);
    });
  });
});
