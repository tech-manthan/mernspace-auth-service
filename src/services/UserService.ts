import { Repository } from "typeorm";
import { User } from "../entity/User";
import {
  CreateUserData,
  FindUserByEmail,
  FindUserById,
} from "../types/user.types";
import createHttpError from "http-errors";

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ email, firstName, lastName, password, role }: CreateUserData) {
    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
        role,
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
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
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
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
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
}
