document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('container');
    const audioElement = document.getElementById('background-music');

    audioElement.play();

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    let geometry = new THREE.SphereGeometry(5, 32, 32);
    let material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    let points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 10;

    function animate() {
        requestAnimationFrame(animate);

        points.rotation.x += 0.005;
        points.rotation.y += 0.005;

        renderer.render(scene, camera);
    }

    animate();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function visualizeBreathing() {
            analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            const scale = average / 128.0; // Normalize the breathing level
            points.scale.set(scale, scale, scale);

            requestAnimationFrame(visualizeBreathing);
        }

        visualizeBreathing();
    }).catch(function (err) {
        console.error('The following error occurred: ' + err);
    });
});
