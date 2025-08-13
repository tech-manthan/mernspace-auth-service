import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types/auth.types";

import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { UserRole } from "../types/user.types";
import { PasswordService } from "../services/PasswordService";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";

export class AuthController {
  constructor(
    private userService: UserService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private logger: Logger,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { firstName, lastName, email, password } = req.body;
      this.logger.debug("New request to register a user", {
        firstName,
        lastName,
        email,
        password: "******",
      });

      const foundUser = await this.userService.findUserByEmail({
        email,
      });

      if (foundUser) {
        const err = createHttpError(400, "User already registerd, try login");
        next(err);
        return;
      }

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

      const accessToken = this.tokenService.generateAccessToken({
        sub: String(user.id),
        role: user.role,
      });

      const createdRefreshToken = await this.tokenService.createRefreshToken({
        userId: user.id,
      });

      const refreshToken = this.tokenService.generateRefreshToken({
        sub: String(createdRefreshToken.id),
        userId: user.id,
        role: user.role,
      });

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: this.tokenService.AccessTokenExpiry * 1000,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: this.tokenService.RefreshTokenExpiry * 1000,
        httpOnly: true,
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
