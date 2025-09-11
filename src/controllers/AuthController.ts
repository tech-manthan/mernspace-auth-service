import { NextFunction, Response } from "express";
import {
  AuthRequest,
  LoginUserRequest,
  RegisterUserRequest,
} from "../types/auth.types";

import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { UserRole } from "../types/user.types";
import { PasswordService } from "../services/PasswordService";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import { GenerateTokenData } from "../types/token.types";

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly logger: Logger,
  ) {}

  private async generateAndSetCookies(
    { id, role }: GenerateTokenData,
    res: Response,
    isNull: boolean = false,
  ) {
    let accessToken: string;
    let refreshToken: string;

    if (isNull) {
      accessToken = "";
      refreshToken = "";
    } else {
      accessToken = this.tokenService.generateAccessToken({
        sub: String(id),
        id: id,
        role: role,
      });

      const createdRefreshToken = await this.tokenService.createRefreshToken({
        userId: id,
      });

      refreshToken = this.tokenService.generateRefreshToken({
        id: id,
        sub: String(id),
        refreshTokenId: createdRefreshToken.id,
        role: role,
      });
    }

    res.cookie("accessToken", accessToken, {
      domain: "localhost",
      sameSite: "strict",
      maxAge: isNull ? -1000 : this.tokenService.AccessTokenExpiry * 1000,
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      domain: "localhost",
      sameSite: "strict",
      maxAge: isNull ? -1000 : this.tokenService.RefreshTokenExpiry * 1000,
      httpOnly: true,
    });
  }

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        // res.status(400).json({
        //   errors: result.array(),
        // });
        next(createHttpError(400, result.array().at(0)?.msg as string));
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

      await this.generateAndSetCookies(
        {
          id: user.id,
          role: user.role,
        },
        res,
      );

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

  async login(req: LoginUserRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        // res.status(400).json({
        //   errors: result.array(),
        // });
        next(createHttpError(400, result.array().at(0)?.msg as string));

        return;
      }

      const { email, password } = req.body;
      this.logger.debug("New request to login a user", {
        email,
        password: "******",
      });

      const user = await this.userService.findUserByEmail({
        email,
        hasPassword: true,
      });

      if (!user) {
        const err = createHttpError(401, "Invalid email or password");
        next(err);
        return;
      }

      const isValidPassword = await this.passwordService.compare(
        password,
        user.password,
      );

      if (!isValidPassword) {
        const err = createHttpError(401, "Invalid email or password");
        next(err);
        return;
      }

      await this.generateAndSetCookies(
        {
          id: user.id,
          role: user.role,
        },
        res,
      );

      this.logger.info("User logged in successfully", {
        id: user.id,
        email: user.email,
      });

      res.status(200).json({
        id: user.id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async self(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.findUserById({
        id: req.auth.id,
      });

      if (!user) {
        const err = createHttpError(401, "Invalid accessToken");
        next(err);
        return;
      }

      res.status(200).json(user);
    } catch (err) {
      next(err);
      return;
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshTokenId, id, role } = req.auth;

      await this.tokenService.deleteRefreshToken({
        tokenId: refreshTokenId,
      });

      await this.generateAndSetCookies(
        {
          id: id,
          role: role,
        },
        res,
      );

      this.logger.info("User tokens refreshed successfully", {
        id: id,
      });

      res.status(200).json({
        id: id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshTokenId, id, role } = req.auth;

      await this.tokenService.deleteRefreshToken({
        tokenId: refreshTokenId,
      });

      await this.generateAndSetCookies(
        {
          id: id,
          role: role,
        },
        res,
        true,
      );

      this.logger.info("User logged out successfully", {
        id: id,
      });

      res.status(200).json({
        id: id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }
}
