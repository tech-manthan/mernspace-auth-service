import { Logger } from "winston";
import { PasswordService } from "../services/PasswordService";
import { UserService } from "../services/UserService";
import { NextFunction, Request, Response } from "express";
import {
  CreateUserRequest,
  UpdateUserData,
  UpdateUserRequest,
  UserFilter,
  UserRole,
} from "../types/user.types";
import { matchedData, validationResult } from "express-validator";
import createHttpError from "http-errors";
import { IdParams } from "../types/common.types";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly logger: Logger,
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

      const { firstName, lastName, email, password, role, tenantId, isBanned } =
        req.body;

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
        tenantId,
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
        ...(tenantId !== undefined && { tenantId: tenantId }),
        ...(isBanned !== undefined && { isBanned: isBanned }),
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

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { id } = matchedData<IdParams>(req, {
        onlyValidData: true,
      });

      const user = await this.userService.findUserById({
        id: id,
      });

      if (!user) {
        const err = createHttpError(404, "User not found");
        next(err);
        return;
      }

      this.logger.info("User have been fetched");

      res.status(200).json(user);
    } catch (err) {
      next(err);
      return;
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { id } = matchedData<IdParams>(req, {
        onlyValidData: true,
      });

      const user = await this.userService.findUserById({ id });

      if (!user) {
        const err = createHttpError(404, "User not found");
        next(err);
        return;
      }

      if (user.role === UserRole.CUSTOMER) {
        const err = createHttpError(400, "Customer can't be deleted by admin");
        next(err);
        return;
      }

      await this.userService.delete(id);

      this.logger.info("User have been deleted");

      res.status(200).json({
        id: id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { id } = matchedData<IdParams>(req, {
        onlyValidData: true,
      });

      const { email, firstName, lastName, role, password, tenantId, isBanned } =
        matchedData<UpdateUserData>(req, {
          onlyValidData: true,
        });

      const user = await this.userService.findUserById({ id });

      if (!user) {
        const err = createHttpError(404, "User not found");
        next(err);
        return;
      }

      if (role === UserRole.CUSTOMER) {
        const err = createHttpError(400, "Customer can't be updated by admin");
        next(err);
        return;
      }

      let hashedPassword: string = "";
      if (password) {
        hashedPassword = await this.passwordService.hash(password);
      }

      await this.userService.update(id, {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        tenantId,
        isBanned,
      });

      this.logger.info("User have been updated");

      res.status(200).json({
        id: id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }
}
