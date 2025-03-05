// telemetry.js
import { updateTemperature } from "./temperature.js";

export const TELEMETRY_API = "/get-telemetry";
export let telemetryData = [];
let chartIndex = 0;
let currentTemperature = 22;
let manualUpdate = false;

export async function fetchTelemetry() {
    try {
        const response = await fetch(TELEMETRY_API);
        telemetryData = await response.json();
        console.log("Telemetry JSON Loaded:", telemetryData);
        simulateTelemetry();
    } catch (error) {
        console.error("Error fetching telemetry:", error);
    }
}

function simulateTelemetry() {
    setInterval(() => {
        if (chartIndex < telemetryData.length && !manualUpdate) {
            const newTemp = telemetryData[chartIndex].temperature;
            if (newTemp > currentTemperature) {
                console.log("Auto Increasing...");
                triggerButton("increasebutton");
                updateTemperature(+0.5);
            } else if (newTemp < currentTemperature) {
                console.log("Auto Decreasing...");
                triggerButton("decreasebutton");
                updateTemperature(-0.5);
            }
            currentTemperature = newTemp;
            chartIndex++;
        }
        manualUpdate = false;
    }, 5000);
}

let buttonOriginalColors = {
    increasebutton: null,
    decreasebutton: null
};

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
                }, 500);
            }, 500);
        }
    });
});
}

export function downloadTelemetryJSON() {
    const jsonStr = JSON.stringify(telemetryData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "telemetry_data.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
