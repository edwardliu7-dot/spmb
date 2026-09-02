import { Router, type IRouter } from "express";
import healthRouter from "./health";
import submitRouter from "./submit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(submitRouter);

export default router;
