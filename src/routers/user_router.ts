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
import { protect, admin, authorizeRoles } from "../middlewares/auth_middleware";
import { validateRequest } from "../middlewares/validate_request_middleware";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  updateFcmTokenSchema
} from "../validation/user_schemas";

const router = Router();

router.get("/", protect, admin, getAllUsers);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, validateRequest(updateProfileSchema), updateProfile);
router.put("/change-password", protect, validateRequest(changePasswordSchema), changePassword);
router.put("/fcm-token", protect, validateRequest(updateFcmTokenSchema), updateFcmToken);

// Admin/Moderator dashboard endpoints
router.get("/dashboard-stats", protect, authorizeRoles('moderator', 'admin', 'super_admin'), getDashboardStats);
router.get("/:id/details", protect, authorizeRoles('moderator', 'admin', 'super_admin'), getUserDetails);

// Super Admin / Admin endpoints
router.put("/:id/role", protect, authorizeRoles('admin', 'super_admin'), validateRequest(updateUserRoleSchema), updateUserRole);
router.delete("/:id", protect, authorizeRoles('admin', 'super_admin'), deleteUser);

export default router;


