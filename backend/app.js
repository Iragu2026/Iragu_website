import express from "express";
const app = express();
import product from "./routes/productRoutes.js";
import errorHandleMiddleware from "./middleware/error.js";
import user from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import order from "./routes/orderRoutes.js";
// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);


// Error Handling Middleware
app.use(errorHandleMiddleware);

export default app;