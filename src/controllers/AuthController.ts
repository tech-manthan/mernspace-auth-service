import { Request, Response } from "express";

export class AuthController {
  constructor() {}

  register(req: Request, res: Response) {
    res.status(201).json();
  }
}
