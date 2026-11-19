import cors from "cors";
import express from "express";
import { loadCurrentUser } from "./middleware/currentUser.ts";
import { errorHandler, notFound } from "./middleware/errors.ts";
import { apiRouter } from "./routes/index.ts";

export const app = express();

app.use(cors()); // dev only; the Vite proxy means the browser normally talks to :5173
app.use(express.json());
app.use(loadCurrentUser);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
