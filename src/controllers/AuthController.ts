import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types/auth.types";

import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { UserRole } from "../types/user.types";
import { PasswordService } from "../services/PasswordService";

export class AuthController {
  constructor(
    private userService: UserService,
    private passwordService: PasswordService,
    private logger: Logger,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;
      this.logger.debug("New request to register a user", {
        firstName,
        lastName,
        email,
        password: "******",
      });

      const hashedPassword = await this.passwordService.hash(password);

      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      });

      this.logger.info("User registered successfully", {
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
}
