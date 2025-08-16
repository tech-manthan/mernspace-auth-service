import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";

describe("GET /tenants/:id", () => {
  let connection: DataSource;
  let tenant: Tenant;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();

    const tennatRepository = connection.getRepository(Tenant);

    tenant = await tennatRepository.save({
      name: "Tenant",
      address: "Tenant Address",
    });
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get(`/tenants/${tenant.id}`).send();

      expect(response.statusCode).toBe(200);
    });

    it("should return tenant in response body", async () => {
      const response = await request(app).get(`/tenants/${tenant.id}`).send();

      const responseData = response.body as Record<string, object>;

      expect(responseData).toHaveProperty("id");
      expect(responseData).toHaveProperty("name");
      expect(responseData).toHaveProperty("address");

      expect(responseData.id).toBe(tenant.id);
      expect(responseData.name).toBe(tenant.name);
      expect(responseData.address).toBe(tenant.address);
    });

    it("should return 400 status code if id is invalid", async () => {
      const response = await request(app).get(`/tenants/sdd`).send();

      expect(response.statusCode).toBe(400);
    });

    it("should return 404 status code if tenant is not found", async () => {
      const response = await request(app).get(`/tenants/2`).send();

      expect(response.statusCode).toBe(404);
    });
  });
});
