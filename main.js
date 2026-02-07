// === IMPORT THREE.JS ===
import * as THREE from 'three';

// OrbitControls lets user rotate the globe with their mouse
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

console.log('🌍 Starting Earth Globe setup...');

// === CREATE 3D WORLD (Scene) ===
// This is where everything in 3D space will live - like a stage for actors
const scene = new THREE.Scene();
console.log('✓ 3D world (scene) created');

// === CREATE THE CAMERA ===
// This is like your eyes - it determines what you see
const camera = new THREE.PerspectiveCamera(
  75,                                    // How wide you can see (in degrees) - like peripheral vision
  window.innerWidth / window.innerHeight, // Match screen shape (width/height ratio)
  0.1,                                   // Closest you can see (anything closer is invisible)
  1000                                   // Farthest you can see (anything farther is invisible)
);
camera.position.z = 12;  // Move camera back 15 units so we can see the Earth
console.log('✓ Camera created at distance:', camera.position.z);

// === CREATE THE RENDERER ===
// This draws everything onto your screen - like a painter creating the image
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

// The appearance (Earth texture from NASA)
// This is a real satellite image of Earth - free to use from NASA
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
// Think of this like light bouncing around from all directions
const ambientLight = new THREE.AmbientLight(
  0xffffff,  // White light
  0.8        // Dim brightness (just enough to see the dark side)
);
scene.add(ambientLight);
console.log('✓ Lighting added (sun + ambient)');

// === ADD MOUSE CONTROLS ===
// This lets you drag to rotate and scroll to zoom
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // Smooth, inertia-like movement (feels natural)
controls.dampingFactor = 0.05;      // How much smoothing (lower = more inertia)
controls.minDistance = 8;           // Closest you can zoom (don't go inside the Earth!)
controls.maxDistance = 30;          // Farthest you can zoom out
console.log('✓ Mouse controls enabled (drag to rotate, scroll to zoom)');

// === ANIMATION LOOP ===
// This function runs about 60 times per second to create smooth animation
const rotationSpeed = 0.001;  // How fast the Earth auto-rotates (lower = slower)

function animate() {
  // Schedule this function to run again on the next frame
  // This creates a loop: animate -> next frame -> animate -> next frame...
  requestAnimationFrame(animate);

  // Auto-rotate the Earth slowly around the Y axis (vertical axis through poles)
  earthGlobe.rotation.y += rotationSpeed;

  // Update controls (needed for the smooth damping effect to work)
  controls.update();

  // Draw the scene from the camera's perspective onto the screen
  renderer.render(scene, camera);
}

// === HANDLE WINDOW RESIZE ===
// Make sure the canvas stays full-screen if the user resizes their browser window
window.addEventListener('resize', () => {
  // Update camera to match new window shape
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();  // Apply the change to the camera

  // Update renderer to match new window size
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log('↔️ Window resized');
});

// === START THE ANIMATION ===
console.log('🚀 Starting animation loop...');
animate();  // Call animate() for the first time - then it loops itself
console.log('✨ Setup complete! The Earth should be spinning now.');
console.log('💡 Try these experiments:');
console.log('   - Change earthRadius to 10 and refresh');
console.log('   - Change rotationSpeed to 0.005 to spin faster');
console.log('   - Change camera.position.z to 25 to zoom out');