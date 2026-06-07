import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import bookingsRouter from "./bookings";
import profileRouter from "./profile";
import calendarRouter from "./calendar";
import statsRouter from "./stats";
import commentsRouter from "./comments";
import savedPlacesRouter from "./saved-places";
import reviewsRouter from "./reviews";
import paymentMethodsRouter from "./payment-methods";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(reviewsRouter);
router.use(bookingsRouter);
router.use(profileRouter);
router.use(calendarRouter);
router.use(statsRouter);
router.use(savedPlacesRouter);
router.use(paymentMethodsRouter);

export default router;
