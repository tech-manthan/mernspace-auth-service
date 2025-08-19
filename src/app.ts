import express from "express";
import cookieParser from "cookie-parser";
import "reflect-metadata";

import { globalErrorHandler } from "./middleware/global.error.handler";
import appRouter from "./router";

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  express.static("public", {
    dotfiles: "allow",
  }),
);

app.get("/", (req, res) => {
  res.send("Welcome to Auth Service");
});

app.use(appRouter);

app.use(globalErrorHandler());

export default app;
