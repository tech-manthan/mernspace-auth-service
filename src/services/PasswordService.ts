import bcrypt from "bcrypt";
import { Config } from "../config";

export class PasswordService {
  private readonly salt: number | string;
  constructor() {
    this.salt = parseInt(Config.SALT || "10") || Config.SALT || 10;
  }

  async hash(password: string) {
    return await bcrypt.hash(password, this.salt);
  }

  public static async Hash(password: string) {
    return await bcrypt.hash(
      password,
      parseInt(Config.SALT || "10") || Config.SALT || 10,
    );
  }

  async compare(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}
