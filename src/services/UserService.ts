import { Brackets, Repository } from "typeorm";
import { User } from "../entity/User";
import {
  CreateUserData,
  FindUserByEmail,
  FindUserById,
  UpdateUserData,
  UserData,
  UserFilter,
  UserRole,
} from "../types/user.types";
import createHttpError from "http-errors";

export class UserService {
  constructor(private readonly userRepository: Repository<User>) {}

  async create({
    email,
    firstName,
    lastName,
    password,
    role,
    tenantId,
    isBanned,
  }: CreateUserData) {
    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
        role,
        ...(tenantId !== undefined && !isNaN(tenantId)
          ? { tenant: { id: tenantId } }
          : { tenant: null }),

        ...(isBanned !== undefined && { isBanned: isBanned }),
      });
    } catch {
      const error = createHttpError(
        500,
        "Failed to store the data in the database",
      );
      throw error;
    }
  }

  async findUserByEmail({ email, hasPassword = false }: FindUserByEmail) {
    try {
      return await this.userRepository.findOne({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenant: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          password: hasPassword,
        },
      });
    } catch {
      const error = createHttpError(
        500,
        "Failed to fetch user from the database",
      );
      throw error;
    }
  }

  async findUserById({ id, hasPassword = false }: FindUserById) {
    try {
      return await this.userRepository.findOne({
        where: {
          id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenant: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          password: hasPassword,
        },
        relations: ["tenant"],
      });
    } catch {
      const error = createHttpError(
        500,
        "Failed to fetch user from the database",
      );
      throw error;
    }
  }

  async getAll({ currentPage, perPage, q, role, isBanned }: UserFilter) {
    try {
      const queryBuilder = this.userRepository.createQueryBuilder("user");

      if (q) {
        const searchTerm = `%${q}%`;
        queryBuilder.where(
          new Brackets((qb) => {
            qb.where("CONCAT(user.firstName, ' ', user.lastName) ILike :q", {
              q: searchTerm,
            }).orWhere("user.email ILike :q", { q: searchTerm });
          }),
        );
      }

      if (role) {
        queryBuilder.andWhere("user.role = :role", {
          role: role,
        });
      }

      if (isBanned === true || isBanned === false) {
        queryBuilder.andWhere("user.isBanned = :isBanned", {
          isBanned: isBanned,
        });
      }

      const result = await queryBuilder
        .leftJoinAndSelect("user.tenant", "tenant")
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .orderBy("user.id", "DESC")
        .getManyAndCount();
      return result;
    } catch {
      const err = createHttpError(500, "Failed to get all users");
      throw err;
    }
  }

  async delete(id: number) {
    try {
      return await this.userRepository.delete({
        id,
      });
    } catch {
      const err = createHttpError(500, "Failed to delete user");
      throw err;
    }
  }

  async update(
    id: number,
    {
      email,
      firstName,
      lastName,
      role,
      tenantId,
      isBanned,
      password,
    }: UpdateUserData,
  ) {
    try {
      const updateData: Partial<UserData> = {};

      if (firstName) {
        updateData.firstName = firstName;
      }

      if (lastName) {
        updateData.lastName = lastName;
      }

      if (email) {
        updateData.email = email;
      }

      if (password) {
        updateData.password = password;
      }

      if (role) {
        updateData.role = role;
      }

      if (role === UserRole.MANAGER) {
        updateData.tenant = {
          id: tenantId!,
        };
      } else {
        updateData.tenant = null;
      }

      if (isBanned !== undefined) {
        updateData.isBanned = isBanned;
      }

      return await this.userRepository.update({ id }, { ...updateData });
    } catch {
      const err = createHttpError(500, "Failed to update tenant");
      throw err;
    }
  }
}
