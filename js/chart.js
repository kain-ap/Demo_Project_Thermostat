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
                            label: "Thermostat Temperature",
                            data: [state.number],
                            borderColor: "rgba(75, 192, 192, 1)",
                            fill: false,
                        },
                        {
                            label: "Outside Temperature",
                            data: [],
                            borderColor: "rgba(255, 99, 132, 1)",
                            fill: false,
                            hidden: false,
                        }
                    ],
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            title: { display: true, text: 'Temperature (°C)' },
                            min: 10,
                            max: 40,
                            grace: '5%' // Add padding
                        },
                        x: {
                            title: { display: true, text: 'Time (minutes)' },
                            type: 'linear',
                            ticks: {
                                callback: function(value) {
                                    return (value/60).toFixed(1); // Convert seconds to minutes
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        zoom: { pan: { enabled: true }, zoom: { enabled: true } }
                    }
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

export function updateChart(newNumber, outsideTemp) {
    if (!numberChart) return;
    

    // Initialize start time if undefined
    if (typeof updateChart.startTime === "undefined") {
        updateChart.startTime = Date.now();
    }

    const elapsedTime = ((Date.now() - updateChart.startTime) / 1000).toFixed(2);
   
    // Add new time label
    numberChart.data.labels.push(elapsedTime);
   
    // Update both datasets
    numberChart.data.datasets[0].data.push(newNumber);
    numberChart.data.datasets[1].data.push(outsideTemp);

    // Maintain data length
    if (numberChart.data.labels.length > 20) {
        numberChart.data.labels.shift();
        numberChart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    // Update Y-axis scale
    const allData = [
        ...numberChart.data.datasets[0].data,
        ...numberChart.data.datasets[1].data
    ];
    const maxTemp = Math.max(...allData, 30);
    const minTemp = Math.min(...allData, 10);
   
    numberChart.options.scales.y = {
        ...numberChart.options.scales.y,
        max: maxTemp + 5,
        min: minTemp - 5
    };

    numberChart.update();
}