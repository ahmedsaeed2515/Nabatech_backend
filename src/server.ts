import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/database";

import { env } from "./config/env";
import { startOutboxPolling, stopOutboxPolling } from "./workers/outbox_worker";
import mongoose from "mongoose";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB(); 


    if (env.DEPLOYMENT_MODE === 'single-instance' || env.DEPLOYMENT_MODE === 'multi-instance') {
      // In serverless mode, Vercel cron triggers the endpoint directly
      startOutboxPolling(10000);
      logger.info('Started outbox polling');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received: closing HTTP server`);
      stopOutboxPolling();
      server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close().then(() => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error("Failed to connect to database:", { error });
    process.exit(1);
  }
};

startServer(); // Trigger dev server reload to connect to MongoDB
