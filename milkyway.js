// milkyway.js

let scene, camera, renderer, milkyWay;
let targetScale = 1;
const maxScale = 2;

export function initializeThreeJS(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create the Milky Way
    const milkyWayGeometry = new THREE.BufferGeometry();
    const starCount = 25000; // Keep the star count as previously set
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = THREE.MathUtils.randFloatSpread(200);
        positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(200);
        positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(200);
    }

    milkyWayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const milkyWayMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01 });
    milkyWay = new THREE.Points(milkyWayGeometry, milkyWayMaterial);
    scene.add(milkyWay); // Set Milky Way as the default animation

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

    // Milky Way animation
    const positions = milkyWay.geometry.attributes.position.array;
    const fallSpeed = 0.02 * targetScale; // Keep the faster fall speed

    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= fallSpeed;
        if (positions[i + 1] < -100) {
            positions[i + 1] = 100;
        }
    }

    milkyWay.geometry.attributes.position.needsUpdate = true;
    milkyWay.rotation.x += 0.0005;
    milkyWay.rotation.y += 0.0005;

    renderer.render(scene, camera);
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
