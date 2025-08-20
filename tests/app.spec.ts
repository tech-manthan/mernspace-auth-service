import app from "../src/app";
import { Config } from "../src/config";
import { calculateDiscount } from "../src/utils/test.example";
import request from "supertest";

console.log("DBHOST", Config.DB_HOST);

describe("App", () => {
  it("should return correct discount amount", () => {
    const discount = calculateDiscount(100, 10);
    expect(discount).toBe(10);
  });

  it("should return 200 status code", async () => {
    const response = await request(app).get("/").send();

    expect(response.status).toBe(200);
  });
});
