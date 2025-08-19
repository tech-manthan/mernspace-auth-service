import { Router } from "express";
import authRouter from "./auth.router";
import tenantRouter from "./tenant.router";
import userRouter from "./user.router";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/tenants", tenantRouter);
appRouter.use("/users", userRouter);

export default appRouter;
