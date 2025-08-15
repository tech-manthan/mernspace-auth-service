import { NextFunction, Response } from "express";
import { CreateTenantRequest } from "../types/tenant.types";
import { TenantService } from "../services/TenantService";
import { Logger } from "winston";
import { validationResult } from "express-validator";

export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger,
  ) {}

  async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { address, name } = req.body;

      const tenant = await this.tenantService.create({
        address,
        name,
      });
      this.logger.info("Tenant Created Successfully", {
        id: tenant.id,
      });
      res.status(201).json({
        id: tenant.id,
      });
    } catch (err) {
      next(err);
      return;
    }
  }
}
