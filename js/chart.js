import { state } from "./state.js";

export let numberChart;

const ctx = document.getElementById("numberChart")?.getContext("2d");

export function initializeChart() {
    return new Promise((resolve, reject) => {
        if (ctx) {
            numberChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Start"],
                    datasets: [
                        {
                            label: "Simulated Temperature",
                            data: [state.number],
                            borderColor: "rgba(75, 192, 192, 1)",
                            fill: false,
                            hidden: false, // Simulated data is visible by default
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 30,
                        },
                    },
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: "xy",
                            },
                            zoom: {
                                enabled: true,
                                mode: "xy",
                                speed: 0.1,
                            },
                        },
                    },
                },
            });

            // Resolve the promise once the chart is initialized
            resolve();
        } else {
            // Reject the promise if there is no canvas element
            reject(new Error("Chart initialization failed: No canvas context found"));
        }
    });
}

// Function to update the chart (only telemetry data now)
export function updateChart(newNumber) {
    if (!numberChart) {
        console.error("Chart not initialized");
        return;
    }

    if (typeof updateChart.startTime === "undefined") {
        updateChart.startTime = Date.now();
    }

    const elapsedTime = ((Date.now() - updateChart.startTime) / 1000).toFixed(2);

    // Show the simulated data and hide the manual data (no manual mode now)
    numberChart.data.datasets[0].hidden = false;

    // Add simulated data when not in manual mode
    numberChart.data.labels.push(elapsedTime);
    numberChart.data.datasets[0].data.push(newNumber); // Update with simulated data

    if (numberChart.data.labels.length > 20) {
        numberChart.data.labels.shift();
        numberChart.data.datasets[0].data.shift();
    }

    const maxTemp = Math.max(...numberChart.data.datasets[0].data, 30);
    numberChart.options.scales.y.max = maxTemp + 10;

    // Update the chart
    numberChart.update();
}
