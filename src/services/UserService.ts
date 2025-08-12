import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types/user.types";

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ email, firstName, lastName, password }: UserData) {
    return await this.userRepository.save({
      firstName,
      lastName,
      email,
      password,
    });
  }
}
