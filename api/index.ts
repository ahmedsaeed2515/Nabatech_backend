import app from '../src/app';
import connectDB from '../src/config/database';

// Initialize MongoDB connection
// Mongoose buffers operations until the connection is established.
connectDB();

export default app;
