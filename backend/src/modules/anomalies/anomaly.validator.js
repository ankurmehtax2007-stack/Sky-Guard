export const anomalyStatusSchema = z.object({
    status: z.enum(["acknowledged", "resolved"])
});