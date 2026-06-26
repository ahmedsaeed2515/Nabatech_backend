import { Router } from "express";
import { getDiaryEntries, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from "../controllers/diary_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, getDiaryEntries);
router.post("/", protect, createDiaryEntry);
router.put("/:id", protect, updateDiaryEntry);
router.delete("/:id", protect, deleteDiaryEntry);

export default router;


