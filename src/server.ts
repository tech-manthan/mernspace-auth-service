import app from "./app";
import { Config } from "./config";
import { AppDataSource } from "./utils/data-source";
import logger from "./utils/logger";

const startServer = async () => {
  try {
    const PORT = Config.PORT;

    await AppDataSource.initialize();
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      // console.log(`Listening on port ${PORT}`);
      logger.info("Server Listening on port", { port: PORT });
    });
  } catch (err) {
    // console.error(err);
    logger.error(err);
    process.exit(1);
  }
};

void startServer();
