import express, { Request, Response } from "express";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { protect } from "./middlewares/auth_middleware";
import { requestContextMiddleware } from "./middlewares/request_context_middleware";
import { errorHandler } from "./middlewares/error_middleware";
import { env } from "./config/env";
import aiAssistantRouter from "./routers/ai_assistant_router";
import aiModelsRouter from "./routers/ai_models_router";
import aiSettingsRouter from "./routers/ai_settings_router";
import authRouter from "./routers/auth_router";
import chatRoutes from "./routers/chat_routes";
import communityRouter from "./routers/community_router";
import diagnosisRouter from "./routers/diagnosis_router";
import diaryRouter from "./routers/diary_router";
import exploreRouter from "./routers/explore_router";
import historyRouter from "./routers/history_router";
import homeToolsRouter from "./routers/home_tools_router";
import myPlantsRouter from "./routers/my_plants_router";
import plantLibraryRouter from "./routers/plant_library_router";
import remindersRouter from "./routers/reminders_router";
import adminRemindersRouter from "./routers/admin_reminders_router";
import adminDiagnosisRouter from "./routers/admin_diagnosis_router";
// import testRouter from "./routers/test_routers";
import uploadRouter from "./routers/upload_routes";
import userRoutes from "./routers/user_router";
import internalJobsRouter from "./routers/internal_jobs_router";
import adminUsersRouter from "./routers/admin_users_router";
import adminPlantLibraryRouter from "./routers/admin_plant_library_router";
import adminSpecialistOffersRouter from "./routers/admin_specialist_offers_router";
import adminCommunityRouter from "./routers/admin_community_router";
import adminHomeToolsRouter from "./routers/admin_home_tools_router";
import adminMyPlantsRouter from "./routers/admin_my_plants_router";
import adminUserPlantsRouter from "./routers/admin_user_plants_router";
import adminGardensRouter from "./routers/admin_gardens_router";
import adminNotificationsRouter from "./routers/admin_notifications_router";
import articleRouter from "./routers/article_router";
import adminArticleRouter from "./routers/admin_article_router";
import expertRouter from "./routers/expert_router";
import adminTicketsRouter from "./routers/admin_tickets_router";
import userTicketsRouter from "./routers/user_tickets_router";
import v2Router from "./routers/v2";
import notificationRouter from "./routers/notification_router";
import adminAiControlRouter from "./routers/admin_ai_control_router";
import adminAiOsRouter from "./routers/admin_ai_os_router";
import adminHomeExperienceRouter from "./routers/admin_home_experience_router";
import adminChatLogsRouter from "./routes/admin_chat_logs_router";
import adminAiProvidersRouter from "./routers/admin_ai_providers_router";
import expertChatRoutes from "./routers/expert_chat_routes";
import storeRouter from "./routers/store_router";
import adminStoreRouter from "./routers/admin_store_router";
import adminDatabaseRouter from "./routers/admin_database_router";
import adminCloudinaryRouter from "./routers/admin_cloudinary_router";
const app = express();

// CORS Middleware - Strict allowed origins
app.use((req, res, next) => {
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : ['*'];
  const origin = req.headers.origin;
  
  const isLocalhost = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') || 
    origin === 'http://localhost' || 
    origin === 'http://127.0.0.1' ||
    origin.startsWith('https://localhost:') ||
    origin.startsWith('https://127.0.0.1:')
  );
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin)) || isLocalhost) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Accept, X-CSRF-Token, Idempotency-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json());
app.use(helmet());
// Sanitize data against NoSQL query injection
// In Express 5, req.query is a getter, so express-mongo-sanitize crashes if used as a generic middleware.
// We manually sanitize the objects in-place.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});
app.use(requestContextMiddleware);

// Health Checks
app.get("/health/live", (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: 'live' } });
});

app.get("/health/debug", (req: Request, res: Response) => {
  // Only expose diagnostic info in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false });
  }
  res.status(200).json({
    success: true,
    data: {
      hasMongo: !!(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
      hasTokenHash: !!process.env.TOKEN_HASH_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.get("/health/ready", async (req: Request, res: Response) => {
  try {
    // Basic dependency check stub
    // Wait for models to be created later for full checks
    res.status(200).json({ 
      success: true, 
      data: { mongo: 'ok', outbox: 'ok', rateLimitStore: 'ok' } 
    });
  } catch (error) {
    res.status(503).json({ success: false, error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Service not ready' } });
  }
});

// app.use("/api/test", testRouter);
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-plants", myPlantsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/diary", diaryRouter);
app.use("/api/community", communityRouter);
app.use("/api/explore", exploreRouter);
app.use("/api/diagnosis", diagnosisRouter);
app.use("/api/history", historyRouter);
app.use("/api/plant-library", plantLibraryRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/plant-library", adminPlantLibraryRouter);
app.use("/api/home-tools", homeToolsRouter);
app.use("/api/ai-models", aiModelsRouter);
app.use("/api/admin/ai-settings", aiSettingsRouter);
app.use("/api/admin/reminders", adminRemindersRouter);
app.use("/api/admin/diagnoses", adminDiagnosisRouter);
app.use("/api/admin/specialist-offers", adminSpecialistOffersRouter);
app.use("/api/admin/community", adminCommunityRouter);
app.use("/api/admin/home-tools", adminHomeToolsRouter);
app.use("/api/admin/my-plants", adminMyPlantsRouter);
app.use("/api/admin/user-plants", adminUserPlantsRouter);
app.use("/api/admin/gardens", adminGardensRouter);
app.use("/api/admin/notifications", adminNotificationsRouter);
app.use("/api/ai", aiAssistantRouter);
app.use("/api/articles", articleRouter);
app.use("/api/admin/articles", adminArticleRouter);
app.use("/api/experts", expertRouter);
app.use("/api/experts/chat", expertChatRoutes);
app.use("/api/internal/jobs", internalJobsRouter);
app.use("/api/admin/tickets", adminTicketsRouter);
app.use("/api/tickets", userTicketsRouter);
app.use("/api/v1", v2Router);
app.use("/api/notifications", notificationRouter);
app.use("/api/admin/ai", adminAiControlRouter);
app.use("/api/admin/ai-os", adminAiOsRouter);
app.use("/api/admin/home", adminHomeExperienceRouter);
app.use("/api/admin/chat-logs", adminChatLogsRouter);
app.use("/api/admin/ai-providers", adminAiProvidersRouter);
app.use("/api/store", storeRouter);
app.use("/api/admin/store", adminStoreRouter);
app.use("/api/admin/database", adminDatabaseRouter);
app.use("/api/admin/cloudinary", adminCloudinaryRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Express + TypeScript is working" } });
});

app.get("/profile", protect , (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { message: `Hello user with ID: ${(req as any).user.id}` }
  });
});

app.use(errorHandler);

export default app;



// export const getMessages = async (req: Request, res: Response) => {
//   const userId = (req as any).user.id;

//   const messages = await Message.find({ user: userId })
//     .sort({ createdAt: 1 });

//   res.json(messages);
// };
