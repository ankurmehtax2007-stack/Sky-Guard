const frozenStations = new Map();

export const injectAnomaly = (reading) => {
    const frozen = frozenStations.get(reading.stationId);

    if (frozen) {
        reading[frozen.sensor] = frozen.value;
        frozen.remaining--;

        if (frozen.remaining <= 0) {
            frozenStations.delete(reading.stationId);
        }
        return reading;
    }
    const shouldInject = Math.random() < 0.05;

    if (!shouldInject) {
        return reading;
    }

    const anomalyType = Math.floor(Math.random() * 4) + 1;

    const direction = Math.random() < 0.5 ? 1 : -1;

    switch (anomalyType) {
        case 1: {
            const change = 10 + Math.random() * 10;
            reading.temperature += change * direction;
            break;
        }

        case 2: {
            const change = 20 + Math.random() * 20;
            reading.humidity += change * direction;
            break;
        }

        case 3: {
            const change = 30 + Math.random() * 30;
            reading.pressure += change * direction;
            break;
        }

        // Frozen sensor
        case 4: {

            const sensors = [
                "temperature",
                "humidity",
                "pressure"
            ];

            const sensor =
                sensors[Math.floor(Math.random() * sensors.length)];

            frozenStations.set(reading.stationId, {
                sensor,
                value: reading[sensor],
                remaining: 10
            });

            break;
        }
    }

    return reading;
};
