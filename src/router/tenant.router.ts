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
import getAllTenantValidator from "../validators/tenants/get.all.tenant.validator";
import idValidator from "../validators/common/id.validator";

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

tenantRouter.get(
  "/",
  getAllTenantValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    await tenantController.getAll(req, res, next);
  },
);

tenantRouter.get(
  "/:id",
  idValidator("Tenant"),
  async (req: Request, res: Response, next: NextFunction) => {
    await tenantController.get(req, res, next);
  },
);

tenantRouter.delete(
  "/:id",
  authenticate,
  canAccess([UserRole.ADMIN]),
  idValidator("Tenant"),
  async (req: Request, res: Response, next: NextFunction) => {
    await tenantController.delete(req, res, next);
  },
);

export default tenantRouter;
