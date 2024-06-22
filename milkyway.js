// milkyway.js

import * as THREE from 'three';

let scene, camera, renderer, milkyWay;
let targetScale = 1;
const maxScale = 2;

let animationPhase = 0; // 0: normal, 1: circle, 2: gather, 3: spread
let animationTimer = 0;
const animationInterval = 4.5; // seconds
const circleRadius = 5;
const starCount = 25000;
const originalPositions = new Float32Array(starCount * 3);

export function initializeThreeJS(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create the Milky Way
    const milkyWayGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(200);
        const y = THREE.MathUtils.randFloatSpread(200);
        const z = THREE.MathUtils.randFloatSpread(200);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
    }

    milkyWayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const milkyWayMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01 });
    milkyWay = new THREE.Points(milkyWayGeometry, milkyWayMaterial);
    scene.add(milkyWay);

    camera.position.z = 15;

    animate();

    // Add event listeners for mouse move, click, and touch events
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchmove', onTouchMove, false);
    window.addEventListener('touchend', onTouchEnd, false);
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = 1 / 60; // Assuming 60 FPS
    animationTimer += deltaTime;

    if (animationTimer >= animationInterval) {
        animationTimer = 0;
        animationPhase = (animationPhase + 1) % 4;
    }

    const positions = milkyWay.geometry.attributes.position.array;
    const progress = animationTimer / animationInterval;

    switch (animationPhase) {
        case 0: // Normal
            updateNormalPositions(positions, progress);
            break;
        case 1: // Circle
            updateCirclePositions(positions, progress);
            break;
        case 2: // Gather
            updateGatherPositions(positions, progress);
            break;
        case 3: // Spread
            updateSpreadPositions(positions, progress);
            break;
    }

    milkyWay.geometry.attributes.position.needsUpdate = true;
    milkyWay.rotation.x += 0.0005;
    milkyWay.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

function updateNormalPositions(positions, progress) {
    const fallSpeed = 0.02 * targetScale;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= fallSpeed;
        if (positions[i + 1] < -100) {
            positions[i + 1] = 100;
        }
    }
}

function updateCirclePositions(positions, progress) {
    for (let i = 0; i < positions.length; i += 3) {
        const angle = (i / positions.length) * Math.PI * 2;
        const targetX = Math.cos(angle) * circleRadius;
        const targetY = Math.sin(angle) * circleRadius;
        const targetZ = 0;

        positions[i] = lerp(positions[i], targetX, progress);
        positions[i + 1] = lerp(positions[i + 1], targetY, progress);
        positions[i + 2] = lerp(positions[i + 2], targetZ, progress);
    }
}

function updateGatherPositions(positions, progress) {
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = lerp(positions[i], 0, progress);
        positions[i + 1] = lerp(positions[i + 1], 0, progress);
        positions[i + 2] = lerp(positions[i + 2], 0, progress);
    }
}

function updateSpreadPositions(positions, progress) {
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = lerp(positions[i], originalPositions[i], progress);
        positions[i + 1] = lerp(positions[i + 1], originalPositions[i + 1], progress);
        positions[i + 2] = lerp(positions[i + 2], originalPositions[i + 2], progress);
    }
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function setTargetScale(scale) {
    targetScale = scale;
}

export function getMaxScale() {
    return maxScale;
}

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function onMouseDown(event) {
    isDragging = true;
}

function onMouseUp(event) {
    isDragging = false;
    previousMousePosition = { x: 0, y: 0 };
}

function onMouseMove(event) {
    if (!isDragging) {
        return;
    }

    const deltaMove = {
        x: event.offsetX - previousMousePosition.x,
        y: event.offsetY - previousMousePosition.y
    };

    camera.position.x -= deltaMove.x * 0.01;
    camera.position.y += deltaMove.y * 0.01;
    camera.lookAt(scene.position);

    previousMousePosition = {
        x: event.offsetX,
        y: event.offsetY
    };
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
}

function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) {
        return;
    }

    const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y
    };

    camera.position.x -= deltaMove.x * 0.01;
    camera.position.y += deltaMove.y * 0.01;
    camera.lookAt(scene.position);

    previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    };
}

function onTouchEnd(event) {
    isDragging = false;
    previousMousePosition = { x: 0, y: 0 };
}