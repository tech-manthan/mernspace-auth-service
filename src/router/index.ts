import { Router } from "express";
import authRouter from "./auth.router";
import tenantRouter from "./tenant.router";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/tenants", tenantRouter);

export default appRouter;
