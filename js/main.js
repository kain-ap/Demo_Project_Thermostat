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
document.body.appendChild(renderer.domElement);

// Set up OrbitControls
let controls;

// API endpoint for fetching and updating temperature
const API_URL_GET = "http://127.0.0.1:5000/get-temperature";
const API_URL_UPDATE = "http://127.0.0.1:5000/update-temperature";

// Fetch initial temperature from Flask
async function fetchTemperature() {
    try {
        let response = await fetch(API_URL_GET);  // Use the correct endpoint for GET
        let data = await response.json();
        number = data.temperature;  // Update local variable
        updateChart(number);
        updateInfoPanel(number);
    } catch (error) {
        console.error("Error fetching temperature:", error);
    }
}

// Update temperature via API
async function updateTemperature(change) {
    try {
        let response = await fetch(API_URL_UPDATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ change: change }),  // Send change value in request body
        });
        let data = await response.json();
        number = data.temperature;
        updateChart(number);
        updateInfoPanel(number);
    } catch (error) {
        console.error("Error updating temperature:", error);
    }
}


// Set up Chart.js
const ctx = document.getElementById('numberChart').getContext('2d');
const numberChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Start'], // Starting label
        datasets: [{
            label: 'Current Temperature',
            data: [number], // Initial number value
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                max: 40, // Adjust as needed
            }
        }
    }
});

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

// Function to update the chart with the new number
function updateChart(number) {
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
    infoPanel.innerHTML = `Current Temperature: ${temp}°C`;

    // Change background color dynamically based on temperature
    updateBackgroundColor(temp);
}

// Function to update the background color based on the temperature
function updateBackgroundColor(temp) {
    let color;

    // Cooler temperatures - light blue to soft green (below 15°C)
    if (temp < 15) {
        color = interpolateColor(0xadd8e6, 0x90ee90, temp / 15);  // Light blue to light green
    }
    // Moderate temperatures - soft green to light gray (15°C to 18°C)
    else if (temp >= 15 && temp < 18) {
        color = interpolateColor(0x90ee90, 0xd3d3d3, (temp - 15) / 3);  // Soft green to light gray
    }
    // Mild temperatures - light gray to soft yellow (18°C to 22°C)
    else if (temp >= 18 && temp < 22) {
        color = interpolateColor(0xd3d3d3, 0xffffe0, (temp - 18) / 4);  // Light gray to soft yellow
    }
    // Warmer temperatures - soft orange to light red (22°C to 50°C)
    else if (temp >= 22 && temp <= 50) {
        color = interpolateColor(0xffcc99, 0xff9999, (temp - 22) / 28);  // Soft orange to light red
    }
    // Extreme temperatures - light red to deep red/brown (above 50°C)
    else if (temp > 50) {
        color = interpolateColor(0xff9999, 0x8b0000, (temp - 50) / 50);  // Light red to deep red/brown
    }

    // Set the scene's background color to the interpolated color
    scene.background = color;
}

// Helper function to interpolate between two colors based on a ratio (from 0 to 1)
function interpolateColor(color1, color2, factor) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >>  8) & 0xff;
    const b1 = (color1 >>  0) & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >>  8) & 0xff;
    const b2 = (color2 >>  0) & 0xff;

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