import { Router } from "express";
import { getHealth } from "./health.controller.js";

const healthRoutes = Router();

healthRoutes.get("/", getHealth);

export default healthRoutes;