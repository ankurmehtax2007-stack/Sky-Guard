import stations from "./config/stations.js";
import generateReading from "./services/weatherGenerator.js";
import { client, publishMessage } from "./services/mqttService.js";

const publishReading = (station) => {
    const data = generateReading(station);
    const topic = `weather/readings/${station.stationId}`;

    publishMessage(topic, data);
};

client.on("connect", () => {
    console.log("Simulator connected to MQTT broker");

    for (const station of stations) {
        publishReading(station);

        setInterval(() => {
            publishReading(station);
        }, 5000);
    }
});