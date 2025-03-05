// threejs.js
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const threeSceneContainer = document.getElementById("threeSceneContainer");
if (threeSceneContainer) {
    threeSceneContainer.appendChild(renderer.domElement);
}

// Set up OrbitControls (ensure OrbitControls are loaded globally)
export let controls;
controls = new THREE.OrbitControls(camera, renderer.domElement);

// Load the 3D model using GLTFLoader (ensure GLTFLoader is available)
const loader = new THREE.GLTFLoader();
loader.load('assets/ThermostatModel.gltf', (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.scale.set(40, 40, 40);
    gltf.scene.position.set(0, 0, 0);
    camera.position.z = 5;

    // Adjust model materials for lighting
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
export const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Raycasting setup for object selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

window.addEventListener('click', handleMouseClick, false);

function handleMouseClick(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        const parentObject = object.parent;
        const parentName = parentObject ? (parentObject.name || "Unnamed Parent") : "No Parent";
        // Handle increase/decrease button clicks (import updateTemperature dynamically if needed)
        if (parentName.toLowerCase().includes("increasebutton")) {
            import("./temperature.js").then(module => module.updateTemperature(+0.5));
        } else if (parentName.toLowerCase().includes("decreasebutton")) {
            import("./temperature.js").then(module => module.updateTemperature(-0.5));
        }
        // Update UI selection via updateInfoPanel (from ui.js)
        import("./ui.js").then(module => module.updateInfoPanel());

        // Reset the previous selected object color
        if (selectedObject) {
            selectedObject.material.color.set(selectedObject.originalColor);
        }
        if (!object.originalColor) {
            object.originalColor = object.material.color.getHex();
        }
        // Darken the object's color to indicate selection
        const currentColor = object.material.color;
        currentColor.setHex(currentColor.getHex() - 0x202020);
        selectedObject = object;
    }
}

export function updateBackgroundColor(temp) {
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

export function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

// Adjust renderer and camera on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
