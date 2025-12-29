// src/contexts/SessionContext.js
import { EventEmitter } from '../utils/EventEmitter.js';

export class SessionContext extends EventEmitter {
    constructor() {
        super();
        this.state = {
            isActive: false,
            startTime: null,
            duration: 0,
            currentPhase: 'idle', // idle, active, paused, completed
            breathingData: []
        };
    }

    start() {
        const now = Date.now();
        this.state = {
            isActive: true,
            startTime: now,
            duration: 0,
            currentPhase: 'active',
            breathingData: []
        };
        this.emit('started', now);
    }

    pause() {
        this.setState('currentPhase', 'paused');
        this.emit('paused');
    }

    resume() {
        this.setState('currentPhase', 'active');
        this.emit('resumed');
    }

    stop() {
        const duration = this.state.startTime ? Date.now() - this.state.startTime : 0;
        const data = { ...this.state, duration, isActive: false, currentPhase: 'completed' };
        this.state = data;
        this.emit('ended', data);
        return data;
    }

    addBreathingData(data) {
        if (!this.state.isActive) return;
        this.state.breathingData.push({
            timestamp: Date.now(),
            ...data
        });
        this.emit('dataAdded', data);
    }

    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.emit('stateChanged', { key, value, oldValue });
        this.emit(`${key}Changed`, value, oldValue);
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }
}
