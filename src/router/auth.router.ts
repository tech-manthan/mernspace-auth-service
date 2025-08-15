import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../utils/data-source";
import { User } from "../entity/User";
import logger from "../utils/logger";
import { PasswordService } from "../services/PasswordService";
import registerValidator from "../validators/register.validator";
import { TokenService } from "../services/TokenService";
import { Token } from "../entity/Token";
import loginValidator from "../validators/login.validator";
import { AuthRequest } from "../types/auth.types";
import authenticate from "../middleware/authenticate";
import validateRefreshToken from "../middleware/validate.refresh.token";
import parseRefreshToken from "../middleware/parse.refresh.token";

const authRouter = Router();

const userRepository = AppDataSource.getRepository(User);
const tokenRepository = AppDataSource.getRepository(Token);

const userService = new UserService(userRepository);
const passwordService = new PasswordService();
const tokenService = new TokenService(tokenRepository, logger);

const authController = new AuthController(
  userService,
  passwordService,
  tokenService,
  logger,
);

authRouter.post(
  "/register",
  registerValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.register(req, res, next);
  },
);

authRouter.post(
  "/login",
  loginValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.login(req, res, next);
  },
);

authRouter.get(
  "/self",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.self(req as AuthRequest, res, next);
  },
);

authRouter.post(
  "/refresh",
  validateRefreshToken,
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.refresh(req as AuthRequest, res, next);
  },
);

authRouter.post(
  "/logout",
  authenticate,
  parseRefreshToken,
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.logout(req as AuthRequest, res, next);
  },
);

export default authRouter;
