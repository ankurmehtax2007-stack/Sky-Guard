import { z } from "zod";

export const anomalyPaginationSchema = z.object({
    stationId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    sensor: z.enum(["temperature", "humidity", "pressure"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["pending", "acknowledged", "resolved"]).optional()
});

export const anomalyStatusSchema = z.object({
    status: z.enum(["pending", "acknowledged", "resolved"]),
    resolvedBy: z.string().optional()
});