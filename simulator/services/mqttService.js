import mqtt from "mqtt";

const client = mqtt.connect(
    "mqtt://" + process.env.MQTT_BROKER + ":" + process.env.MQTT_PORT
);

let mqttConnected = false;

client.on("connect", () => {
    mqttConnected = true;
    console.log("MQTT connected");
});

client.on("close", () => {
    mqttConnected = false;
    console.log("MQTT disconnected");
});

const publishMessage = (topic, data) => {
    try {
        client.publish(topic, JSON.stringify(data));
    } catch (error) {
        console.log("Invalid sensor reading:", data);
    }
};

export const isMqttConnected = () => {
    return mqttConnected;
};

export { client, publishMessage };