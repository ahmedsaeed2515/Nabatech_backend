import express, { Request, Response } from "express";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
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
import testRouter from "./routers/test_routers";
import uploadRouter from "./routers/upload_routes";
import userRoutes from "./routers/user_router";
import internalJobsRouter from "./routers/internal_jobs_router";
import adminPlantLibraryRouter from "./routers/admin_plant_library_router";
import adminSpecialistOffersRouter from "./routers/admin_specialist_offers_router";
import adminCommunityRouter from "./routers/admin_community_router";
import adminHomeToolsRouter from "./routers/admin_home_tools_router";
const app = express();

// CORS Middleware - Strict allowed origins
app.use((req, res, next) => {
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : ['*'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(requestContextMiddleware);

// Health Checks
app.get("/health/live", (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: 'live' } });
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

app.use("/api/test", testRouter);
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
app.use("/api/admin/plant-library", adminPlantLibraryRouter);
app.use("/api/home-tools", homeToolsRouter);
app.use("/api/ai-models", aiModelsRouter);
app.use("/api/admin/ai-settings", aiSettingsRouter);
app.use("/api/admin/reminders", adminRemindersRouter);
app.use("/api/admin/diagnoses", adminDiagnosisRouter);
app.use("/api/admin/specialist-offers", adminSpecialistOffersRouter);
app.use("/api/admin/community", adminCommunityRouter);
app.use("/api/admin/home-tools", adminHomeToolsRouter);
app.use("/api/ai", aiAssistantRouter);
app.use("/api/internal/jobs", internalJobsRouter);

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
