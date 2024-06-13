document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('container');
    const visualizer = document.getElementById('visualizer');
    const audioElement = document.getElementById('background-music');
    const volumeControl = document.getElementById('volume-control');

    // Set initial volume
    audioElement.volume = volumeControl.value;

    volumeControl.addEventListener('input', function() {
        audioElement.volume = this.value;
    });

    // Play the audio after user interaction
    document.body.addEventListener('click', function() {
        if (audioElement.paused) {
            audioElement.play();
        }
    });

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();
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
    let milkyWay = new THREE.Points(milkyWayGeometry, milkyWayMaterial);
    scene.add(milkyWay); // Set Milky Way as the default animation

    camera.position.z = 15;

    let targetScale = 1;
    const easing = 0.05;
    const maxScale = 2;

    // Create visualizer bars
    const barCount = 32; // Reduce the number of bars for smaller visualization
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }

    const bars = document.getElementsByClassName('bar');

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

    animate();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        // Increase the gain to amplify the input signal
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3; // Increased sensitivity
        microphone.connect(gainNode);
        gainNode.connect(analyser);

        analyser.fftSize = 64; // Reduce the fft size for smaller visualization

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function visualizeBreathing() {
            analyser.getByteFrequencyData(dataArray);

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 4; // Make the bars smaller
                if (bars[i]) {
                    bars[i].style.height = `${barHeight}px`;
                    bars[i].style.opacity = 0.5 + barHeight / 50;
                }
            }

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            targetScale = 1 + (average / 128.0) * maxScale; // Normalize the breathing level and adjust target scale

            requestAnimationFrame(visualizeBreathing);
        }

        visualizeBreathing();
    }).catch(function (err) {
        console.error('The following error occurred: ' + err);
    });
});
