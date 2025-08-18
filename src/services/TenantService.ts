import { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";
import {
  CreateTenantData,
  TenantData,
  TenantFilter,
} from "../types/tenant.types";
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

  async getAll({ currentPage, perPage, q }: TenantFilter) {
    try {
      const queryBuilder = this.tenantRepository.createQueryBuilder("tenant");

      if (q) {
        const searchTerm = `%${q}%`;
        queryBuilder.where(
          "CONCAT(tenant.name, ' ', tenant.address) ILike :q",
          { q: searchTerm },
        );
      }
      const result = await queryBuilder
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .orderBy("tenant.id", "DESC")
        .getManyAndCount();

      return result;
    } catch {
      const err = createHttpError(500, "Failed to get all tenants");
      throw err;
    }
  }

  async get(id: number) {
    try {
      return await this.tenantRepository.findOne({
        where: {
          id: id,
        },
      });
    } catch {
      const err = createHttpError(500, "Failed to fetch tenant");
      throw err;
    }
  }

  async delete(id: number) {
    try {
      return await this.tenantRepository.delete({
        id,
      });
    } catch {
      const err = createHttpError(500, "Failed to delete tenant");
      throw err;
    }
  }

  async update(id: number, { address, name }: TenantData) {
    try {
      const updateData: Partial<TenantData> = {};

      if (address !== "") {
        updateData.address = address;
      }

      if (name !== "") {
        updateData.name = name;
      }

      return await this.tenantRepository.update({ id }, updateData);
    } catch {
      const err = createHttpError(500, "Failed to update tenant");
      throw err;
    }
  }
}
