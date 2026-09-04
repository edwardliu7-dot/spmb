import { Router, type IRouter } from "express";
import healthRouter from "./health";
import submitRouter from "./submit";
import applicationsRouter from "./applications";
import authRouter from "./auth";
import paymentVerificationRouter from "./payment-verification";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(submitRouter);
router.use(authRouter);
router.use(paymentVerificationRouter);
router.use(applicationsRouter);
router.use(adminRouter);

export default router;
