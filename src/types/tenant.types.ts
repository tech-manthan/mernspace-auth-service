import { Request } from "express";

export interface CreateTenantData {
  name: string;
  address: string;
}

export interface CreateTenantRequest extends Request {
  body: CreateTenantData;
}
