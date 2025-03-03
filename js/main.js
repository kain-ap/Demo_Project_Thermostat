// Initial number value (temperature)
let number = 22;

// Time tracking for elapsed seconds
let startTime = null;  // First click timestamp
let elapsedTime = 0;   // Elapsed time since first click

// Set up the scene, camera, renderer, etc.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// Append the renderer to the new container instead of directly to the body
const threeSceneContainer = document.getElementById("threeSceneContainer");
if (threeSceneContainer) {
    threeSceneContainer.appendChild(renderer.domElement);
}

// Set up OrbitControls
let controls;

let numberChart;

// Chart.js initialization (ensuring canvas adapts)
const ctx = document.getElementById('numberChart')?.getContext('2d');
if (ctx) {
    numberChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start'],
            datasets: [{
                label: 'Current Temperature',
                data: [number],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            }]
        },
        options: {
            responsive: true, // Ensures responsiveness
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


// API endpoint for fetching and updating temperature
const API_URL_GET = "http://127.0.0.1:5000/get-temperature";
const API_URL_UPDATE = "http://127.0.0.1:5000/update-temperature";

async function fetchTemperature() {
    try {
        let response = await fetch(API_URL_GET);  // Use the correct endpoint for GET
        let data = await response.json();
        number = data.temperature;  // Update local variable

        // Ensure the chart is initialized before updating it
        if (numberChart) {
            updateChart(number);
        } else {
            console.error("Chart is not initialized.");
        }

        updateInfoPanel(number);
    } catch (error) {
        console.error("Error fetching temperature:", error);
    }
}


// Update temperature via API and update UI
async function updateTemperature(change) {
    try {
        let response = await fetch(API_URL_UPDATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ change: change }),  // Send change value in request body
        });
        let data = await response.json();
        number = data.temperature; // Update the local temperature variable

        // Update chart and info panel
        updateChart(number);
        updateInfoPanel(number);
    } catch (error) {
        console.error("Error updating temperature:", error);
    }
}

// Adjust renderer on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Re-render chart for responsiveness (without using resize method)
    if (numberChart) {
        numberChart.update();
    }
});


// Event listener for range input
const tempRangeInput = document.getElementById('tempRange');
if (tempRangeInput) {
    tempRangeInput.addEventListener('input', function(event) {
        const newTemp = parseFloat(event.target.value);
        updateTemperature(newTemp - number);  // Update temperature based on the difference
    });
}

// Check temperature alerts
function checkTemperatureAlerts(temp) {
    const alertElement = document.getElementById("alert");
    if (temp > 30) {
        alertElement.style.display = "block";
        alertElement.innerHTML = "Warning: High temperature!";
    } else {
        alertElement.style.display = "none";
    }
}

// Load the 3D model using GLTFLoader
const loader = new THREE.GLTFLoader();
loader.load('assets/ThermostatModel.gltf', (gltf) => {
    scene.add(gltf.scene);

    gltf.scene.scale.set(40, 40, 40);
    gltf.scene.position.set(0, 0, 0);

    camera.position.z = 5;

    // Initialize OrbitControls after the camera is set up
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Ensure the model materials are using the correct settings for lighting
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material.metalness = 0.1;
            child.material.roughness = 0.7;
            child.material.emissive = new THREE.Color(0x000000);
            child.material.needsUpdate = true;
        }
    });
}, undefined, (error) => {
    console.error("An error occurred while loading the model:", error);
});

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Raycasting setup for object selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Handle mouse click events
window.addEventListener('click', handleMouseClick, false);

function updateChart(number) {
    // Check if the chart is properly initialized
    if (!numberChart || !numberChart.data || !numberChart.data.labels || !numberChart.data.datasets) {
        console.error("Chart or its data structure is not properly initialized.");
        return;  // Exit function if chart isn't ready
    }

    if (startTime === null) {
        startTime = Date.now();
    }

    // Calculate the elapsed time in seconds
    elapsedTime = (Date.now() - startTime) / 1000;

    // Add the elapsed time as the x-axis label
    numberChart.data.labels.push(elapsedTime.toFixed(2));
    numberChart.data.datasets[0].data.push(number);

    // Limit the number of data points shown (optional, to avoid overcrowding)
    if (numberChart.data.labels.length > 10) {
        numberChart.data.labels.shift();
        numberChart.data.datasets[0].data.shift();
    }

    // Dynamically adjust the y-axis max based on the temperature
    const maxTemp = Math.max(40, number);  // Set max to 50 or the current temperature (whichever is higher)
    numberChart.options.scales.y.max = maxTemp + 10;  // Increase the max value by 10 to provide some space

    // Re-render the chart
    numberChart.update();
}


// Update the info panel and background color
function updateInfoPanel(temp) {
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) {
        infoPanel.innerHTML = `Current Temperature: ${temp}°C`;
    }

    updateBackgroundColor(temp);
}

// Function to update the background color based on the temperature
function updateBackgroundColor(temp) {
    let color;

    if (temp < 15) {
        color = interpolateColor(0xA9D1E8, 0xA2D8A0, temp / 15);
    } else if (temp >= 15 && temp < 18) {
        color = interpolateColor(0xA2D8A0, 0xD1D1D1, (temp - 15) / 3);
    } else if (temp >= 18 && temp < 22) {
        color = interpolateColor(0xD1D1D1, 0xFFF9C4, (temp - 18) / 4);
    } else if (temp >= 22 && temp <= 50) {
        color = interpolateColor(0xFFDBC1, 0xFFB5B5, (temp - 22) / 28);
    } else if (temp > 50) {
        color = interpolateColor(0xFFB5B5, 0xFF7A7A, (temp - 50) / 50);
    }

    scene.background = color;
}

