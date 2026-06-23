import { Router } from "express";
import { protect, admin, authorizeRoles } from "../middlewares/auth_middleware";
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  updateUserStatus, 
  softDeleteUser, 
  restoreUser, 
  bulkAction 
} from "../controllers/admin_users_controller";

const router = Router();

// Protect all routes and ensure at least 'admin' or 'super_admin' access
router.use(protect);
router.use(authorizeRoles('admin', 'super_admin'));

// Route: /api/admin/users
router.route('/')
  .get(getUsers);

// Route: /api/admin/users/bulk-action
router.post('/bulk-action', bulkAction);

// Route: /api/admin/users/:id/role
router.patch('/:id/role', updateUserRole);

// Route: /api/admin/users/:id/status
router.patch('/:id/status', updateUserStatus);

// Route: /api/admin/users/:id/restore
router.post('/:id/restore', restoreUser);

// Route: /api/admin/users/:id
router.route('/:id')
  .get(getUserById)
  .delete(softDeleteUser);

export default router;
