import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 1);  // Mueve la cámara un poco hacia atrás

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting setup
const light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(50, 50, 50);
scene.add(light);

// Universe texture
const loader = new THREE.TextureLoader();
const texture = loader.load('/src/textures/universe3.jpg');  // Asegúrate de que la ruta es correcta

// Sphere setup
const geometry = new THREE.SphereGeometry(500, 60, 40);
const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Window resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();