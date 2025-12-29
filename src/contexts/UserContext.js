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

        // Check query string for premium override
        this.checkQueryStringOverride();
    }

    checkQueryStringOverride() {
        try {
            const urlParams = new URLSearchParams(window.location.search);

            // Support multiple query string formats
            // ?premium=true
            // ?tier=paid
            // ?membership=premium
            const premiumParam = urlParams.get('premium');
            const tierParam = urlParams.get('tier');
            const membershipParam = urlParams.get('membership');

            if (premiumParam === 'true' || tierParam === 'paid' || membershipParam === 'premium') {
                this.state.tier = 'paid';
                console.log('🌟 Premium tier activated via query string');
                this.emit('tierChanged', 'paid');
            } else if (premiumParam === 'false' || tierParam === 'free' || membershipParam === 'free') {
                this.state.tier = 'free';
                console.log('🆓 Free tier set via query string');
                this.emit('tierChanged', 'free');
            }
        } catch (error) {
            console.warn('Failed to parse query string:', error);
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
