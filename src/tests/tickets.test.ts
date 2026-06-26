import request from "supertest";
import app from "../app";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";
import { createTestUser, createAdminUser, getAuthToken } from "./helpers/auth.helper";
import Ticket, { TicketStatus } from "../models/ticket_model";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Support Ticketing System Tests", () => {
  it("allows public ticket creation", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        name: "Test Submitter",
        email: "submitter@example.com",
        subject: "Help needed",
        message: "This is a test message from a user"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.name).toBe("Test Submitter");
    expect(res.body.data.ticket.status).toBe(TicketStatus.NEW);
  });

  it("associates ticket with user when authenticated", async () => {
    const { user, email, password } = await createTestUser();
    const token = await getAuthToken(email, password);

    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Logged In User",
        email: email,
        subject: "Help needed with account",
        message: "User ticket description"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Check ticket in DB has user field set
    const ticket = await Ticket.findOne({ email });
    expect(ticket).toBeDefined();
    expect(ticket?.user?.toString()).toBe(user._id.toString());
  });

  it("restricts user ticket retrieval to own tickets", async () => {
    const userA = await createTestUser();
    const tokenA = await getAuthToken(userA.email, userA.password);

    const userB = await createTestUser();
    const tokenB = await getAuthToken(userB.email, userB.password);

    // Create ticket for User A
    await Ticket.create({
      user: userA.user._id,
      name: userA.user.name,
      email: userA.email,
      subject: "User A ticket",
      message: "Help User A"
    });

    // A can see it
    const resA = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(resA.status).toBe(200);
    expect(resA.body.data.tickets.length).toBe(1);

    // B cannot see it
    const resB = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(resB.status).toBe(200);
    expect(resB.body.data.tickets.length).toBe(0);
  });

  it("allows admins to fetch list, stats, update status and assign agents", async () => {
    const admin = await createAdminUser();
    const adminToken = await getAuthToken(admin.email, admin.password);

    const ticket = await Ticket.create({
      name: "Customer",
      email: "customer@example.com",
      subject: "Technical issue",
      message: "Trouble compiling code"
    });

    // Get stats
    const statsRes = await request(app)
      .get("/api/admin/tickets/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.totalTickets).toBe(1);

    // Update status
    const statusRes = await request(app)
      .patch(`/api/admin/tickets/${ticket._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: TicketStatus.PENDING });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe(TicketStatus.PENDING);

    // Assign agent
    const assignRes = await request(app)
      .patch(`/api/admin/tickets/${ticket._id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedTo: admin.user._id });
    expect(assignRes.status).toBe(200);
  });
});


