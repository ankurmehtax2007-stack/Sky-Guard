import config from "../../config/config.js";


export const predictReading = async (reading) => {

    try {

        const response = await fetch(`${config.mlServiceURL}/predict`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(reading)
        });

        if (!response.ok) {
            throw new Error(`ML service returned ${response.status}`);
        }

        const prediction = await response.json();

        return prediction;

    } catch (error) {

        console.error("Error communicating with ML service:", error.message);

        throw error;
    }
};