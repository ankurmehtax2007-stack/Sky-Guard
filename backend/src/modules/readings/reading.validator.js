import { z } from "zod";

export const sensorReadingSchema = z.object({
    stationId: z.string().min(1, "Station ID is required"),
    timestamp: z.coerce.date(),
    temperature: z.number(),
    humidity: z.number(),
    pressure: z.number()
});

export const paginationSchema = z.object({
    stationId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
});
    