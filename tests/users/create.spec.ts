import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/utils/data-source";
import request from "supertest";
import app from "../../src/app";
import { JWKSMock, createJWKSMock } from "mock-jwks";
import { User } from "../../src/entity/User";
import { hashPassword } from "../utils";
import { UserRole } from "../../src/types/user.types";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /users", () => {
  let connection: DataSource;
  let jwks: JWKSMock;

  let adminUser: User;
  let accessToken: string;
  let tenant: Tenant;

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
    it("should return 201 status code", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.statusCode).toBe(201);
    });

    it("should return id of the created user", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      expect(response.body).toHaveProperty("id");
    });

    it("should create user in the database", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: (response.body as Record<string, number>).id,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.firstName).toBe(userData.firstName);
      expect(user?.lastName).toBe(userData.lastName);
      expect(user?.email).toBe(userData.email);
      expect(user?.role).toBe(userData.role);
    });

    it("should store the hash password in database", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: (response.body as Record<string, number>).id,
        },

        select: {
          password: true,
        },
      });

      expect(user).not.toBeNull();

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toHaveLength(60);
      expect(user?.password).toMatch(/^\$2(b|a)\$\d+\$/);
    });

    it("should return 400 status code if email is already exists", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: UserRole.CUSTOMER });

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(2);
    });

    it("should return 400 status code if created user is customer", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.CUSTOMER,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 401 status code if user is not authenticated", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${"accessToken"};`])
        .send(userData);

      const userRepository = connection.getRepository(User);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(401);
      expect(users).toHaveLength(1);
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

      const createUserData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(createUserData);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(403);
      expect(users).toHaveLength(2);
    });
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        (response.body as Record<string, Array<object>>).errors.length,
      ).toBeGreaterThanOrEqual(1);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if firstName is missing", async () => {
      const userData = {
        firstName: "",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if lastName is missing", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "",
        email: "mayank@gmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if password is missing", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if role is missing", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Password@123",
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if tenant id is missing if role is MANAGER", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "Password@123",
        role: UserRole.MANAGER,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });
  });

  describe("Fields are in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "     mayank@gmail.com       ",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: (response.body as Record<string, number>).id,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe("mayank@gmail.com");
    });

    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayankgmail.com",
        password: "Mayank@123",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if password length is less than 8 characters", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "ss",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if password is invalid", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "",
        role: UserRole.MANAGER,
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if role is invalid", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "",
        role: "Role",
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return 400 status code if tennat id is not valid", async () => {
      const userData = {
        firstName: "Mayank",
        lastName: "Sharma",
        email: "mayank@gmail.com",
        password: "",
        role: "Role",
        tenantId: "gee",
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });
  });
});
