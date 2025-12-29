// src/contexts/UserContext.js
import { EventEmitter } from '../utils/EventEmitter.js';

export class UserContext extends EventEmitter {
    constructor() {
        super();
        this.state = {
            tier: 'free', // free, paid
            preferences: {
                theme: 'auto',
                language: 'ko'
            },
            history: []
        };
    }

    initialize(savedData) {
        if (savedData) {
            this.state = { ...this.state, ...savedData };
        }
    }

    setTier(tier) {
        this.setState('tier', tier);
    }

    updatePreferences(prefs) {
        this.setState('preferences', { ...this.state.preferences, ...prefs });
    }

    addHistory(entry) {
        const newHistory = [entry, ...this.state.history].slice(0, 50);
        this.setState('history', newHistory);
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
