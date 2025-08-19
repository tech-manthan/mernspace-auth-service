import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";

describe("GET /users", () => {
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
    it("should return 200 status code", async () => {
      const response = await request(app).get("/users").send();

      expect(response.statusCode).toBe(200);
    });

    it("should return total count,perPage,currentPage & users as data field", async () => {
      const response = await request(app)
        .get(`/users?perPage=2&pageNumber=2&q=Mayank`)
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
        .send();

      expect(response.statusCode).toBe(400);
    });
  });
});
