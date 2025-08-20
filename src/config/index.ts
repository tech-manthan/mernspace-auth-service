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
} = process.env;

export const Config = {
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
} as const;
