// src/contexts/EnvironmentContext.js
import { EventEmitter } from '../utils/EventEmitter.js';

export class EnvironmentContext extends EventEmitter {
    constructor() {
        super();
        this.state = {
            currentTime: new Date(),
            timePhase: 'day', // dawn, day, dusk, night
            weather: 'clear'
        };
        this.updateInterval = null;
    }

    initialize() {
        this.updateTimePhase();
        this.startUpdating();
    }

    startUpdating() {
        this.updateInterval = setInterval(() => {
            const now = new Date();
            this.setState('currentTime', now);
            this.updateTimePhase();
        }, 60000); // Update every minute
    }

    updateTimePhase() {
        const hour = new Date().getHours();
        let phase = 'day';

        if (hour >= 5 && hour < 8) phase = 'dawn';
        else if (hour >= 8 && hour < 17) phase = 'day';
        else if (hour >= 17 && hour < 20) phase = 'dusk';
        else phase = 'night';

        if (this.state.timePhase !== phase) {
            this.setState('timePhase', phase);
        }
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

    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
