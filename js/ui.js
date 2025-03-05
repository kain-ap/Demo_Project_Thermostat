// ui.js
import { updateTemperature, number } from "./temperature.js";
import { downloadTelemetryJSON } from "./telemetry.js";
import { numberChart } from "./chart.js";
import { updateBackgroundColor } from "./threejs.js";

export function updateInfoPanel() {
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) {
        infoPanel.innerHTML = `Current Temperature: ${number}°C`;
    }
    updateBackgroundColor(number);
}

// Event listener for the temperature range input
const tempRangeInput = document.getElementById('tempRange');
if (tempRangeInput) {
    tempRangeInput.addEventListener('input', function(event) {
        const newTemp = parseFloat(event.target.value);
        updateTemperature(newTemp - number);
    });
}

// Download telemetry JSON button event listener
const downloadTelemetryBtn = document.getElementById('downloadTelemetryBtn');
if (downloadTelemetryBtn) {
    downloadTelemetryBtn.addEventListener('click', downloadTelemetryJSON);
}

// Download chart as an image event listener
const downloadChartBtn = document.getElementById('downloadChartBtn');
if (downloadChartBtn) {
    downloadChartBtn.addEventListener('click', function() {
        if (numberChart) {
            const image = numberChart.toBase64Image();
            const link = document.createElement('a');
            link.href = image;
            link.download = 'temperature-chart.png';
            link.click();
        }
    });
}
