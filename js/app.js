import { animate } from "./threejs.js";
import { fetchTemperature } from "./temperature.js";
import { fetchTelemetry } from "./telemetry.js";
import "./ui.js";  // Sets up all UI event listeners
import { initializeChart } from "./chart.js"; // Initialize chart from chart.js

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
