// app.js
import { animate } from "./threejs.js";
import { fetchTemperature } from "./temperature.js";
import { fetchTelemetry } from "./telemetry.js";
import "./ui.js";  // Sets up all UI event listeners
import "./chart.js"; // Initializes the chart

// Start the Three.js animation loop
animate();

// Load initial temperature from the API
fetchTemperature();

// Load telemetry data and start simulation
fetchTelemetry();
