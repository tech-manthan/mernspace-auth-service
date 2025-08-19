import { Logger } from "winston";
import { PasswordService } from "../services/PasswordService";
import { UserService } from "../services/UserService";
import { NextFunction, Request, Response } from "express";
import { CreateUserRequest, UserFilter, UserRole } from "../types/user.types";
import { matchedData, validationResult } from "express-validator";
import createHttpError from "http-errors";

export class UserController {
  constructor(
    private userService: UserService,
    private passwordService: PasswordService,
    private logger: Logger,
  ) {}

  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { firstName, lastName, email, password, role } = req.body;

      if (role === UserRole.CUSTOMER) {
        const err = createHttpError(400, "Customer can't be created by admin");
        next(err);
        return;
      }

      this.logger.debug("New request to create a user", {
        firstName,
        lastName,
        email,
        password: "******",
        role,
      });

      const foundUser = await this.userService.findUserByEmail({
        email,
      });

      if (foundUser) {
        const err = createHttpError(400, "User already exist");
        next(err);
        return;
      }

      const hashedPassword = await this.passwordService.hash(password);

      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      });

      this.logger.info("User created successfully", {
        id: user.id,
        email: user.email,
      });

      res.status(201).json({
        id: user.id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const filter = matchedData<UserFilter>(req, {
        onlyValidData: true,
      });

      const [users, count] = await this.userService.getAll(filter);
      this.logger.info("All Tenants have been fetched");

      res.status(200).json({
        currentPage: filter.currentPage,
        perPage: filter.perPage,
        total: count,
        data: users,
      });
    } catch (err) {
      next(err);
      return;
    }
  }
}
