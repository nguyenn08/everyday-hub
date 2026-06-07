import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import bookingsRouter from "./bookings";
import profileRouter from "./profile";
import calendarRouter from "./calendar";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(bookingsRouter);
router.use(profileRouter);
router.use(calendarRouter);
router.use(statsRouter);

export default router;
