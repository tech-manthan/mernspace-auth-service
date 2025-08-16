import { NextFunction, Request, Response } from "express";
import { CreateTenantRequest, TenantFilter } from "../types/tenant.types";
import { TenantService } from "../services/TenantService";
import { Logger } from "winston";
import { matchedData, validationResult } from "express-validator";
import { IdParams } from "../types/common.types";
import createHttpError from "http-errors";

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

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const filter = matchedData<TenantFilter>(req, {
        onlyValidData: true,
      });

      const [tenants, count] = await this.tenantService.getAll(filter);
      this.logger.info("All Tenants have been fetched");

      res.status(200).json({
        currentPage: filter.currentPage,
        perPage: filter.perPage,
        total: count,
        data: tenants,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
        });
        return;
      }

      const { id } = matchedData<IdParams>(req, {
        onlyValidData: true,
      });

      const tenant = await this.tenantService.get(id);

      if (!tenant) {
        const err = createHttpError(404, "Tenant not found");
        next(err);
        return;
      }

      this.logger.info("Tenant have been fetched");

      res.status(200).json(tenant);
    } catch (err) {
      next(err);
      return;
    }
  }
}
