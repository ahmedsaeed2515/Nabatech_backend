import {Router} from "express";
import {echoBodey, getById, hello} from "../controllers/test_controller";

const router = Router();

router.get("/hello", hello);
router.post("/echo", echoBodey);
router.get("/get/:id", getById);

export default router;
