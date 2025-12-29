// src/components/animations/Nebula.js - Nebula Cloud Animation
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class NebulaAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudLayers = [];
        this.stars = null;
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        this.intensity = 1.0;
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

            this.createNebula();
            this.createStarfield();
            this.setupEventListeners();
            this.camera.position.z = 30;

            this.isInitialized = true;
            this.emit('initialized');
            this.start();

        } catch (error) {
            console.error('Failed to initialize Nebula animation:', error);
            this.emit('error', error);
        }
    }

    createNebula() {
        // Create multiple cloud layers with different colors
        const colors = [
            { color: 0xff006e, opacity: 0.15 }, // Pink
            { color: 0x8338ec, opacity: 0.12 }, // Purple
            { color: 0x3a86ff, opacity: 0.18 }, // Blue
            { color: 0x06ffa5, opacity: 0.10 }  // Cyan
        ];

        colors.forEach((colorData, index) => {
            const geometry = new THREE.SphereGeometry(15 + index * 3, 32, 32);

            // Create custom shader material for nebula effect
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(colorData.color) },
                    opacity: { value: colorData.opacity }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float opacity;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    // Simplifed noise function
                    float noise(vec3 p) {
                        return sin(p.x * 0.5 + time) * cos(p.y * 0.5 + time) * sin(p.z * 0.5);
                    }
                    
                    void main() {
                        vec3 pos = vPosition * 0.1;
                        float n = noise(pos + time * 0.1);
                        float alpha = opacity * (0.5 + 0.5 * n);
                        
                        // Create wispy edges
                        float edge = 1.0 - length(vUv - 0.5) * 2.0;
                        alpha *= smoothstep(0.0, 1.0, edge);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const cloud = new THREE.Mesh(geometry, material);
            cloud.userData.rotationSpeed = (Math.random() - 0.5) * 0.001;
            cloud.userData.index = index;

            this.scene.add(cloud);
            this.cloudLayers.push(cloud);
        });
    }

    createStarfield() {
        const starCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;

            // Random positions in a sphere
            const radius = 100 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Random star colors (white to blue)
            const brightness = 0.7 + Math.random() * 0.3;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = 0.9 + Math.random() * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Update cloud layers
        this.cloudLayers.forEach((cloud, index) => {
            // Update shader time uniform
            cloud.material.uniforms.time.value = this.time;

            // Rotate clouds at different speeds
            cloud.rotation.x += cloud.userData.rotationSpeed * this.intensity;
            cloud.rotation.y += cloud.userData.rotationSpeed * 1.5 * this.intensity;
            cloud.rotation.z += cloud.userData.rotationSpeed * 0.5 * this.intensity;

            // Pulsing effect based on breathing
            const pulse = 1 + Math.sin(this.time + index) * 0.1 * this.intensity;
            cloud.scale.setScalar(pulse);

            // Adjust opacity based on intensity
            cloud.material.uniforms.opacity.value = (0.1 + index * 0.03) * this.intensity;
        });

        // Rotate starfield slowly
        if (this.stars) {
            this.stars.rotation.y += 0.0002;
        }

        // Camera orbit
        const radius = 30;
        this.camera.position.x = Math.sin(this.time * 0.05) * radius;
        this.camera.position.z = Math.cos(this.time * 0.05) * radius;
        this.camera.position.y = Math.sin(this.time * 0.03) * 10;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    updateBreathingData(data) {
        if (data && data.averageRate) {
            // Adjust nebula intensity based on breathing
            this.intensity = 0.8 + (data.averageRate / 128.0) * 1.2;

            // Adjust cloud rotation speed
            this.cloudLayers.forEach(cloud => {
                const baseSpeed = (Math.random() - 0.5) * 0.001;
                cloud.userData.rotationSpeed = baseSpeed * this.intensity;
            });
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

        // Clean up cloud layers
        this.cloudLayers.forEach(cloud => {
            this.scene.remove(cloud);
            cloud.geometry.dispose();
            cloud.material.dispose();
        });
        this.cloudLayers = [];

        // Clean up stars
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }

        // Clean up renderer
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
