import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
const gui = new dat.GUI();
gui.width = 360;

let continuePhysics = true; 
let timeStep = 0.0001;
let defaultTrailLimit = 500;
let G = 6.67430e-11 * 1e-10;  
let focusedBody = null;
let velocityRangeStart = 2000;
let velocityRangeEnd = 12500;
let positionRangeStart = 0;
let positionRangeEnd = 700;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera
(75, window.innerWidth / window.innerHeight, 0.1, 12000);
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
controls.maxDistance = 750;
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
const bgGeometry = new THREE.SphereGeometry(5000, 60, 40);
const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide
});
const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgSphere);

// Window resize handler
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// helper functions
function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomVector3InRange(min, max) {
    return new THREE.Vector3(
        getRandomInRange(min, max),
        getRandomInRange(min, max),
        getRandomInRange(min, max)
    );
}   

const celestialBodies = [
    {
        type: 'star',
        focus: false,
        mass: 2e30,

        initialPosition: null,
        randomInitialPosition: true,
        position: null,
        
        initialVelocity: null,
        randomInitialVelocity: true,
        velocity: null,
        
        mesh: null,
        light: null,
        trailPositions: [],
        trailLimit: defaultTrailLimit,
        trailLine: null,
    },
    {
        type: 'star',
        focus: false,
        mass: 9e30,

        initialPosition: null,
        randomInitialPosition: true,
        position: null,
        
        initialVelocity: null,
        randomInitialVelocity: true,
        velocity: null,
        
        mesh: null,
        light: null,
        trailPositions: [],
        trailLimit: defaultTrailLimit,
        trailLine: null,
    },
    {
        type: 'star',
        focus: false,
        mass: 5e30,

        initialPosition: null,
        randomInitialPosition: true,
        position: null,
        
        initialVelocity: null,
        randomInitialVelocity: true,
        velocity: null,
        
        mesh: null,
        light: null,
        trailPositions: [],
        trailLimit: defaultTrailLimit,
        trailLine: null,
    },
    {
        type: 'planet',
        focus: false,
        mass: 5e18,
        
        initialPosition: null,
        randomInitialPosition: true,
        position: null,

        initialVelocity: null,
        randomInitialVelocity: true,
        velocity: null,
        mesh: null,
        light: null,
        trailPositions: [],
        trailLimit: defaultTrailLimit,
        trailLine: null,
    },
];

const starGeometry = new THREE.SphereGeometry(5, 32, 32);
const planetGeometry = new THREE.SphereGeometry(2, 32, 32);

const starTexture1 = loader.load('/src/textures/star1.png');
const starMaterial = new THREE.MeshBasicMaterial({
    map: starTexture1,
});

const planetTexture1 = loader.load('/src/textures/mercury.jpg');
const planetMaterial = new THREE.MeshBasicMaterial({
    map: planetTexture1,
});

celestialBodies.forEach(body => {
    // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    body.initialPosition = getRandomVector3InRange(positionRangeStart, positionRangeEnd);
    body.initialVelocity = getRandomVector3InRange(velocityRangeStart, velocityRangeEnd);

    body.velocity = body.initialVelocity.clone();
    body.position = body.initialPosition.clone();

    let bodyGeometry = body.type === 'star' ? starGeometry : planetGeometry;

    let bodyMaterial = body.type === 'star' ? starMaterial : planetMaterial;

    body.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.mesh.scale.set(1, 1, 1);
    body.mesh.position.copy(body.position);

    // Create a point light for each star
    body.light = new THREE.PointLight(0xffff00, 1, 500);
    body.light.position.copy(body.position);

    scene.add(body.mesh);
    scene.add(body.light);


});

function calculateGeometricCenter() {
    let sumPosition = new THREE.Vector3(0, 0, 0);

    celestialBodies.forEach(body => {
        sumPosition.add(body.position);  // add up all positions
    });

    sumPosition.divideScalar(celestialBodies.length);  // Divide by the number of bodies to get the average

    return sumPosition;
}

