import express from "express";
import { globalErrorHandler } from "./middleware/global.error.handler";
import appRouter from "./router";

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Backend Service Template");
});

app.use(appRouter);

app.use(globalErrorHandler());

export default app;
