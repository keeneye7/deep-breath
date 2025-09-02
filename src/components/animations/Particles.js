// src/components/animations/Particles.js
import { particlesCursor } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class ParticleAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.particleCursorInstance = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
        this.animationId = null;
        
        // 기본 설정
        this.config = {
            gpgpuSize: 512,
            colors: [0xaaaaaa, 0xcccccc],
            color: 0xbbbbbb,
            coordScale: 0.5,
            noiseIntensity: 0.0005,
            noiseTimeCoef: 0.00005,
            pointSize: 1,
            pointDecay: 0.000625,
            sleepRadiusX: 88.5,
            sleepRadiusY: 138.5,
            sleepTimeCoefX: 0.0005,
            sleepTimeCoefY: 0.001
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.particleCursorInstance = particlesCursor({
                el: this.container,
                ...this.config
            });

            await this.requestMicrophonePermission();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            this.start();
        } catch (error) {
            console.error('Failed to initialize Particle animation:', error);
            this.emit('error', error);
        }
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const microphone = this.audioContext.createMediaStreamSource(stream);

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 3; // 증가된 감도
            microphone.connect(gainNode);
            gainNode.connect(this.analyser);

            this.analyser.fftSize = 64;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.emit('microphoneConnected');
        } catch (error) {
            console.warn('Microphone access denied or failed:', error);
            this.emit('microphoneError', error);
        }
    }

    visualizeParticles() {
        if (!this.isInitialized || !this.analyser || !this.dataArray) return;

        this.animationId = requestAnimationFrame(() => this.visualizeParticles());

        this.analyser.getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // 호흡 데이터에 따른 파티클 조정
        const newCoordScale = 0.5 + (average / 128.0) * 1;
        const newNoiseIntensity = 0.0005 + (average / 128.0) * 0.002;
        const newPointSize = 1 + (average / 128.0) * 1;

        if (this.particleCursorInstance && this.particleCursorInstance.uniforms) {
            this.particleCursorInstance.uniforms.uCoordScale.value = newCoordScale;
            this.particleCursorInstance.uniforms.uNoiseIntensity.value = newNoiseIntensity;
            this.particleCursorInstance.uniforms.uPointSize.value = newPointSize;
        }

        // 호흡 데이터 이벤트 발생
        this.emit('breathingData', {
            averageRate: average,
            rawData: Array.from(this.dataArray)
        });
    }

    start() {
        if (this.isInitialized && !this.animationId) {
            this.visualizeParticles();
            this.emit('started');
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            this.emit('stopped');
        }
    }

    dispose() {
        this.stop();
        
        if (this.particleCursorInstance) {
            this.particleCursorInstance.dispose();
            this.particleCursorInstance = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isInitialized = false;
        this.emit('disposed');
    }

    // 설정 업데이트 메서드
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.particleCursorInstance) {
            // 런타임에서 업데이트 가능한 속성들
            Object.keys(newConfig).forEach(key => {
                if (this.particleCursorInstance.uniforms && this.particleCursorInstance.uniforms[`u${key.charAt(0).toUpperCase() + key.slice(1)}`]) {
                    this.particleCursorInstance.uniforms[`u${key.charAt(0).toUpperCase() + key.slice(1)}`].value = newConfig[key];
                }
            });
        }
        
        this.emit('configUpdated', this.config);
    }

    // 호흡 데이터에 반응하는 메서드
    updateBreathingData(breathingData) {
        if (!breathingData || !this.particleCursorInstance) return;

        const intensity = breathingData.averageRate / 128.0;
        
        this.updateConfig({
            coordScale: 0.5 + intensity * 1,
            noiseIntensity: 0.0005 + intensity * 0.002,
            pointSize: 1 + intensity * 1
        });
    }

    // 색상 변경 메서드
    setColors(colors) {
        this.config.colors = colors;
        if (this.particleCursorInstance) {
            // 색상 업데이트 로직 (threejs-toys 라이브러리에 따라 다를 수 있음)
            this.emit('colorsChanged', colors);
        }
    }

    // 파티클 크기 조정
    setPointSize(size) {
        this.updateConfig({ pointSize: size });
    }

    // 노이즈 강도 조정
    setNoiseIntensity(intensity) {
        this.updateConfig({ noiseIntensity: intensity });
    }
}
