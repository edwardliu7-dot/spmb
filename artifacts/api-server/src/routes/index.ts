import { Router, type IRouter } from "express";
import healthRouter from "./health";
import submitRouter from "./submit";
import applicationsRouter from "./applications";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(submitRouter);
router.use(authRouter);
router.use(applicationsRouter);

export default router;
