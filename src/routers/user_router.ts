import { Router } from "express";
import { 
  getAllUsers, 
  getCurrentUser, 
  updateProfile, 
  changePassword,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getUserDetails,
  updateFcmToken
} from "../controllers/user_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, admin, getAllUsers);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/fcm-token", protect, updateFcmToken);

// Admin-only dashboard endpoints
router.get("/dashboard-stats", protect, admin, getDashboardStats);
router.get("/:id/details", protect, admin, getUserDetails);
router.put("/:id/role", protect, admin, updateUserRole);
router.delete("/:id", protect, admin, deleteUser);

export default router;