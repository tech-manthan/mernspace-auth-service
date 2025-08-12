import { Repository } from "typeorm";
import { User } from "../entity/User";
import { CreateUserData } from "../types/user.types";
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
}
