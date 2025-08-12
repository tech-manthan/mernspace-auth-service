import { Request } from "express";
import { UserData } from "./user.types";

export interface RegisterUserRequest extends Request {
  body: UserData;
}
