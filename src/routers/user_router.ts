import { Router } from "express";
import { 
  getAllUsers, 
  getCurrentUser, 
  updateProfile, 
  changePassword,
  updateUserRole,
  deleteUser,
  getDashboardStats
} from "../controllers/user_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, admin, getAllUsers);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin-only dashboard endpoints
router.get("/dashboard-stats", protect, admin, getDashboardStats);
router.put("/:id/role", protect, admin, updateUserRole);
router.delete("/:id", protect, admin, deleteUser);

export default router;