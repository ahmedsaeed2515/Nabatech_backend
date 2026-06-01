import express, { Request, Response } from "express";
import testRouter from "./routers/test_routers";
import authRouter from "./routers/auth_router";
import uploadRouter from "./routers/upload_routes";
import chatRoutes from "./routers/chat_routes";
import userRoutes from "./routers/user_router";
import myPlantsRouter from "./routers/my_plants_router";
import remindersRouter from "./routers/reminders_router";
import diaryRouter from "./routers/diary_router";
import communityRouter from "./routers/community_router";
import exploreRouter from "./routers/explore_router";
import diagnosisRouter from "./routers/diagnosis_router";
import historyRouter from "./routers/history_router";
import plantLibraryRouter from "./routers/plant_library_router";
import homeToolsRouter from "./routers/home_tools_router";
import aiModelsRouter from "./routers/ai_models_router";
import aiSettingsRouter from "./routers/ai_settings_router";
import aiAssistantRouter from "./routers/ai_assistant_router";
import { protect } from "./middlewares/auth_middleware";
const app = express();
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

app.use(express.json());


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
app.use("/api/home-tools", homeToolsRouter);
app.use("/api/ai-models", aiModelsRouter);
app.use("/api/admin/ai-settings", aiSettingsRouter);
app.use("/api/ai", aiAssistantRouter);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Express + TypeScript is working" } });
});

app.get("/profile", protect , (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { message: `Hello user with ID: ${(req as any).user.id}` }
  });
});
export default app;



// export const getMessages = async (req: Request, res: Response) => {
//   const userId = (req as any).user.id;

//   const messages = await Message.find({ user: userId })
//     .sort({ createdAt: 1 });

//   res.json(messages);
// };
