import { state } from "./state.js";
import { updateChart } from "./chart.js";
import { updateInfoPanel } from "./ui.js";

export let number = 22;

const API_URL_GET = "http://127.0.0.1:5000/get-temperature";
const API_URL_UPDATE = "http://127.0.0.1:5000/update-temperature";

export async function fetchTemperature() {
    try {
        const [tempResponse, outsideResponse] = await Promise.all([
            fetch(API_URL_GET),
            fetch('/get-outside-temperature?'+ new Date().getTime())
        ]);
       
        const tempData = await tempResponse.json();
        const outsideData = await outsideResponse.json();
         // Record initial data
         const timestamp = Date.now();
         state.recordedData.timestamps.push(timestamp);
         state.recordedData.thermostat.push(state.number);
         state.recordedData.outside.push(outsideData.outsideTemperature);
        
        state.number = tempData.temperature;
        updateChart(state.number, outsideData.outsideTemperature);
        updateInfoPanel(state.number, outsideData.outsideTemperature); // Add parameters
    } catch (error) {
        console.error("Error:", error);
        updateInfoPanel(state.number, null); // Handle error case
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
        console.log("Temperature Updated:", data.temperature);

        // Get fresh outside temperature
        const outsideRes = await fetch('/get-outside-temperature');
        const outsideData = await outsideRes.json();
        const timestamp = Date.now();
        state.recordedData.timestamps.push(timestamp);
        state.recordedData.thermostat.push(data.temperature);
        state.recordedData.outside.push(outsideData.outsideTemperature);
       
        state.number = data.temperature;
        updateChart(state.number, outsideData.outsideTemperature);
        updateInfoPanel(data.temperature, outsideData.outsideTemperature); // Add parameters
        
    } catch (error) {
        console.error("Error updating temperature:", error);
        updateInfoPanel(state.number, null); // Handle error case
    }
}

// Rest of your temperature.js remains the same
export function checkTemperatureAlerts(temp) {
    const alertElement = document.getElementById("alert");
    const outsideAlertElement = document.getElementById("outside-alert");
   
    // Add null checks for elements
    if (alertElement && outsideAlertElement) {
        const outsideAlertActive = outsideAlertElement.style.display !== 'none';
       
        if (temp > 30 && !outsideAlertActive) {
            alertElement.style.display = "block";
            alertElement.innerHTML = "Warning: Critical Internal Temperature!";
        } else {
            alertElement.style.display = "none";
        }
    }
}

// Update lighting based on temperature (affects Three.js directional light)
export function updateLightingBasedOnTemperature(temp) {
    const lightColor = temp > 30 ? new THREE.Color(0xff4500) : new THREE.Color(0x1e90ff);
    directionalLight.color = lightColor;
}

