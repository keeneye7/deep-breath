// src/components/animations/GeometricMorph.js - Geometric Morphing Animation
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class GeometricMorphAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.geometries = [];
        this.currentGeometry = null;
        this.targetGeometry = null;
        this.morphProgress = 0;
        this.morphDuration = 3.0;
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        this.intensity = 1.0;
        this.wireframeMesh = null;
        this.particleSystem = null;
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

            this.createGeometries();
            this.createMorphingMesh();
            this.createParticleSystem();
            this.setupEventListeners();
            this.camera.position.z = 15;

            this.isInitialized = true;
            this.emit('initialized');
            this.start();

        } catch (error) {
            console.error('Failed to initialize GeometricMorph animation:', error);
            this.emit('error', error);
        }
    }

    createGeometries() {
        // Create various geometric shapes to morph between
        this.geometries = [
            new THREE.IcosahedronGeometry(4, 0),
            new THREE.OctahedronGeometry(4, 0),
            new THREE.TetrahedronGeometry(4, 0),
            new THREE.DodecahedronGeometry(4, 0),
            new THREE.TorusGeometry(3, 1, 16, 100),
            new THREE.TorusKnotGeometry(3, 0.8, 100, 16)
        ];

        this.currentGeometryIndex = 0;
        this.targetGeometryIndex = 1;
    }

    createMorphingMesh() {
        // Create wireframe mesh
        const geometry = this.geometries[0].clone();

        const material = new THREE.MeshBasicMaterial({
            color: 0x4facfe,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });

        this.wireframeMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.wireframeMesh);

        // Add inner glow mesh
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });

        const glowMesh = new THREE.Mesh(geometry.clone(), glowMaterial);
        glowMesh.scale.setScalar(1.1);
        this.wireframeMesh.add(glowMesh);
        this.glowMesh = glowMesh;
    }

    createParticleSystem() {
        // Create particles that orbit the geometry
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 6 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Gradient colors
            const t = i / particleCount;
            colors[i3] = 0.3 + t * 0.4;
            colors[i3 + 1] = 0.6 + t * 0.3;
            colors[i3 + 2] = 0.9;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    morphGeometry() {
        if (!this.wireframeMesh) return;

        const currentGeo = this.geometries[this.currentGeometryIndex];
        const targetGeo = this.geometries[this.targetGeometryIndex];

        // Get position attributes
        const currentPositions = currentGeo.attributes.position.array;
        const targetPositions = targetGeo.attributes.position.array;
        const meshPositions = this.wireframeMesh.geometry.attributes.position.array;

        // Determine the minimum length to avoid index errors
        const minLength = Math.min(currentPositions.length, targetPositions.length, meshPositions.length);

        // Interpolate between geometries
        for (let i = 0; i < minLength; i++) {
            meshPositions[i] = THREE.MathUtils.lerp(
                currentPositions[i],
                targetPositions[i],
                this.morphProgress
            );
        }

        this.wireframeMesh.geometry.attributes.position.needsUpdate = true;
        this.wireframeMesh.geometry.computeVertexNormals();
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Update morph progress
        this.morphProgress += (0.01 * this.intensity) / this.morphDuration;

        if (this.morphProgress >= 1.0) {
            // Switch to next geometry
            this.morphProgress = 0;
            this.currentGeometryIndex = this.targetGeometryIndex;
            this.targetGeometryIndex = (this.targetGeometryIndex + 1) % this.geometries.length;

            // Update mesh geometry
            this.wireframeMesh.geometry.dispose();
            this.wireframeMesh.geometry = this.geometries[this.currentGeometryIndex].clone();

            if (this.glowMesh) {
                this.glowMesh.geometry.dispose();
                this.glowMesh.geometry = this.geometries[this.currentGeometryIndex].clone();
            }
        }

        this.morphGeometry();

        // Rotate the mesh
        if (this.wireframeMesh) {
            this.wireframeMesh.rotation.x += 0.003 * this.intensity;
            this.wireframeMesh.rotation.y += 0.005 * this.intensity;

            // Pulsing scale
            const pulse = 1 + Math.sin(this.time) * 0.1 * this.intensity;
            this.wireframeMesh.scale.setScalar(pulse);

            // Color shifting
            const hue = (this.time * 0.1) % 1;
            this.wireframeMesh.material.color.setHSL(0.5 + hue * 0.3, 0.8, 0.6);
        }

        // Rotate particle system
        if (this.particleSystem) {
            this.particleSystem.rotation.y += 0.002;
            this.particleSystem.rotation.x += 0.001;

            // Update particle positions for orbital motion
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];

                // Orbital rotation
                const angle = 0.01 * this.intensity;
                positions[i] = x * Math.cos(angle) - z * Math.sin(angle);
                positions[i + 2] = x * Math.sin(angle) + z * Math.cos(angle);
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Camera orbit
        this.camera.position.x = Math.sin(this.time * 0.1) * 15;
        this.camera.position.y = Math.cos(this.time * 0.15) * 10;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    updateBreathingData(data) {
        if (data && data.averageRate) {
            // Adjust animation intensity based on breathing
            this.intensity = 0.5 + (data.averageRate / 128.0) * 1.5;

            // Adjust particle opacity
            if (this.particleSystem) {
                this.particleSystem.material.opacity = 0.4 + (data.averageRate / 255.0) * 0.4;
            }

            // Adjust wireframe opacity
            if (this.wireframeMesh) {
                this.wireframeMesh.material.opacity = 0.4 + (data.averageRate / 255.0) * 0.4;
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

        // Clean up geometries
        this.geometries.forEach(geo => geo.dispose());
        this.geometries = [];

        // Clean up mesh
        if (this.wireframeMesh) {
            this.scene.remove(this.wireframeMesh);
            this.wireframeMesh.geometry.dispose();
            this.wireframeMesh.material.dispose();
            if (this.glowMesh) {
                this.glowMesh.geometry.dispose();
                this.glowMesh.material.dispose();
            }
        }

        // Clean up particles
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
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
