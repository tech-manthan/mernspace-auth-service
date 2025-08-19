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
import idValidator from "../validators/common/id.validator";
import updateUserValidator from "../validators/users/update.user.validator";

const userRouter = Router();

const userRepository = AppDataSource.getRepository(User);

const userService = new UserService(userRepository);
const passwordService = new PasswordService();

const userController = new UserController(userService, passwordService, logger);

userRouter.post(
  "/",
  authenticate,
  canAccess([UserRole.ADMIN]),
  createUserValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.create(req, res, next);
  },
);

userRouter.get(
  "/",
  authenticate,
  canAccess([UserRole.ADMIN]),
  getAllUsersValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.getAll(req, res, next);
  },
);

userRouter.get(
  "/:id",
  authenticate,
  canAccess([UserRole.ADMIN]),
  idValidator("User"),
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.get(req, res, next);
  },
);

userRouter.delete(
  "/:id",
  authenticate,
  canAccess([UserRole.ADMIN]),
  idValidator("Tenant"),
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.delete(req, res, next);
  },
);

userRouter.patch(
  "/:id",
  authenticate,
  canAccess([UserRole.ADMIN]),
  idValidator("User"),
  updateUserValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await userController.update(req, res, next);
  },
);

export default userRouter;
