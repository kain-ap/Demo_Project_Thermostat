// telemetry.js
import { updateTemperature } from "./temperature.js";
import { numberChart } from "./chart.js";
import { state } from "./state.js";

export const TELEMETRY_API = "/get-telemetry";
export let telemetryData = [];
let chartIndex = 0;
let currentTemperature = 22;
let manualUpdate = false;
let buttonOriginalColors = {
    increasebutton: null,
    decreasebutton: null
};



export async function fetchTelemetry() {
    try {
        const response = await fetch(TELEMETRY_API);
        telemetryData = await response.json();
        console.log("Telemetry JSON Loaded:", telemetryData);
        //simulateTelemetry();
    } catch (error) {
        console.error("Error fetching telemetry:", error);
    }
}

function simulateTelemetry() {
    setInterval(() => {
        if (chartIndex < telemetryData.length && !manualUpdate) {
            const newTemp = telemetryData[chartIndex].temperature;
            console.log("Simulated Temp:", newTemp);

            const tempDiff = newTemp - currentTemperature;

            if (tempDiff !== 0) {
                console.log(tempDiff > 0 ? "Auto Increasing..." : "Auto Decreasing...");
                updateTemperature(newTemp - currentTemperature); // Send the exact difference to Flask
                triggerButton(tempDiff > 0 ? "increasebutton" : "decreasebutton");

            }

            currentTemperature = newTemp;
            chartIndex++;
        }
        // Reset manualUpdate only if chartIndex changed
        if (chartIndex > 0) manualUpdate = false;
    }, 5000);
}


export function triggerButton(buttonName) {
    // Traverse the Three.js scene to find the corresponding button mesh
    // (Assuming the scene is globally accessible from three.js)
    import("./threejs.js").then(({ scene }) => {
    scene.traverse((child) => {
        if (child.isMesh && child.parent.name.toLowerCase().includes(buttonName)) {
            console.log(`Simulated Click: ${buttonName}`);
            if (!buttonOriginalColors[buttonName]) {
                buttonOriginalColors[buttonName] = child.material.color.clone();
                console.log(`Original Color Stored for ${buttonName}: ${buttonOriginalColors[buttonName].getHexString()}`);
            }
            const originalScale = child.scale.clone();
            const highlightColor = child.material.color.clone().offsetHSL(0, 0, 0.3);
            child.material.color.copy(highlightColor);
            child.scale.set(0.9, 0.9, 0.9);
            setTimeout(() => {
                child.scale.copy(originalScale);
                setTimeout(() => {
                    child.material.color.copy(buttonOriginalColors[buttonName]);
                    console.log(`Reverted to Original Color for ${buttonName}: ${buttonOriginalColors[buttonName].getHexString()}`);
                }, 5000);
            }, 500);
        }
    });
});
}

export function downloadTelemetryJSON() {
    const data = state.recordedData.timestamps.map((timestamp, index) => ({
        timestamp: new Date(timestamp).toISOString(),
        thermostat: state.recordedData.thermostat[index],
        outside: state.recordedData.outside[index]
    }));

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
   
    const link = document.createElement('a');
    link.href = url;
    link.download = `temperature_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}