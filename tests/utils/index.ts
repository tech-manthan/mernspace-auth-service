import bcrypt from "bcrypt";
import { Config } from "../../src/config";
export const isJwt = (token: string | null): boolean => {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  try {
    parts.forEach((part) => {
      Buffer.from(part, "base64").toString("utf-8");
    });
    return true;
  } catch {
    return false;
  }
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(
    password,
    parseInt(Config.SALT || "10") || Config.SALT || 10,
  );
};
