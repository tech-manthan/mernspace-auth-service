import { config } from "dotenv";
import path from "node:path";

config({
  path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "dev"}`),
});

const {
  PORT,
  NODE_ENV,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  SALT,
  REFRESH_TOKEN_SECRET,
  JWKS_URI,
  PRIVATE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_FIRSTNAME,
  ADMIN_LASTNAME,
  MERNSPACE_DASHBOARD_URI,
  MERNSPACE_CLIENT_URI,
} = process.env;

export const Config = {
  PORT: PORT || 5001,
  NODE_ENV,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  SALT,
  REFRESH_TOKEN_SECRET,
  JWKS_URI,
  PRIVATE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_FIRSTNAME,
  ADMIN_LASTNAME,
  MERNSPACE_DASHBOARD_URI,
  MERNSPACE_CLIENT_URI,
} as const;
