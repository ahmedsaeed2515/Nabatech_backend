import { Router } from "express";
import {
  getAdminTickets,
  getAdminTicketById,
  updateTicketStatus,
  assignTicket,
  replyToTicket,
  getAdminTicketsStats
} from "../controllers/admin_tickets_controller";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";

const router = Router();
const adminOrMod = authorizeRoles('moderator', 'admin', 'super_admin');

// All admin ticket routes are protected and restricted to staff roles
router.use(protect, adminOrMod);

router.get("/", getAdminTickets);
router.get("/stats", getAdminTicketsStats);
router.get("/:id", getAdminTicketById);
router.post("/:id/reply", replyToTicket);
router.patch("/:id/status", updateTicketStatus);
router.patch("/:id/assign", assignTicket);

export default router;


