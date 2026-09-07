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
    // Realistic anomaly injection probability (12% of cycles, allowing smooth baselines)
    const shouldInject = Math.random() < 0.05;

    if (!shouldInject) {
        return reading;
    }

    const anomalyType = Math.floor(Math.random() * 4) + 1;

    console.log(`[ANOMALY INJECTED] Station ${reading.stationId} - Type ${anomalyType}`);

    const direction = Math.random() < 0.5 ? 1 : -1;

    switch (anomalyType) {
        case 1: {
            // Temperature spike (+16-24°C) or cryogenic dip (-10-14°C)
            const change = direction > 0 ? (16 + Math.random() * 8) : -(10 + Math.random() * 5);
            reading.temperature = Number(Math.max(3.0, (reading.temperature + change)).toFixed(1));
            break;
        }

        case 2: {
            // Humidity spike or arid drop
            const change = 25 + Math.random() * 15;
            const newHum = reading.humidity + change * direction;
            reading.humidity = Number(Math.min(98.0, Math.max(12.0, newHum)).toFixed(1));
            break;
        }

        case 3: {
            // Pressure surge or barometric dip
            const change = 25 + Math.random() * 20;
            reading.pressure = Number((reading.pressure + change * direction).toFixed(1));
            break;
        }

        // Frozen sensor with an extreme reading
        case 4: {
            const sensors = ["temperature", "humidity", "pressure"];
            const sensor = sensors[Math.floor(Math.random() * sensors.length)];
            const extremeValue = sensor === "temperature" ? 54.5 : sensor === "humidity" ? 98.5 : 940.0;
            reading[sensor] = extremeValue;

            frozenStations.set(reading.stationId, {
                sensor,
                value: extremeValue,
                remaining: 3 // 3 cycles instead of 10
            });
            break;
        }
    }

    return reading;
};
