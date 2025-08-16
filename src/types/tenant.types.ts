import { Request } from "express";

export interface CreateTenantData {
  name: string;
  address: string;
}

export interface CreateTenantRequest extends Request {
  body: CreateTenantData;
}

export interface TenantFilter {
  q: string;
  currentPage: number;
  perPage: number;
}
