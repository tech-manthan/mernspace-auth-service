import "reflect-metadata";
import { DataSource } from "typeorm";
import { Config } from "../config";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: Config.DB_HOST ?? "localhost",
  port: Number(Config.DB_PORT),
  username: Config.DB_USERNAME ?? "",
  password: Config.DB_PASSWORD ?? "",
  database: Config.DB_NAME ?? "",
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
  extra: {
    sslmode: "require",
    channelBinding: "require",
  },
  synchronize: false,
  logging: false,
  entities: [__dirname + "/../entity/**/*.{ts,js}"],
  migrations: [__dirname + "/../migration/**/*.{ts,js}"],
  subscribers: [],
});
