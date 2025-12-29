// src/services/TimeService.js
import { stateManager } from './StateManager.js';

export class TimeService {
    constructor() {
        this.themes = {
            dawn: {
                primary: '#4a306d', // Muted purple
                secondary: '#a892ee',
                background: 'radial-gradient(circle at bottom, #4a306d 0%, #1a0b2e 100%)'
            },
            day: {
                primary: '#3498db', // Bright blue
                secondary: '#85c1e9',
                background: 'radial-gradient(circle at center, #3498db 0%, #1a3a5a 100%)'
            },
            dusk: {
                primary: '#e67e22', // Warm orange
                secondary: '#f39c12',
                background: 'radial-gradient(circle at bottom, #e67e22 0%, #2c1a0b 100%)'
            },
            night: {
                primary: '#1a1a2e', // Deep navy
                secondary: '#16213e',
                background: 'radial-gradient(circle at top, #16213e 0%, #0f0f1b 100%)'
            }
        };
    }

    init() {
        // 시간 상태 변경 감시
        stateManager.env.on('timePhaseChanged', (phase) => {
            this.applyTheme(phase);
        });

        // 초기 테마 적용
        this.applyTheme(stateManager.env.getState('timePhase'));
    }

    applyTheme(phase) {
        const theme = this.themes[phase] || this.themes.day;
        console.log(`🌅 Applying ${phase} theme`);

        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.body.style.background = theme.background;

        // 바디 클래스 업데이트
        document.body.className = `theme-${phase}`;

        // 커스텀 이벤트 발생 (필요한 컴포넌트들을 위해)
        const event = new CustomEvent('themeChanged', { detail: { phase, theme } });
        window.dispatchEvent(event);
    }
}

export const timeService = new TimeService();
