import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera
(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.fov = 75;
camera.position.set(0, 0, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the origin
camera.updateProjectionMatrix();

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0;
controls.maxDistance = 450;
controls.target.set(0, 0, -200);
controls.update();

// Lighting setup
const light = new THREE.PointLight(0xffffff, 1.5, 10000);
light.position.set(50, 50, 50);
scene.add(light);

// Universe texture
const loader = new THREE.TextureLoader();
const bgTexture = loader.load('/src/textures/universe2.jpg');

// Sphere setup
const bgGeometry = new THREE.SphereGeometry(1000, 60, 40);
const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide
});
const sphere = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(sphere);

// Window resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

const celestialBodies = [
    {
        mass: 1.989e30,
        position: new THREE.Vector3(
            getRandomInRange(0, 200),
            getRandomInRange(0, 200),
            getRandomInRange(0, 200)
        ),
        velocity: new THREE.Vector3(600, 0, 0),
        mesh: null,
        light: null,
        trailPositions: null,
        trailLimit: null,
    },
    {
        mass: 5.972e24,
        position: new THREE.Vector3(
            getRandomInRange(0, 200),
            getRandomInRange(0, 200),
            getRandomInRange(0, 200)
        ),
        velocity: new THREE.Vector3(0, 10000, 0),
        mesh: null,
        light: null,
        trailPositions: null,
        trailLimit: null,
    },
];

const starGeometry = new THREE.SphereGeometry(5, 32, 32);  // Size of the stars

const starTexture1 = loader.load('/src/textures/star1.png');
const starMaterial = new THREE.MeshBasicMaterial({
    map: starTexture1,
});

celestialBodies.forEach(body => {
    // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    body.mesh = new THREE.Mesh(starGeometry, starMaterial);
    body.mesh.scale.set(1, 1, 1);
    body.mesh.position.copy(body.position);

    // Create a point light for each star
    body.light = new THREE.PointLight(0xffff00, 1, 500);
    body.light.position.copy(body.position);

    scene.add(body.mesh);
    scene.add(body.light);

    body.trailPositions = []; // store positions for trail
    body.trailLimit = 5000; // limit the number of points in the trail
});

function calculateGeometricCenter() {
    let sumPosition = new THREE.Vector3(0, 0, 0);

    celestialBodies.forEach(body => {
        sumPosition.add(body.position);  // add up all positions
    });

    sumPosition.divideScalar(celestialBodies.length);  // Divide by the number of bodies to get the average

    return sumPosition;
}



let continuePhysics = true; 

function updatePhysics() {
    if (!continuePhysics) return;  // stop physics if collision detected

    const G = 6.67430e-11 * 1e-10;  // Gravitational constant (scaled down)
    let force, distanceVector, distance, forceMagnitude;

    celestialBodies.forEach(body => {
        body.force = new THREE.Vector3(0, 0, 0);

        celestialBodies.forEach(other => {
            if (body !== other) {
                distanceVector = new THREE.Vector3().subVectors(other.position, body.position);
                distance = distanceVector.length();

                // Check for collision
                if (distance <= 10) {  
                    continuePhysics = false;
                    // console.log("Collision detected, physics stopped.");
                }

                forceMagnitude = (G * body.mass * other.mass) / (distance * distance);
                force = distanceVector.normalize().multiplyScalar(forceMagnitude);
                body.force.add(force);
            }
        });
    });

    const timeStep = 0.0001;  // Reduced time step to slow down the simulation
    celestialBodies.forEach(body => {
        let acceleration = body.force.divideScalar(body.mass);
        body.velocity.add(acceleration.multiplyScalar(timeStep));  // Apply scaled time step
        body.position.add(body.velocity.clone().multiplyScalar(timeStep));  // Apply scaled time step
        
        body.trailPositions.push(body.mesh.position.clone());
        if (body.trailPositions.length > body.trailLimit) {
            body.trailPositions.shift();  // Remove the oldest position
        }
        
        body.mesh.position.copy(body.position);
        body.light.position.copy(body.position);
    });


}

function createTrailGeometry() {
    celestialBodies.forEach(body => {
        if (body.trail) {
            scene.remove(body.trail); // remove the old trail
        }
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const geometry = new THREE.BufferGeometry().setFromPoints(body.trailPositions);
        body.trail = new THREE.Line(geometry, material);
        scene.add(body.trail);
    });
}

function animate() {

    requestAnimationFrame(animate);

    updatePhysics();

    createTrailGeometry();

    const geometricCenter = calculateGeometricCenter();

    // // Adjust camera position
    // camera.position.x = geometricCenter.x + 200;
    // camera.position.y = geometricCenter.y + 200;
    // camera.position.z = geometricCenter.z + 200;
    // camera.lookAt(geometricCenter);
    controls.target.set(geometricCenter.x, geometricCenter.y, geometricCenter.z);

    controls.update();
    
    renderer.render(scene, camera);
}

animate();


