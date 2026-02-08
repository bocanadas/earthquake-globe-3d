// === IMPORT THREE.JS ===
import * as THREE from 'three';

// OrbitControls lets user rotate the globe with their mouse
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

console.log('🌍 Starting Earth Globe setup...');

// === HELPER FUNCTION: Convert lat/lon to 3D coordinates ===
// This function takes a position on Earth (lat/lon) and converts it to
// a 3D position (x, y, z) on the surface of our sphere
function latLonToVector3(lat, lon, radius) {
  // Convert latitude and longitude from degrees to radians (Three.js uses radians)
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  // Calculate 3D position using spherical coordinates
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  // Return a Vector3 (Three.js's way of storing x, y, z positions)
  return new THREE.Vector3(x, y, z);
}

console.log('✓ Helper function ready (lat/lon → 3D coordinates)');

// === CLICK DETECTION SETUP ===
// Raycaster shoots invisible rays to detect what you clicked
const raycaster = new THREE.Raycaster();

// Store mouse position (normalized to -1 to 1 range)
const mouse = new THREE.Vector2();

// Track currently selected earthquake (null if none selected)
let selectedEarthquake = null;

let isEarthPaused = false;

console.log('✓ Click detection setup ready');

// === INTRO OVERLAY FADE ON BUTTON CLICK ===
function fadeIntro() {
  const intro = document.getElementById('intro-overlay');
  intro.classList.add('fade-out');
}

// Listen for start button click
document.getElementById('start-btn').addEventListener('click', fadeIntro);
console.log('✓ Intro overlay ready (click "Click to Start" button)');

// === CREATE 3D WORLD (Scene) ===
const scene = new THREE.Scene();
console.log('✓ 3D world (scene) created');

// === CREATE THE CAMERA ===
// This is like your eyes - it determines what you see
const camera = new THREE.PerspectiveCamera(
  75,                                    // How wide you can see
  window.innerWidth / window.innerHeight, // Match screen shape (width/height ratio)
  0.1,                                   // Closest you can see 
  1000                                   // Farthest you can see
);
camera.position.z = 12;  // Move camera back 15 units so we can see the Earth
console.log('✓ Camera created at distance:', camera.position.z);

// === RENDERER ===
const renderer = new THREE.WebGLRenderer({
  antialias: true  // Makes edges smooth instead of jagged/pixelated
});
renderer.setSize(window.innerWidth, window.innerHeight);  // Make canvas fill the whole window
document.querySelector('#app').appendChild(renderer.domElement);  // Add the canvas to the #app container
console.log('✓ Renderer created');

// === CREATE THE EARTH ===
console.log('🌎 Building Earth globe...');

// The shape (a sphere)
const earthRadius = 5;  // Size of our Earth (can change this to make it bigger/smaller)
const earthGeometry = new THREE.SphereGeometry(
  earthRadius,  // Size of the globe
  64,           // Detail: horizontal segments (higher = smoother, but slower)
  64            // Detail: vertical segments (higher = smoother, but slower)
);

// Earth texture - free to use from NASA
const earthTexture = new THREE.TextureLoader().load(
  'world.lowerres.jpg',
  () => {
    // This function runs when the texture loads successfully
    console.log('✓ Earth texture loaded successfully');
  },
  undefined,  // Progress callback (we don't need this)
  (error) => {
    // This function runs if the texture fails to load
    console.error('❌ Failed to load Earth texture:', error);
  }
);

// The material (how the surface looks)
// MeshStandardMaterial responds to light realistically
const earthMaterial = new THREE.MeshStandardMaterial({
  map: earthTexture  // Apply the Earth image to the sphere surface
});

// Combine shape + appearance = 3D object (a mesh)
const earthGlobe = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earthGlobe);  // Put the Earth in the 3D world
console.log('✓ Earth added to scene with radius:', earthRadius);

// === ADD LIGHTING ===

// Main light (like the Sun) - directional light comes from one direction
const sunLight = new THREE.DirectionalLight( 0xffffff, 4);
sunLight.position.set(5, 3, 5);  // Position the sun-like light in space
scene.add(sunLight);

// Soft ambient light (fills in shadows so the dark side isn't pitch black)
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  0.8        // Dim brightness (just enough to see the dark side)
);
scene.add(ambientLight);
console.log('✓ Lighting added (sun + ambient)');

