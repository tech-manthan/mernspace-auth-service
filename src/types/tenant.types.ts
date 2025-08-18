import { Request } from "express";

export interface CreateTenantData {
  name: string;
  address: string;
}

export interface UpdateTenantData {
  name?: string;
  address?: string;
}

export interface TenantData {
  name: string;
  address: string;
}

export interface CreateTenantRequest extends Request {
  body: CreateTenantData;
}

export interface UpdateTenantRequest extends Request {
  body: UpdateTenantData;
}

export interface TenantFilter {
  q: string;
  currentPage: number;
  perPage: number;
}
