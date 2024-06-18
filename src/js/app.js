import * as THREE from 'three';
import { FBXLoader } from 'FBXLoader';
import { OrbitControls } from 'OrbitControls';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;  

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  
controls.dampingFactor = 0.05;

// Lighting setup
const light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(50, 50, 50);
scene.add(light);

// Load bg model
const loader = new FBXLoader();
loader.load('/src/models/universe.fbx', function (object) {
    const texture = new THREE.TextureLoader().load('/src/textures/universe.jpg');
    object.traverse(function (child) {
        if (child.isMesh) {
            child.material.map = texture;
            child.material.needsUpdate = true;  
        }
    });

    scene.add(object);
    animate();
}, undefined, function (error) {
    console.error('An error happened during the loading of the FBX model:', error);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}

// window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}