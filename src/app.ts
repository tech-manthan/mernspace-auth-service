import express from "express";
import cookieParser from "cookie-parser";
import "reflect-metadata";
import cors from "cors";

import { globalErrorHandler } from "./middleware/global.error.handler";
import appRouter from "./router";
import { Config } from "./config";

const app = express();

app.use(
  cors({
    origin: [Config.MERNSPACE_DASHBOARD_URI!],
    credentials: true,
  }),
);
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
