import { Request, Response } from 'express';
import connectDB from './config/database';

let appInstance: any = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appInstance) {
      console.log("Initializing serverless app...");
      // Initialize database connection
      await connectDB();
      // Lazy load the app to catch any top-level module errors
      const appModule = require('./app');
      appInstance = appModule.default || appModule;
      console.log("App loaded successfully");
    }
    
    // Pass the request to the Express app
    return appInstance(req, res);
  } catch (error: any) {
    console.error("FATAL SERVERLESS INITIALIZATION ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Server Initialization Failed",
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
}

module.exports = handler;


