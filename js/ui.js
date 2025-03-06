import { updateTemperature } from "./temperature.js";
import { downloadTelemetryJSON } from "./telemetry.js";
import { numberChart } from "./chart.js";
import { updateBackgroundColor } from "./threejs.js";
import { state } from "./state.js";

export function updateInfoPanel(currentTemp, outsideTemp) {
  const tempDisplay = document.getElementById("tempDisplay");
  const outsideDisplay = document.getElementById("outsideTempValue");
 
  // Add null checks and default values
  const formattedCurrent = currentTemp?.toFixed?.(1) ?? '--';
  const formattedOutside = outsideTemp?.toFixed?.(1) ?? '--';
 
  if (tempDisplay) tempDisplay.textContent = `${formattedCurrent}°C`;
  if (outsideDisplay) outsideDisplay.textContent = `${formattedOutside}°C`;
 
  updateBackgroundColor(currentTemp || state.number);
}

// Event listener for the temperature range input
const tempRangeInput = document.getElementById('tempRange');
if (tempRangeInput) {
    tempRangeInput.addEventListener('input', function(event) {
        const newTemp = parseFloat(event.target.value);
        // Here, just update the temperature based on the telemetry
        updateTemperature(newTemp);
    });
}

// Remove manual mode toggle since it's no longer needed

// Remove manual temperature increase/decrease buttons as manual control is disabled

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
