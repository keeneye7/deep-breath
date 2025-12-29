// src/components/animations/FlowField.js - Flow Field Particle Animation
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class FlowFieldAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.particleCount = 10000;
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        this.intensity = 1.0;
        this.flowSpeed = 0.02;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            this.createFlowField();
            this.setupEventListeners();
            this.camera.position.z = 50;

            this.isInitialized = true;
            this.emit('initialized');
            this.start();

        } catch (error) {
            console.error('Failed to initialize FlowField animation:', error);
            this.emit('error', error);
        }
    }

    createFlowField() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        // Initialize particles
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Random initial positions
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;

            // Initialize velocities
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;

            // Gradient colors (cyan to purple)
            const t = i / this.particleCount;
            colors[i3] = 0.3 + t * 0.4;     // R
            colors[i3 + 1] = 0.6 - t * 0.3; // G
            colors[i3 + 2] = 0.9 + t * 0.1; // B
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // Perlin-like noise function for flow field
    noise3D(x, y, z) {
        // Simplified 3D noise using sine waves
        return Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1);
    }

    getFlowVector(x, y, z, time) {
        // Create a 3D flow field using noise
        const scale = 0.05;
        const timeScale = 0.5;

        const noiseX = this.noise3D(x * scale, y * scale, z * scale + time * timeScale);
        const noiseY = this.noise3D(x * scale + 100, y * scale, z * scale + time * timeScale);
        const noiseZ = this.noise3D(x * scale, y * scale + 100, z * scale + time * timeScale);

        return new THREE.Vector3(
            Math.cos(noiseX * Math.PI * 2),
            Math.sin(noiseY * Math.PI * 2),
            Math.cos(noiseZ * Math.PI * 2)
        );
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.geometry.attributes.velocity.array;

        // Update particle positions based on flow field
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            // Get flow vector at current position
            const flow = this.getFlowVector(x, y, z, this.time);

            // Apply flow to velocity with intensity
            velocities[i3] += flow.x * this.flowSpeed * this.intensity;
            velocities[i3 + 1] += flow.y * this.flowSpeed * this.intensity;
            velocities[i3 + 2] += flow.z * this.flowSpeed * this.intensity;

            // Apply damping
            velocities[i3] *= 0.95;
            velocities[i3 + 1] *= 0.95;
            velocities[i3 + 2] *= 0.95;

            // Update positions
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];

            // Wrap around boundaries
            const boundary = 50;
            if (Math.abs(positions[i3]) > boundary) {
                positions[i3] = (Math.random() - 0.5) * boundary;
            }
            if (Math.abs(positions[i3 + 1]) > boundary) {
                positions[i3 + 1] = (Math.random() - 0.5) * boundary;
            }
            if (Math.abs(positions[i3 + 2]) > boundary) {
                positions[i3 + 2] = (Math.random() - 0.5) * boundary;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;

        // Rotate view slowly
        this.camera.position.x = Math.sin(this.time * 0.1) * 60;
        this.camera.position.y = Math.cos(this.time * 0.08) * 40;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    updateBreathingData(data) {
        if (data && data.averageRate) {
            // Adjust flow intensity based on breathing
            this.intensity = 0.5 + (data.averageRate / 128.0) * 1.5;
            this.flowSpeed = 0.01 + (data.averageRate / 255.0) * 0.03;

            // Adjust particle size
            if (this.particles) {
                this.particles.material.size = 0.2 + (data.averageRate / 255.0) * 0.4;
            }
        }
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

        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        window.removeEventListener('resize', this.handleResize);
        this.isInitialized = false;
        this.emit('disposed');
    }
}