function updatePhysics() {
    if (!continuePhysics) return;  // stop physics if collision detected

    let force, distanceVector, distance, forceMagnitude;

    celestialBodies.forEach(body => {
        body.force = new THREE.Vector3(0, 0, 0);

        celestialBodies.forEach(other => {
            if (body !== other) {
                distanceVector = new THREE.Vector3().subVectors(other.position, body.position);
                distance = distanceVector.length();

                let bodyRadius = body.type === 'star' ? 5 : 2;
                let otherRadius = other.type === 'star' ? 5 : 2;
                const collisionDistance = bodyRadius + otherRadius;

                // Check for collision
                if (distance <= collisionDistance) {  
                    continuePhysics = false;
                    console.log("Collision detected between", body.type, "and", other.type, ", physics stopped.");
                }

                forceMagnitude = (G * body.mass * other.mass) / (distance * distance);
                force = distanceVector.normalize().multiplyScalar(forceMagnitude);
                body.force.add(force);
            }
        });
    });

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

function handleFocusChange(bodyToFocus) {

    if (isHandlingFocusChange) return;

    if (bodyToFocus === null) {
        focusedBody = null;
        updateCameraFocus();
        return;
    }

    isHandlingFocusChange = true;

    console.log("Focus changed to: ", bodyToFocus);
    for (let i = 0; i < celestialBodies.length; i++) {
        const body = celestialBodies[i];
        if (body !== bodyToFocus) {
            body.focus = false;
            focusedBody = null;
            controllers.focusControllers[i].setValue(false).updateDisplay();
        }
        else {
            body.focus = true;
            focusedBody = body;
            controllers.focusControllers[i].setValue(true).updateDisplay();
            for (let j = i + 1; j < celestialBodies.length; j++) {
                controllers.focusControllers[j].setValue(false).updateDisplay();
                celestialBodies[j].focus = false;
            }
            break;
        }
    }
    updateCameraFocus();
    isHandlingFocusChange = false;
}

let isHandlingFocusChange = false; // Flag to prevent recursive calls

function updateCameraFocus() {
    if (focusedBody !== null) {
        bgSphere.position.copy(focusedBody.position);
        controls.target.set(focusedBody.position.x, focusedBody.position.y, focusedBody.position.z);
    } else {
        const geometricCenter = calculateGeometricCenter();
        bgSphere.position.copy(geometricCenter);
        controls.target.set(geometricCenter.x, geometricCenter.y, geometricCenter.z);
    }
}

function animate() {

    updatePhysics();

    createTrailGeometry();

    updateCameraFocus();

    controls.update();
    
    renderer.render(scene, camera);
}

renderer.setAnimationLoop( animate );

function startSimulation() {
    continuePhysics = true;
}

function pauseSimulation() {
    continuePhysics = false;
}

function restartSimulation() {
    continuePhysics = true;
    celestialBodies.forEach(body => {

        if (body.randomInitialPosition) {
            body.initialPosition = getRandomVector3InRange(positionRangeStart, positionRangeEnd);
        } 

        if (body.randomInitialVelocity) {
            body.initialVelocity = getRandomVector3InRange(velocityRangeStart, velocityRangeEnd);
        }

        body.position = body.initialPosition.clone();
        body.velocity = body.initialVelocity.clone();

        controllers.velocityControllers.forEach((ctrlGroup, index) => {
            if (celestialBodies[index]) {
                ctrlGroup.vx.setValue(celestialBodies[index].initialVelocity.x).updateDisplay();
                ctrlGroup.vy.setValue(celestialBodies[index].initialVelocity.y).updateDisplay();
                ctrlGroup.vz.setValue(celestialBodies[index].initialVelocity.z).updateDisplay();
            }
        });
    
        controllers.positionControllers.forEach((ctrlGroup, index) => {
            if (celestialBodies[index]) {
                ctrlGroup.px.setValue(celestialBodies[index].position.x).updateDisplay();
                ctrlGroup.py.setValue(celestialBodies[index].position.y).updateDisplay();
                ctrlGroup.pz.setValue(celestialBodies[index].position.z).updateDisplay();
            }
        });

        body.mesh.position.copy(body.position);
        body.light.position.copy(body.position);
        body.trailPositions = [];
    });
}

function updateAllTrails() {
    celestialBodies.forEach(body => {
        while (body.trailPositions.length > body.trailLimit) {
            body.trailPositions.shift();
        }
        createTrailGeometry();
    });
}

function createTrailGeometry() {
    celestialBodies.forEach(body => {
        if (body.trailLine) {
            scene.remove(body.trailLine);
        }
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const geometry = new THREE.BufferGeometry().setFromPoints(body.trailPositions);
        body.trailLine = new THREE.Line(geometry, material);
        scene.add(body.trailLine);
    });
}

const simulationControls = gui.addFolder('Simulation Controls');

simulationControls.add({startSimulation}, 'startSimulation').name("Start Simulation");
simulationControls.add({pauseSimulation}, 'pauseSimulation').name("Pause Simulation");
simulationControls.add({restartSimulation}, 'restartSimulation').name("Restart Simulation");
simulationControls.add({timeStep}, 'timeStep', 0.000005, 0.0003).name('Time Speed').onChange(value => {
    timeStep = value;
    console.log("New timeStep: ", timeStep);
});
simulationControls.add({G}, 'G', 6.67430e-11 * 1e-11, 6.67430e-11 ).name('Gravitational Constant');
simulationControls.open();

const celestialBodySettings = gui.addFolder('Celestial Body Settings');

celestialBodySettings.add({defaultTrailLimit}, 'defaultTrailLimit', 0, 1500).name('Trail limit').onChange(value => {
    defaultTrailLimit = value;
    // createTrailGeometry();
    celestialBodies.forEach(body => {
        body.trailLimit = value; // Update trail limit for each body
    });
    updateAllTrails();
    console.log("New trail limit: ", defaultTrailLimit);
});


let controllers = {
    velocityControllers: [],
    positionControllers: [],
    focusControllers: []
};

celestialBodies.forEach((body, index) => {
    const bodyFolder = celestialBodySettings.addFolder(`Body ${index + 1} - ${body.type}`);
    
    bodyFolder.add(body, 'mass', 1e15, 1e31).name('Mass');

    let vx = bodyFolder.add(body.initialVelocity, 'x', velocityRangeStart, velocityRangeEnd).name('Initial velocity (x)');
    let vy = bodyFolder.add(body.initialVelocity, 'y', velocityRangeStart, velocityRangeEnd).name('Initial velocity (y)');
    let vz = bodyFolder.add(body.initialVelocity, 'z', velocityRangeStart, velocityRangeEnd).name('Initial velocity (z)');

    vx.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
    vy.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
    vz.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";

    bodyFolder.add(body, 'randomInitialVelocity').name('Random initial velocities').onChange(value => {
        if (value) {
            vx.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
            vy.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
            vz.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
        } else {
            vx.__li.style = "";
            vy.__li.style = "";
            vz.__li.style = "";
        }
    });

    controllers.velocityControllers.push({ vx, vy, vz });

    let px = bodyFolder.add(body.initialPosition, 'x', positionRangeStart, positionRangeEnd).name('Initial position (x)');
    let py = bodyFolder.add(body.initialPosition, 'y', positionRangeStart, positionRangeEnd).name('Initial position (y)');
    let pz = bodyFolder.add(body.initialPosition, 'z', positionRangeStart, positionRangeEnd).name('Initial position (z)');

    px.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
    py.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
    pz.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
    
    bodyFolder.add(body, 'randomInitialPosition').name('Random initial position').onChange(value => {
        if (value) {
            px.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
            py.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
            pz.__li.style = "opacity: 0.5; filter: grayscale(100%) blur(0.5px); pointer-events: none;";
        } else {
            px.__li.style = "";
            py.__li.style = "";
            pz.__li.style = "";
        }
    });

    controllers.positionControllers.push({ px, py, pz });

    let focusC = bodyFolder.add(body, 'focus').name('Focus').onChange(() => handleFocusChange(body));
    
    controllers.focusControllers.push(focusC);

    bodyFolder.open();
});
celestialBodySettings.open(); 

// todo:
// - Save and load congifurations
// - Add/remove celestial bodies dynamically
// - 
