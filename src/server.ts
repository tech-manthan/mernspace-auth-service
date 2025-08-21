import app from "./app";
import { Config } from "./config";
import { createAdmin } from "./utils/create.admin";
import { AppDataSource } from "./utils/data-source";
import logger from "./utils/logger";

const startServer = async () => {
  try {
    const PORT = Config.PORT;

    await AppDataSource.initialize();
    logger.info("Database connected successfully");

    await createAdmin({
      email: Config.ADMIN_EMAIL!,
      password: Config.ADMIN_PASSWORD!,
      firstName: Config.ADMIN_FIRSTNAME || "Admin",
      lastName: Config.ADMIN_LASTNAME || "User",
    });

    app.listen(PORT, () => {
      logger.info("Server Listening on port", { port: PORT });
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

void startServer();