// === ADD MOUSE CONTROLS ===
// drag to rotate and scroll to zoom
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // Smooth, inertia-like movement (feels natural)
controls.dampingFactor = 0.05;      // How much smoothing (lower = more inertia)
controls.minDistance = 8;           // Closest you can zoom
controls.maxDistance = 30;          // Farthest you can zoom out
console.log('✓ Mouse controls enabled (drag to rotate, scroll to zoom)');

// === EARTHQUAKE FUNCTIONS ===

// Function 1: Fetch earthquake data from USGS API
async function fetchEarthquakes() {
  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
    );

    // Convert the response to JSON
    const data = await response.json();

    console.log(`✓ Found ${data.features.length} earthquakes in the past 24 hours`);
    return data.features; // Return the array of earthquakes

  } catch (error) {
    console.error('Failed to fetch earthquakes:', error);
    return [];
  }
}

// Function 2: Create a single earthquake marker (a glowing dot)
function createEarthquakeMarker(earthquake) {
  // Get earthquake data from the API response
  const coords = earthquake.geometry.coordinates;
  const lon = coords[0];  // Longitude (east/west position)
  const lat = coords[1];  // Latitude (north/south position)
  const mag = earthquake.properties.mag;  // Magnitude (how strong)

  // Calculate size based on magnitude
  // Small earthquakes = tiny dots, big earthquakes = bigger dots
  // Math.max ensures minimum size of 0.012 so tiny quakes are still visible
  const size = Math.max(0.012, mag * 0.012);

  // Pick color based on magnitude (green → yellow → orange → red)
  let color;
  if (mag < 2.5) {
    color = 0x00ff00;  // Green for minor earthquakes
  } else if (mag < 4.5) {
    color = 0xffff00;  // Yellow for light earthquakes
  } else if (mag < 6.0) {
    color = 0xff9900;  // Orange for strong earthquakes
  } else {
    color = 0xff0000;  // Red for major earthquakes
  }

  // Create a small glowing sphere (the earthquake marker)
  const markerGeometry = new THREE.SphereGeometry(size, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({color: color, opacity: 1});

  const marker = new THREE.Mesh(markerGeometry, markerMaterial);

  // Position it on the Earth's surface using our helper function
  // We add 0.01 to radius so markers sit ABOVE the Earth surface (not sunk into it)
  const position = latLonToVector3(lat, lon, earthRadius + 0.01);
  marker.position.copy(position);

  // Store earthquake info on the marker (for clicking and info panel)
  marker.userData = {
    magnitude: mag,
    location: earthquake.properties.place,
    time: new Date(earthquake.properties.time),
    depth: coords[2] || 0,  // Depth in km (third coordinate)
    url: earthquake.properties.url,  // USGS detail page URL
    originalColor: color    // Store original color for restoration
  };

  return marker; // Return the marker so we can add it to the scene
}

// Function 3: Load all earthquakes and add them to the globe
async function loadEarthquakes() {
  // Fetch earthquake data from USGS
  const earthquakes = await fetchEarthquakes();

  console.log('🌋 Adding earthquake markers to globe...');

  // Create a group to hold all earthquake markers
  // A group is like a folder - you can move/delete everything inside at once
  const earthquakeGroup = new THREE.Group();

  // Loop through each earthquake and create a marker for it
  earthquakes.forEach((earthquake) => {
    const marker = createEarthquakeMarker(earthquake);
    earthquakeGroup.add(marker); // Add marker to the group
  });

  // Add the entire group to the scene at once
  earthGlobe.add(earthquakeGroup);

  console.log(`✓ Added ${earthquakes.length} earthquake markers`);

  // Return the group (useful if we want to update or remove markers later)
  return earthquakeGroup;
}

// === CLICK DETECTION FUNCTIONS ===

// Function 1: Handle mouse clicks
function onMouseClick(event) {
  // Convert mouse position from pixels to normalized (-1 to 1) coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Check what was clicked
  checkIntersections();
}

// Function 2: Check what the ray hit
function checkIntersections() {
  // Update raycaster with current camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Get all earthquake markers from the earthquake group
  const earthquakeMarkers = earthGlobe.children[0]?.children || [];

  // Check which objects the ray intersects
  const intersects = raycaster.intersectObjects(earthquakeMarkers);

  if (intersects.length > 0) {
    // We hit an earthquake! Select it
    const clickedMarker = intersects[0].object;
    selectEarthquake(clickedMarker);
  } else {
    // Clicked empty space - deselect
    deselectEarthquake();
  }
}

// Function 3: Select an earthquake
function selectEarthquake(marker) {
  // If there's already a selected earthquake, deselect it first
  if (selectedEarthquake) {
    deselectEarthquake();
  }

  isEarthPaused = true;

  // Store the selected earthquake
  selectedEarthquake = marker;

  // Change color to purple/magenta to highlight it
  selectedEarthquake.material.color.setHex(0xff00ff);

  // Make it slightly bigger for emphasis
  selectedEarthquake.scale.set(1.5, 1.5, 1.5);

  // Store original color so we can restore it later
  selectedEarthquake.userData.originalColor = marker.userData.originalColor;

  // Show the info panel with earthquake data
  showInfoPanel(marker.userData);

  console.log('📍 Selected earthquake:', marker.userData.location);
}

// Function 4: Deselect earthquake
function deselectEarthquake() {
  if (!selectedEarthquake) return;

  isEarthPaused = false;

  // Restore original color
  selectedEarthquake.material.color.setHex(
    selectedEarthquake.userData.originalColor
  );

  // Restore original size
  selectedEarthquake.scale.set(1, 1, 1);

  // Clear selection
  selectedEarthquake = null;

  // Hide the info panel
  hideInfoPanel();

  console.log('✖️ Deselected earthquake');
}

// Function 5: Show info panel
function showInfoPanel(earthquakeData) {
  const infoPanel = document.getElementById('earthquake-info');

  // Fill in the earthquake data
  document.getElementById('info-magnitude').textContent =
    earthquakeData.magnitude.toFixed(1);

  document.getElementById('info-location').textContent =
    earthquakeData.location;

  // Format the time nicely
  const timeString = earthquakeData.time.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
  document.getElementById('info-time').textContent = timeString;

  // Add depth
  document.getElementById('info-depth').textContent =
    earthquakeData.depth ? earthquakeData.depth.toFixed(1) : 'Unknown';

  // Set the USGS details link
  const urlLink = document.getElementById('info-url');
  if (earthquakeData.url) {
    urlLink.href = earthquakeData.url;
    urlLink.style.display = 'inline';
  } else {
    urlLink.style.display = 'none';
  }

  // Show the panel
  infoPanel.classList.remove('hidden');
}

// Function 6: Hide info panel
function hideInfoPanel() {
  const infoPanel = document.getElementById('earthquake-info');
  infoPanel.classList.add('hidden');
}

// === ANIMATION LOOP ===
const rotationSpeed = 0.001;

function animate() {
  // Schedule this function to run again on the next frame
  // This creates a loop: animate -> next frame -> animate -> next frame...
  requestAnimationFrame(animate);

  if (!isEarthPaused) {
    // Auto-rotate the Earth slowly around the Y axis (vertical axis through poles)
    earthGlobe.rotation.y += rotationSpeed;
  }

  // Update controls (needed for the smooth damping effect to work)
  controls.update();

  // Animate selected earthquake (pulsing effect)
  if (selectedEarthquake) {
    // Create pulsing effect using sine wave
    const pulseScale = 1.5 + Math.sin(Date.now() * 0.005) * 0.2;
    selectedEarthquake.scale.set(pulseScale, pulseScale, pulseScale);
  }


  // Draw the scene from the camera's perspective onto the screen
  renderer.render(scene, camera);
}

// === HANDLE WINDOW RESIZE ===
// Makes sure the canvas stays full-screen if the user resizes their browser window
window.addEventListener('resize', () => {
  // Update camera to match new window shape
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();  // Apply the change to the camera

  // Update renderer to match new window size
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log('↔️ Window resized');
});

// === LOAD EARTHQUAKES ===
// This loads earthquake data and adds the markers to the globe
// We use .then() because loadEarthquakes is async (takes time to download data)
loadEarthquakes().then((earthquakeGroup) => {
  console.log('🎉 Earthquake visualization ready!');
});

// === SET UP CLICK LISTENERS ===
// Listen for clicks on the canvas
renderer.domElement.addEventListener('click', onMouseClick);
console.log('✓ Click listener added');

// Listen for close button clicks
document.getElementById('close-btn').addEventListener('click', (event) => {
  event.stopPropagation();  // Prevent click from triggering canvas click
  deselectEarthquake();
});
console.log('✓ Close button listener added');

// === START THE ANIMATION ===
console.log('🚀 Starting animation loop...');
animate();  // Call animate() for the first time then it loops itself
console.log('✨ The Earth should be spinning with earthquake markers now!');