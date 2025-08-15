import { NextFunction, Request, Response, Router } from "express";
import createTenantValidator from "../validators/tenants/create.tenant.validator";
import { AppDataSource } from "../utils/data-source";
import { Tenant } from "../entity/Tenant";
import { TenantService } from "../services/TenantService";
import { TenantController } from "../controllers/TenantController";
import logger from "../utils/logger";
import authenticate from "../middleware/authenticate";
import canAccess from "../middleware/can.access";
import { UserRole } from "../types/user.types";

const tenantRouter = Router();

const tenantRepository = AppDataSource.getRepository(Tenant);

const tenantService = new TenantService(tenantRepository);

const tenantController = new TenantController(tenantService, logger);

tenantRouter.post(
  "/",
  createTenantValidator,
  authenticate,
  canAccess([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    await tenantController.create(req, res, next);
  },
);

export default tenantRouter;
