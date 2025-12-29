// src/components/animations/Aura.js - Premium Aura Animation
import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class AuraAnimation extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.auraRing = null;
        this.particles = null;
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        this.intensity = 1.0;
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

            this.createAura();
            this.camera.position.z = 10;

            this.isInitialized = true;
            this.start();
        } catch (error) {
            console.error('Aura initialization failed', error);
        }
    }

    createAura() {
        // 프리미엄 아우라: 링 형태의 레이어들이 중첩되어 일렁이는 효과
        const group = new THREE.Group();

        const colors = [0x4facfe, 0x00f2fe, 0xa892ee];
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(3 + i * 0.5, 0.05, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.4 - i * 0.1
            });
            const ring = new THREE.Mesh(geometry, material);
            group.add(ring);
        }

        this.auraRing = group;
        this.scene.add(this.auraRing);

        // 부드러운 먼지 입자들
        const pGeo = new THREE.BufferGeometry();
        const pCount = 2000;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 20;
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
        this.particles = new THREE.Points(pGeo, pMat);
        this.scene.add(this.particles);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        if (this.auraRing) {
            this.auraRing.children.forEach((ring, i) => {
                ring.rotation.z += 0.002 * (i + 1);
                ring.scale.setScalar(1 + Math.sin(this.time + i) * 0.1 * this.intensity);
            });
            this.auraRing.rotation.x = Math.sin(this.time * 0.5) * 0.2;
            this.auraRing.rotation.y = Math.cos(this.time * 0.3) * 0.2;
        }

        if (this.particles) {
            this.particles.rotation.y += 0.001;
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateBreathingData(data) {
        if (data && data.averageRate) {
            this.intensity = 1.0 + (data.averageRate / 255);
        }
    }

    start() { if (this.isInitialized && !this.animationId) this.animate(); }
    stop() { if (this.animationId) cancelAnimationFrame(this.animationId); }

    dispose() {
        this.stop();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) this.container.removeChild(this.renderer.domElement);
        }
        this.isInitialized = false;
    }
}
