import app from "./app";
import connectDB from "./config/database";

// Initialize database connection
connectDB().catch(console.error);

export default app;
