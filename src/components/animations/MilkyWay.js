// src/components/animations/MilkyWay.js
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class MilkyWayAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.milkyWay = null;
        this.targetScale = 1;
        this.maxScale = 2;
        this.animationPhase = 0;
        this.animationTimer = 0;
        this.animationInterval = 4.5;
        this.circleRadius = 5;
        this.starCount = 25000;
        this.originalPositions = new Float32Array(this.starCount * 3);
        this.isInitialized = false;
        this.animationId = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            this.createMilkyWay();
            this.setupEventListeners();
            this.camera.position.z = 15;
            
            this.isInitialized = true;
            this.emit('initialized');
            
            this.start();
        } catch (error) {
            console.error('Failed to initialize MilkyWay animation:', error);
            this.emit('error', error);
        }
    }

    createMilkyWay() {
        const milkyWayGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starCount * 3);

        for (let i = 0; i < this.starCount; i++) {
            const x = THREE.MathUtils.randFloatSpread(200);
            const y = THREE.MathUtils.randFloatSpread(200);
            const z = THREE.MathUtils.randFloatSpread(200);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            this.originalPositions[i * 3] = x;
            this.originalPositions[i * 3 + 1] = y;
            this.originalPositions[i * 3 + 2] = z;
        }

        milkyWayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const milkyWayMaterial = new THREE.PointsMaterial({ 
            color: 0xffffff, 
            size: 0.01,
            transparent: true,
            opacity: 0.8
        });
        
        this.milkyWay = new THREE.Points(milkyWayGeometry, milkyWayMaterial);
        this.scene.add(this.milkyWay);
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        const deltaTime = 1 / 60;
        this.animationTimer += deltaTime;

        if (this.animationTimer >= this.animationInterval) {
            this.animationTimer = 0;
            this.animationPhase = (this.animationPhase + 1) % 4;
            this.emit('phaseChanged', this.animationPhase);
        }

        const positions = this.milkyWay.geometry.attributes.position.array;
        const progress = this.animationTimer / this.animationInterval;

        switch (this.animationPhase) {
            case 0:
                this.updateNormalPositions(positions, progress);
                break;
            case 1:
                this.updateCirclePositions(positions, progress);
                break;
            case 3:
                this.updateSpreadPositions(positions, progress);
                break;
        }

        this.milkyWay.geometry.attributes.position.needsUpdate = true;
        this.milkyWay.rotation.x += 0.0005;
        this.milkyWay.rotation.y += 0.0005;

        this.renderer.render(this.scene, this.camera);
    }

    updateNormalPositions(positions, progress) {
        const fallSpeed = 0.02 * this.targetScale;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= fallSpeed;
            if (positions[i + 1] < -100) {
                positions[i + 1] = 100;
            }
        }
    }

    updateCirclePositions(positions, progress) {
        for (let i = 0; i < positions.length; i += 3) {
            const angle = (i / positions.length) * Math.PI * 2;
            const targetX = Math.cos(angle) * this.circleRadius;
            const targetY = Math.sin(angle) * this.circleRadius;
            const targetZ = 0;

            positions[i] = this.lerp(positions[i], targetX, progress);
            positions[i + 1] = this.lerp(positions[i + 1], targetY, progress);
            positions[i + 2] = this.lerp(positions[i + 2], targetZ, progress);
        }
    }

    updateSpreadPositions(positions, progress) {
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = this.lerp(positions[i], this.originalPositions[i], progress);
            positions[i + 1] = this.lerp(positions[i + 1], this.originalPositions[i + 1], progress);
            positions[i + 2] = this.lerp(positions[i + 2], this.originalPositions[i + 2], progress);
        }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    setTargetScale(scale) {
        this.targetScale = Math.min(scale, this.maxScale);
        this.emit('scaleChanged', this.targetScale);
    }

    getMaxScale() {
        return this.maxScale;
    }

    setupEventListeners() {
        this.handleResize = () => {
            if (!this.camera || !this.renderer) return;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', this.handleResize);
    }

    start() {
        if (this.isInitialized && !this.animationId) {
            this.animate();
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
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        if (this.milkyWay) {
            this.milkyWay.geometry.dispose();
            this.milkyWay.material.dispose();
        }

        window.removeEventListener('resize', this.handleResize);
        
        this.isInitialized = false;
        this.emit('disposed');
    }

    // 호흡 데이터에 반응하는 메서드
    updateBreathingData(breathingData) {
        if (breathingData && breathingData.averageRate) {
            const scale = 1 + (breathingData.averageRate / 128.0) * this.maxScale;
            this.setTargetScale(scale);
        }
    }
}
