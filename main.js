// main.js

import { initializeThreeJS, setTargetScale, getMaxScale } from './milkyway.js';
import { initializeParticles, disposeParticles } from './particle.js';

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('container');
    const visualizer = document.getElementById('visualizer');
    const audioElement = document.getElementById('background-music');
    const volumeControl = document.getElementById('volume-control');

    // Get the current animation state from local storage
    let currentAnimation = localStorage.getItem('currentAnimation') || 'milkyway';

    // Toggle animation
    if (currentAnimation === 'milkyway') {
        initializeThreeJS(container);
        localStorage.setItem('currentAnimation', 'particles');
    } else {
        initializeParticles(container);
        localStorage.setItem('currentAnimation', 'milkyway');
    }

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

    const barCount = 32; // Reduce the number of bars for smaller visualization
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }

    const bars = document.getElementsByClassName('bar');

    // Request microphone permission
    function requestMicrophonePermission() {
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

                setTargetScale(1 + (average / 128.0) * getMaxScale()); // Normalize the breathing level and adjust target scale

                requestAnimationFrame(visualizeBreathing);
            }

            visualizeBreathing();
        }).catch(function (err) {
            console.error('The following error occurred: ' + err);
        });
    }

    // Check for microphone permission
    navigator.permissions.query({ name: 'microphone' }).then(function(permissionStatus) {
        if (permissionStatus.state === 'granted') {
            requestMicrophonePermission();
        } else if (permissionStatus.state === 'prompt') {
            requestMicrophonePermission();
        } else {
            console.warn('Microphone access has been denied.');
        }
        permissionStatus.onchange = function() {
            if (this.state === 'granted') {
                requestMicrophonePermission();
            }
        };
    });
});
