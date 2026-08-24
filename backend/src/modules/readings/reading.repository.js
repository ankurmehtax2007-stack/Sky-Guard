import { SensorReading } from "./reading.model.js";

export const saveReading = async (reading) => {
    try {
        const sensorReading = new SensorReading(reading);
        await sensorReading.save();
        return sensorReading;
    } catch (error) {
        console.error("Error saving reading:", error.message);
        throw error;
    }
};

export const findLatestReadings = async () => {
    try {
        const readings = await SensorReading.aggregate([
            {
                $sort: {
                    timestamp: -1
                }
            },
            {
                $group: {
                    _id: "$stationId",
                    latestReading: {
                        $first: "$$ROOT"
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$latestReading"
                }
            }
        ]);
        return readings;
    } catch (error) {
        console.error("Error fetching latest readings:", error.message);
        throw error;
    }
};

const buildReadingFilter = (stationId, options) => {
    const filter = stationId
        ? { stationId }
        : {};

    if (options.from || options.to) {
        filter.timestamp = {};

        if (options.from) {
            filter.timestamp.$gte = options.from;
        }

        if (options.to) {
            filter.timestamp.$lte = options.to;
        }
    }

    return filter;
};

export const findReadingsByStation = async (stationId, options) => {
    try {
        const filter = buildReadingFilter(stationId, options);
        const readings = await SensorReading.find(filter)
            .sort({
                timestamp: -1
            }).skip(options.skip).limit(options.limit);
        return readings;
    } catch (error) {
        console.error("Error fetching readings by station: repository", error.message);
        throw error;
    }
};

export const countReadingsByStation = async (stationId , options) => {
    try {
        const query = buildReadingFilter(stationId , options);

        const count = await SensorReading.countDocuments(query);
        return count;
    } catch (error) {
        console.error("Error counting readings: repository", error.message);
        throw error;
    }
}

export const findPendingReadings = async () => {
    try {
        const readings = await SensorReading.find({ mlStatus: "pending" }).limit(100);
        return readings;
    } catch (error) {
        console.error("Error finding pending readings: repository", error.message);
        throw error;
    }
}

export const updateReading = async (id, updates) => {
    try {
        const reading = await SensorReading.findByIdAndUpdate(id, updates, { returnDocument: "after" });
        return reading;
    } catch (error) {
        console.error("Error updating reading: repository", error.message);
        throw error;
    }
}