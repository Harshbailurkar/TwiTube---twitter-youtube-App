import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// for middleware use
// app.use(cors());
app.use(
  cors({
    //  origin: "http://localhost:3000",
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // for asssest like image,css,js
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";

//Routes declaration
app.use("/api/v1/users", userRouter);

// http://localhost:8000/api/v1/users/register
export { app };
