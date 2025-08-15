import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user.types";
import { AuthRequest } from "../types/auth.types";
import createHttpError from "http-errors";
import logger from "../utils/logger";

export default function canAccess(roles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const { role } = (req as AuthRequest).auth;

    if (!roles.includes(role)) {
      logger.error("Unauthorized resource");
      const err = createHttpError(403, "Unauthorized Access");
      next(err);
      return;
    } else {
      next();
      return;
    }
  };
}
