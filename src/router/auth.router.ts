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

export default authRouter;
