import winston from "winston";
import { Config } from "../config";

const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    serviceName: "Service Template",
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      level: "info",
      silent: Config.NODE_ENV === "test",
    }),
    new winston.transports.File({
      dirname: "logs",
      filename: "error.log",
      level: "error",
      silent: Config.NODE_ENV === "test",
    }),
    new winston.transports.File({
      dirname: "logs",
      filename: "combined.log",
      silent: Config.NODE_ENV === "test",
    }),
  ],
});

export default logger;
