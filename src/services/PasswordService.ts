import bcrypt from "bcrypt";
import { Config } from "../config";

export class PasswordService {
  private salt: number | string;
  constructor() {
    this.salt = parseInt(Config.SALT || "10") || Config.SALT || 10;
  }

  async hash(password: string) {
    return await bcrypt.hash(password, this.salt);
  }

  async compare(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}
