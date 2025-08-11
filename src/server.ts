import app from "./app";
import { Config } from "./config";

const startServer = () => {
  try {
    const PORT = Config.PORT;

    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
};

startServer();
