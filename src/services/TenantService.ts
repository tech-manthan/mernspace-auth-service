import { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";
import { CreateTenantData } from "../types/tenant.types";
import createHttpError from "http-errors";

export class TenantService {
  constructor(private tenantRepository: Repository<Tenant>) {}

  async create({ address, name }: CreateTenantData) {
    try {
      return await this.tenantRepository.save({
        address,
        name,
      });
    } catch {
      const err = createHttpError(500, "Failed to create tenant");
      throw err;
    }
  }
}
