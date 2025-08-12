import { Response } from "express";
import { RegisterUserRequest } from "../types/auth.types";

import { UserService } from "../services/UserService";
import { Logger } from "winston";

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(req: RegisterUserRequest, res: Response) {
    const { firstName, lastName, email, password } = req.body;

    await this.userService.create({
      firstName,
      lastName,
      email,
      password,
    });
    res.status(201).json();
  }
}
