import { NextFunction, Request, Response, Router } from "express";
import { AppDataSource } from "../utils/data-source";
import logger from "../utils/logger";
import authenticate from "../middleware/authenticate";
import canAccess from "../middleware/can.access";
import { UserRole } from "../types/user.types";
import { UserService } from "../services/UserService";
import { User } from "../entity/User";
import { PasswordService } from "../services/PasswordService";
import { UserController } from "../controllers/UserController";
import createUserValidator from "../validators/users/create.user.validator";
import getAllUsersValidator from "../validators/users/get.all.users.validator";

const userRouter = Router();

const userRepository = AppDataSource.getRepository(User);

const userService = new UserService(userRepository);
const passwordService = new PasswordService();

const userController = new UserController(userService, passwordService, logger);

userRouter.post(
  "/",
  createUserValidator,
  authenticate,
  canAccess([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.create(req, res, next);
  },
);

userRouter.get(
  "/",
  getAllUsersValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.getAll(req, res, next);
  },
);

export default userRouter;
