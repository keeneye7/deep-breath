// src/components/animations/CosmicWeb.js - Cosmic Web Network Animation
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class CosmicWebAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nodes = [];
        this.connections = [];
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        this.intensity = 1.0;
        this.nodeCount = 150;
        this.maxDistance = 15;
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

            this.createCosmicWeb();
            this.setupEventListeners();
            this.camera.position.z = 50;

            this.isInitialized = true;
            this.emit('initialized');
            this.start();

        } catch (error) {
            console.error('Failed to initialize CosmicWeb animation:', error);
            this.emit('error', error);
        }
    }

    createCosmicWeb() {
        // Create nodes (particles)
        const nodeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4facfe,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < this.nodeCount; i++) {
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());

            // Random position in 3D space
            node.position.x = (Math.random() - 0.5) * 100;
            node.position.y = (Math.random() - 0.5) * 100;
            node.position.z = (Math.random() - 0.5) * 100;

            // Random velocity for organic movement
            node.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            );

            this.scene.add(node);
            this.nodes.push(node);
        }

        // Create connection lines
        this.updateConnections();

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add point light
        const pointLight = new THREE.PointLight(0x4facfe, 1, 100);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
    }

    updateConnections() {
        // Remove old connections
        this.connections.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.connections = [];

        // Create new connections between nearby nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const distance = this.nodes[i].position.distanceTo(this.nodes[j].position);

                if (distance < this.maxDistance) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        this.nodes[i].position,
                        this.nodes[j].position
                    ]);

                    const opacity = 1 - (distance / this.maxDistance);
                    const material = new THREE.LineBasicMaterial({
                        color: 0x00f2fe,
                        transparent: true,
                        opacity: opacity * 0.3
                    });

                    const line = new THREE.Line(geometry, material);
                    this.scene.add(line);
                    this.connections.push(line);
                }
            }
        }
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Update node positions with organic movement
        this.nodes.forEach((node, index) => {
            // Apply velocity
            node.position.add(node.userData.velocity);

            // Boundary check - bounce back
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(node.position[axis]) > 50) {
                    node.userData.velocity[axis] *= -1;
                }
            });

            // Add wave motion based on breathing intensity
            const wave = Math.sin(this.time + index * 0.1) * this.intensity;
            node.scale.setScalar(1 + wave * 0.2);

            // Color pulsing
            const hue = (this.time * 0.1 + index * 0.01) % 1;
            node.material.color.setHSL(0.5 + hue * 0.2, 0.8, 0.6);
        });

        // Update connections every few frames for performance
        if (Math.floor(this.time * 60) % 3 === 0) {
            this.updateConnections();
        }

        // Rotate camera slowly
        this.camera.position.x = Math.sin(this.time * 0.1) * 50;
        this.camera.position.y = Math.cos(this.time * 0.15) * 30;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    updateBreathingData(data) {
        if (data && data.averageRate) {
            this.intensity = 1.0 + (data.averageRate / 128.0) * 2;

            // Adjust node movement speed based on breathing
            const speedMultiplier = 1 + (data.averageRate / 255);
            this.nodes.forEach(node => {
                node.userData.velocity.multiplyScalar(speedMultiplier);
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

        // Clean up nodes
        this.nodes.forEach(node => {
            this.scene.remove(node);
            node.geometry.dispose();
            node.material.dispose();
        });
        this.nodes = [];

        // Clean up connections
        this.connections.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.connections = [];

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
