import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../utils/data-source";
import { User } from "../entity/User";
import logger from "../utils/logger";
import { PasswordService } from "../services/PasswordService";

const authRouter = Router();

const userRepository = AppDataSource.getRepository(User);

const userService = new UserService(userRepository);
const passwordService = new PasswordService();

const authController = new AuthController(userService, passwordService, logger);

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    await authController.register(req, res, next);
  },
);

export default authRouter;
