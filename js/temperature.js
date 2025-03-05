import { state } from "./state.js";
import { updateChart } from "./chart.js";
import { updateInfoPanel } from "./ui.js";

export let number = 22; // Initial temperature value

const API_URL_GET = "http://127.0.0.1:5000/get-temperature";
const API_URL_UPDATE = "http://127.0.0.1:5000/update-temperature";

export async function fetchTemperature() {
    try {
        const response = await fetch(API_URL_GET);
        const data = await response.json();
        state.number = data.temperature;
        updateChart(state.number);
        updateInfoPanel();
    } catch (error) {
        console.error("Error fetching temperature:", error);
    }
}

export async function updateTemperature(change) {
    try {
        const response = await fetch(API_URL_UPDATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ change: change }),
        });
        const data = await response.json();
        state.number = data.temperature;
        updateChart(state.number);
        updateInfoPanel();
    } catch (error) {
        console.error("Error updating temperature:", error);
    }
}

// Optionally, you can add a temperature alert check
export function checkTemperatureAlerts(temp) {
    const alertElement = document.getElementById("alert");
    if (temp > 30) {
        alertElement.style.display = "block";
        alertElement.innerHTML = "Warning: High temperature!";
    } else {
        alertElement.style.display = "none";
    }
}

// Update lighting based on temperature (affects Three.js directional light)
export function updateLightingBasedOnTemperature(temp) {
    const lightColor = temp > 30 ? new THREE.Color(0xff4500) : new THREE.Color(0x1e90ff);
    directionalLight.color = lightColor;
}
