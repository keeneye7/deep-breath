// particle.js

import { particlesCursor } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js';

let particleCursorInstance;
let audioContext, analyser, dataArray;

export function initializeParticles(container) {
    particleCursorInstance = particlesCursor({
        el: container,
        gpgpuSize: 512,
        colors: [0xaaaaaa, 0xcccccc],
        color: 0xbbbbbb,
        coordScale: 0.5,  // Halved
        noiseIntensity: 0.0005,  // Halved
        noiseTimeCoef: 0.00005,  // Halved
        pointSize: 1,
        pointDecay: 0.000625,  // Perishing speed halved
        sleepRadiusX: 88.5,  // Halved
        sleepRadiusY: 138.5,  // Halved
        sleepTimeCoefX: 0.0005,  // Halved
        sleepTimeCoefY: 0.001  // Halved
    });

    requestMicrophonePermission();
}

export function disposeParticles() {
    if (particleCursorInstance) {
        particleCursorInstance.dispose();
        particleCursorInstance = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

function requestMicrophonePermission() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3; // Increased sensitivity
        microphone.connect(gainNode);
        gainNode.connect(analyser);

        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        visualizeParticles();
    }).catch(function (err) {
        console.error('The following error occurred: ' + err);
    });
}

function visualizeParticles() {
    analyser.getByteFrequencyData(dataArray);

    // Use average frequency data to influence particle movement
    particleCursorInstance.uniforms.uCoordScale.value = 100 / 1024;  // Halved
    particleCursorInstance.uniforms.uNoiseIntensity.value = 1 / 2048;  // Halved
    particleCursorInstance.uniforms.uPointSize.value = 200  / 256;  // Particle size range halved
    
    // Update particles' noise time coefficient to create streamlined movement
    // particleCursorInstance.uniforms.uNoiseTimeCoef.value = 0.00005 + 1024 / 200000;  // Halved

    requestAnimationFrame(visualizeParticles);
}
