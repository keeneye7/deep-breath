// src/services/StateManager.js - Refactored to CoreContext structure
import { EventEmitter } from '../utils/EventEmitter.js';
import { EnvironmentContext } from '../contexts/EnvironmentContext.js';
import { UserContext } from '../contexts/UserContext.js';
import { SessionContext } from '../contexts/SessionContext.js';

export class StateManager extends EventEmitter {
    constructor() {
        super();

        // 하위 컨텍스트 인스턴스화
        this.env = new EnvironmentContext();
        this.user = new UserContext();
        this.session = new SessionContext();

        // 레거시 지원 및 통합 상태
        this.state = {
            currentAnimation: 'milkyway',
            audio: {
                volume: 0.5,
                isPlaying: false
            }
        };

        this.init();
    }

    init() {
        this.loadFromStorage();

        // 하위 컨텍스트 초기화
        this.env.initialize();

        // 컨텍스트 변경 전파
        this.setupForwarding();
    }

    setupForwarding() {
        // 하위 컨텍스트의 변경 사항을 Core(StateManager) 이벤트로 중계 (레거시 호환성)
        this.env.on('stateChanged', ({ key, value }) => {
            this.emit(`env.${key}Changed`, value);
            if (key === 'timePhase') {
                this.emit('timePhaseChanged', value);
            }
        });

        this.user.on('stateChanged', ({ key, value }) => {
            this.emit(`user.${key}Changed`, value);
            this.saveToStorage();
        });

        this.session.on('stateChanged', ({ key, value }) => {
            this.emit(`session.${key}Changed`, value);
        });

        this.session.on('ended', (data) => {
            this.user.addHistory({
                date: Date.now(),
                duration: data.duration,
                type: 'meditation'
            });
            this.emit('sessionEnded', data);
        });

        this.session.on('started', (time) => {
            this.emit('sessionStarted', time);
        });
    }

    // 레거시 API 지원
    getState(path) {
        if (!path) return {
            ...this.state,
            env: this.env.getState(),
            user: this.user.getState(),
            session: this.session.getState()
        };

        const parts = path.split('.');
        const domain = parts[0];

        if (domain === 'env') return this.env.getState(parts[1]);
        if (domain === 'user') return this.user.getState(parts[1]);
        if (domain === 'session') return this.session.getState(parts[1]);

        // 기존 상태 처리
        let current = this.state;
        for (const key of parts) {
            if (current[key] === undefined) return undefined;
            current = current[key];
        }
        return current;
    }

    setState(path, value) {
        const parts = path.split('.');
        const domain = parts[0];

        if (domain === 'env') return this.env.setState(parts[1], value);
        if (domain === 'user') return this.user.setState(parts[1], value);
        if (domain === 'session') return this.session.setState(parts[1], value);

        // 기존 상태 업데이트 로직
        let current = this.state;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        const lastKey = parts[parts.length - 1];
        current[lastKey] = value;

        this.emit(`${path}Changed`, value);
        this.saveToStorage();
    }

    // 헬퍼 메서드들
    setVolume(volume) {
        this.setState('audio.volume', volume);
    }

    setAudioPlaying(isPlaying) {
        this.setState('audio.isPlaying', isPlaying);
    }

    setCurrentAnimation(animation) {
        this.setState('currentAnimation', animation);
    }

    // 로컬 스토리지
    saveToStorage() {
        const data = {
            state: this.state,
            user: this.user.getState()
        };
        localStorage.setItem('deepbreath_core_state', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('deepbreath_core_state');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.state) this.state = { ...this.state, ...data.state };
                if (data.user) this.user.initialize(data.user);
            }
        } catch (e) {
            console.error('Storage load error', e);
        }
    }

    // 세션 헬퍼 (레거시 호환)
    startSession() { this.session.start(); }
    endSession() { this.session.stop(); }
    addBreathingData(data) { this.session.addBreathingData(data); }
}

export const stateManager = new StateManager();
