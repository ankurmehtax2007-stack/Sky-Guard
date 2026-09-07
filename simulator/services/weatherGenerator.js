import { injectAnomaly } from "./anomalyInjector.js";

const stationState = new Map();

const generateReading = (station) => {
    let state = stationState.get(station.stationId);
    if (!state) {
        state = {
            temperature: station.baseTemperature,
            humidity: station.baseHumidity,
            pressure: station.basePressure,
            step: Math.random() * 100
        };
    }

    // Continuous smooth physical diurnal drift + realistic micro-variations
    state.step += 0.05;
    const diurnalTemp = Math.sin(state.step) * 2.5; // Natural smooth curve (±2.5°C)
    const diurnalHum = -Math.sin(state.step) * 3.5; // Humidity naturally mirrors temperature
    const microNoiseTemp = (Math.random() - 0.5) * 0.3; // Micro variation ±0.15°C
    const microNoiseHum = (Math.random() - 0.5) * 0.4;
    const microNoisePress = (Math.random() - 0.5) * 0.2;

    const smoothTemp = Number((station.baseTemperature + diurnalTemp + microNoiseTemp).toFixed(1));
    const smoothHum = Number(Math.max(15, Math.min(95, station.baseHumidity + diurnalHum + microNoiseHum)).toFixed(1));
    const smoothPress = Number((station.basePressure + Math.cos(state.step * 0.5) * 1.5 + microNoisePress).toFixed(1));

    state.temperature = smoothTemp;
    state.humidity = smoothHum;
    state.pressure = smoothPress;
    stationState.set(station.stationId, state);

    const reading = {
        stationId: station.stationId,
        timestamp: new Date().toISOString(),
        temperature: smoothTemp,
        humidity: smoothHum,
        pressure: smoothPress
    };

    return injectAnomaly(reading);
};

export default generateReading;

