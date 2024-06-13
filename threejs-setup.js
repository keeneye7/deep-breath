let scene, camera, renderer, milkyWay;
let targetScale = 1;
const maxScale = 2;

function initializeThreeJS(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create the Milky Way
    const milkyWayGeometry = new THREE.BufferGeometry();
    const starCount = 14000; // Keep the star count as previously set
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
}

function animate() {
    requestAnimationFrame(animate);

    // Milky Way animation
    const positions = milkyWay.geometry.attributes.position.array;
    const fallSpeed = 0.08 * targetScale; // Keep the faster fall speed

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

function setTargetScale(scale) {
    targetScale = scale;
}

function getMaxScale() {
    return maxScale;
}
