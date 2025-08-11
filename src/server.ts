import app from "./app";
import { Config } from "./config";
import logger from "./utils/logger";

const startServer = () => {
  try {
    const PORT = Config.PORT;

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

startServer();
