// chart.js
// Assumes that Chart.js library is loaded globally
import { state } from "./state.js";

export let numberChart;

const ctx = document.getElementById('numberChart')?.getContext('2d');
if (ctx) {
    numberChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start'],
            datasets: [{
                label: 'Current Temperature',
                data: [state.number],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 40,
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    zoom: {
                        enabled: true,
                        mode: 'xy',
                        speed: 0.1,
                    }
                }
            }
        }
    });
}

export function updateChart(newNumber) {
    if (!numberChart || !numberChart.data || !numberChart.data.labels || !numberChart.data.datasets) {
        console.error("Chart or its data structure is not properly initialized.");
        return;
    }
    // Start time is stored as a property of the function
    if (typeof updateChart.startTime === 'undefined') {
        updateChart.startTime = Date.now();
    }
    const elapsedTime = (Date.now() - updateChart.startTime) / 1000;
    numberChart.data.labels.push(elapsedTime.toFixed(2));
    numberChart.data.datasets[0].data.push(newNumber);

    // Limit the number of data points shown (to avoid overcrowding)
    if (numberChart.data.labels.length > 10) {
        numberChart.data.labels.shift();
        numberChart.data.datasets[0].data.shift();
    }

    // Dynamically adjust the y-axis max based on the temperature
    const maxTemp = Math.max(40, newNumber);
    numberChart.options.scales.y.max = maxTemp + 10;
    numberChart.update();
}
