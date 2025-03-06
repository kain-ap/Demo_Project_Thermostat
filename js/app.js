import { animate } from "./threejs.js";
import { fetchTemperature } from "./temperature.js";
import { initializeChart } from "./chart.js";
import { state } from "./state.js";
import { updateInfoPanel } from "./ui.js"; // Add this import

// Start Three.js animation
animate();

// Initial setup
fetchTemperature();
setInterval(fetchTemperature, 5000);

// Chart initialization
initializeChart()
  .then(() => console.log("Chart initialized"))
  .catch(error => console.error("Chart error:", error));

let lastOutsideTemp = null;

async function checkOutsideTemperature() {
  try {
    // Fetch temperatures
    const [tempRes, outsideRes] = await Promise.all([
      fetch('/get-temperature'),
      fetch('/get-outside-temperature')
    ]);



    const { temperature: currentTemp } = await tempRes.json();
    const { outsideTemperature: outsideTemp } = await outsideRes.json();

    // Update state and UI
    state.number = currentTemp;
    updateInfoPanel(currentTemp, outsideTemp); // Now properly imported
    // Get DOM elements
    const statusElement = document.getElementById('status-alert');
    const criticalAlert = document.getElementById('alert');
    // Record data
    const timestamp = Date.now();
    state.recordedData.timestamps.push(timestamp);
    state.recordedData.thermostat.push(currentTemp);
    state.recordedData.outside.push(outsideTemp);

    // Keep only last 1000 entries
    if (state.recordedData.timestamps.length > 1000) {
      state.recordedData.timestamps.shift();
      state.recordedData.thermostat.shift();
      state.recordedData.outside.shift();
    }
    // Clear non-critical alerts
    if (statusElement) statusElement.style.display = 'none';

    // Temperature control logic
    if (outsideTemp > 28) {
      if (currentTemp > 22) {
        await adjustTemperature(22 - currentTemp, 'cooling', statusElement);
      }
    } else if (outsideTemp < 15) {
      if (currentTemp < 24) {
        await adjustTemperature(24 - currentTemp, 'heating', statusElement);
      }
    } else {
      if (Math.abs(currentTemp - outsideTemp) > 0.5) {
        await adjustTemperature(outsideTemp - currentTemp, 'syncing', statusElement);
      }
    }

    // Update chart
    import("./chart.js").then(({ updateChart }) =>
      updateChart(currentTemp, outsideTemp)
    );



  } catch (error) {
    console.error('Error:', error);
  }
}

async function adjustTemperature(change, mode, alertElement) {
  const { updateTemperature } = await import('./temperature.js');
  const { triggerButton } = await import('./telemetry.js');

  await updateTemperature(change);
  triggerButton(change > 0 ? 'increasebutton' : 'decreasebutton');

  if (alertElement) {
    alertElement.textContent = {
      cooling: '⚠️ Cooling to 22°C (High External Temperature)',
      heating: '⚠️ Heating to 24°C (Low External Temperature)',
      syncing: `🔄 Syncing with outside temperature`
    }[mode];

    alertElement.style.display = 'block';
    alertElement.style.backgroundColor = {
      cooling: '#ffd700',
      heating: '#a9d1e8',
      syncing: '#d1f7d1'
    }[mode];
  }
}

// Update the interval to check more frequently for better visualization
setInterval(checkOutsideTemperature, 5000); // Check every 5 seconds instead of 3 minutes