// Helper function to interpolate between two colors based on a ratio (from 0 to 1)
function interpolateColor(color1, color2, factor) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = (color1 >> 0) & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = (color2 >> 0) & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return new THREE.Color(r / 255, g / 255, b / 255);
}

// Animation loop for rendering the scene
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}
animate();

// Load initial temperature from API
fetchTemperature();


const TELEMETRY_API = "/get-telemetry";
let telemetryData = [];
let chartIndex = 0;
let currentTemperature = 22;
let manualUpdate = false;

// Fetch Telemetry JSON
async function fetchTelemetry() {
    const response = await fetch(TELEMETRY_API);
    telemetryData = await response.json();
    console.log("Telemetry JSON Loaded:", telemetryData);
    simulateTelemetry();
}

// Simulate JSON Telemetry
function simulateTelemetry() {
    setInterval(() => {
        if (chartIndex < telemetryData.length && !manualUpdate) {
            const newTemp = telemetryData[chartIndex].temperature;

            if (newTemp > currentTemperature) {
                console.log("Auto Increasing...");
                triggerButton("increasebutton");
                updateTemperature(+0.5);
            }
            else if (newTemp < currentTemperature) {
                console.log("Auto Decreasing...");
                triggerButton("decreasebutton");
                updateTemperature(-0.5);
            }

            currentTemperature = newTemp;
            chartIndex++;
        }

        manualUpdate = false; // Reset Manual Flag
    }, 5000);
}

let buttonOriginalColors = {
    increasebutton: null,
    decreasebutton: null
};

function triggerButton(buttonName) {
    scene.traverse((child) => {
        if (child.isMesh && child.parent.name.toLowerCase().includes(buttonName)) {
            console.log(`Simulated Click: ${buttonName}`);

            // Store the original color for the button dynamically (only once when it's clicked)
            if (!buttonOriginalColors[buttonName]) {
                buttonOriginalColors[buttonName] = child.material.color.clone();  // Store the original color dynamically
                console.log(`Original Color Stored for ${buttonName}: ${buttonOriginalColors[buttonName].getHexString()}`);
            }

            let originalScale = child.scale.clone();
            let highlightColor = buttonOriginalColors[buttonName].clone().offsetHSL(0, 0, 0.3);  // Slightly brighter version for highlighting

            // Apply click effects: Bounce + Highlight
            child.material.color.copy(highlightColor);
            child.scale.set(0.9, 0.9, 0.9); // Bounce effect

            setTimeout(() => {
                child.scale.copy(originalScale); // Bounce back

                // Reset to original color after 5 seconds
                setTimeout(() => {
                    // Reset to the original color dynamically
                    child.material.color.copy(buttonOriginalColors[buttonName]);  // Revert to the stored original color
                    console.log(`Reverted to Original Color for ${buttonName}: ${buttonOriginalColors[buttonName].getHexString()}`);
                }, 500); // Reset color after 500ms
            }, 500); // Bounce effect time
        }
    });
}







// Function to download telemetry data as JSON
function downloadTelemetryJSON() {
    const jsonStr = JSON.stringify(telemetryData, null, 2); // Convert telemetry data to formatted JSON string
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri); // Set the URI to the data
    link.setAttribute("download", "telemetry_data.json"); // Set the download file name
    document.body.appendChild(link);
    link.click(); // Trigger download
    document.body.removeChild(link); // Clean up after download
}

// Add event listener for the download button
document.getElementById('downloadTelemetryBtn').addEventListener('click', downloadTelemetryJSON);


// Download chart as an image
document.getElementById('downloadChartBtn').addEventListener('click', function() {
    const image = numberChart.toBase64Image();
    const link = document.createElement('a');
    link.href = image;
    link.download = 'temperature-chart.png';
    link.click();
});

function handleMouseClick(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        const parentObject = object.parent;
        const parentName = parentObject ? (parentObject.name || "Unnamed Parent") : "No Parent";

        // Handle increase/decrease buttons with API calls
        if (parentName.toLowerCase().includes("increasebutton")) {
            updateTemperature(+0.5);
        } else if (parentName.toLowerCase().includes("decreasebutton")) {
            updateTemperature(-0.5);
        }

        // Update UI for selection
        updateInfoPanel(number);

        // Reset the previous selected object color to its original color
        if (selectedObject) {
            selectedObject.material.color.set(selectedObject.originalColor);
        }

        // Store the original color before changing it
        if (!object.originalColor) {
            object.originalColor = object.material.color.getHex();
        }

        // Darken the object's color to indicate selection
        const currentColor = object.material.color;
        currentColor.setHex(currentColor.getHex() - 0x202020);

        // Mark this object as the currently selected one
        selectedObject = object;
    }
}

function updateLightingBasedOnTemperature(temp) {
    const lightColor = temp > 30 ? new THREE.Color(0xff4500) : new THREE.Color(0x1e90ff);
    directionalLight.color = lightColor; // Change light color based on temp
}

updateLightingBasedOnTemperature(number);



fetchTelemetry();