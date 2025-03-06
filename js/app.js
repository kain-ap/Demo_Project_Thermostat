import { animate } from "./threejs.js";
import { fetchTemperature } from "./temperature.js";
import { fetchTelemetry } from "./telemetry.js";
import "./ui.js";  // Sets up all UI event listeners
import { initializeChart } from "./chart.js"; // Initialize chart from chart.js
import { state } from "./state.js";

// Start the Three.js animation loop
animate();

// Load initial temperature from the API
fetchTemperature();
setInterval(fetchTemperature, 5000); // Fetch temperature every 5 seconds

// Initialize chart and then fetch telemetry data
initializeChart()
  .then(() => {
    console.log("Chart initialized");
    // Once the chart is initialized, fetch telemetry data
    fetchTelemetry();
  })
  .catch((error) => {
    console.error("Error initializing chart:", error);
  });
  let lastOutsideTemp = null;
  async function checkOutsideTemperature() {
    try {
        const response = await fetch('/get-outside-temperature');
        const data = await response.json();
        const outsideTemp = data.outsideTemperature;
       
        // Update displays
        const outsideTempValue = document.getElementById('outsideTempValue');
        if (outsideTempValue) {
            outsideTempValue.textContent = outsideTemp.toFixed(1);
        }

        // Update chart
        if (outsideTemp !== lastOutsideTemp) {
            import("./chart.js").then(({ updateChart }) => {
                updateChart(state.number, outsideTemp);
            });
            lastOutsideTemp = outsideTemp;
        }

        const { updateTemperature } = await import('./temperature.js');
        const { triggerButton } = await import('./telemetry.js');
        const alertElement = document.getElementById('alert');

        // Clear previous alerts
        if (alertElement) alertElement.style.display = 'none';

        if (outsideTemp > 28) {
            // Cooling logic
            if (state.number > 22) {
                const adjustment = Math.max(22 - state.number, -1);
                await updateTemperature(adjustment);
                triggerButton('decreasebutton');
                if (alertElement) {
                    alertElement.textContent = 'Cooling to 22°C (high outside temp)';
                    alertElement.style.display = 'block';
                }
            }
        } else if (outsideTemp < 15) {
            // Heating logic
            if (state.number < 24) {
                const adjustment = Math.min(24 - state.number, 1);
                await updateTemperature(adjustment);
                triggerButton('increasebutton');
                if (alertElement) {
                    alertElement.textContent = 'Heating to 24°C (low outside temp)';
                    alertElement.style.display = 'block';
                }
            }
        } else {
            // Sync with outside temperature
            if (Math.abs(state.number - outsideTemp) > 0.1) {
                const adjustment = outsideTemp - state.number;
                await updateTemperature(adjustment);
                if (alertElement) {
                    alertElement.textContent = `Syncing with outside temp: ${outsideTemp.toFixed(1)}°C`;
                    alertElement.style.display = 'block';
                }
            }
        }
       
    } catch (error) {
        console.error('Error:', error);
    }
}

  // Update the interval to check more frequently for better visualization
  setInterval(checkOutsideTemperature, 5000); // Check every 5 seconds instead of 3 minutes