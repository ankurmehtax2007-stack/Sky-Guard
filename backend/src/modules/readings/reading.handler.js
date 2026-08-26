import { sensorReadingSchema } from "./reading.validator.js";
import { processReading } from "./reading.service.js";
import logger from "../../utils/logger.js";
import { readingsReceived } from "../../utils/metrics.js";

const handleReading = async (data) => {

    const result = sensorReadingSchema.safeParse(data);

    if (!result.success) {

        logger.error(
            {
                readingId: data.readingId,
                stationId: data.stationId,
                issues: result.error.issues
            },
            "Invalid sensor reading"
        );

        logger.debug({ data }, "Received invalid sensor data");

        return;
    }
    readingsReceived.inc();
    await processReading(result.data);
};

export default handleReading;