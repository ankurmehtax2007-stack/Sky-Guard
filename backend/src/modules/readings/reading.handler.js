import{ sensorReadingSchema} from "./reading.validator.js";
import {processReading} from "./reading.service.js";

const handleReading = (data) => {

    const result = sensorReadingSchema.safeParse(data);

    if (!result.success) {

        console.error("ZOD ERROR:", result.error.issues);

        console.log("RECEIVED DATA:", data);

        return;
    }

    processReading(result.data);
};

export default handleReading;