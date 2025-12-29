// main.js - 새로운 모듈화된 구조
import { deepBreathApp } from './src/DeepBreathApp.js';

// DOM이 로드되면 앱 초기화
document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log('🌟 DeepBreath.us - Starting initialization...');

        // 앱 초기화
        await deepBreathApp.initialize();

        // 앱 이벤트 리스너 설정
        setupAppEventListeners();

        console.log('✅ DeepBreath.us - Initialization completed successfully!');

        // 개발 모드에서 디버깅 정보 표시
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setupDebugMode();
        }

    } catch (error) {
        console.error('❌ Failed to initialize DeepBreath.us:', error);
        showErrorMessage('앱을 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');

        // Ensure loader is hidden even on failure
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 1000);
        }
    }
});

function setupAppEventListeners() {
    // 앱 초기화 완료
    deepBreathApp.on('initialized', () => {
        console.log('🎉 App initialized successfully');
        showWelcomeMessage();
    });

    // 애니메이션 변경
    deepBreathApp.on('animationChanged', (animationType) => {
        console.log(`🎨 Animation changed to: ${animationType}`);
        showNotification(`애니메이션이 ${animationType}로 변경되었습니다`);
    });

    // 세션 시작
    deepBreathApp.on('sessionStarted', () => {
        console.log('🧘 Meditation session started');
        showNotification('명상 세션이 시작되었습니다');
    });

    // 세션 종료
    deepBreathApp.on('sessionEnded', (data) => {
        console.log('✨ Meditation session ended', data);
        const minutes = Math.floor(data.duration / 60000);
        const seconds = Math.floor((data.duration % 60000) / 1000);
        showNotification(`명상 세션이 완료되었습니다 (${minutes}분 ${seconds}초)`);
    });

    // 호흡 데이터 수신
    deepBreathApp.on('breathingData', (data) => {
        // 호흡 데이터 처리 (필요시 추가 로직)
    });

    // 마이크 연결
    deepBreathApp.on('microphoneConnected', () => {
        console.log('🎤 Microphone connected');
        showNotification('마이크가 연결되었습니다');
    });

    // 마이크 오류
    deepBreathApp.on('microphoneError', (error) => {
        console.warn('🎤 Microphone error:', error);
        showNotification('마이크 접근이 거부되었습니다. 호흡 감지 기능이 제한됩니다.', 'warning');
    });

    // 오류 처리
    deepBreathApp.on('error', (error) => {
        console.error('💥 App error:', error);
        showErrorMessage('오류가 발생했습니다: ' + error.message);
    });
}

function showWelcomeMessage() {
    // 첫 방문자를 위한 안내 메시지
    const isFirstVisit = !localStorage.getItem('deepbreath_visited');

    if (isFirstVisit) {
        localStorage.setItem('deepbreath_visited', 'true');

        setTimeout(() => {
            showNotification(`
                <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px;">🌟 Welcome to DeepBreath</div>
                <div style="opacity: 0.9; font-size: 0.95em;">
                    • <b>Space</b>: Play / Pause<br>
                    • <b>Tab</b>: Switch Visuals<br>
                    • <b>F</b>: Toggle Fullscreen<br>
                    • <b>S</b>: Meditation Session<br>
                    • <b>R</b>: Reset Experience
                </div>
                <div style="margin-top: 10px; font-size: 0.85em; opacity: 0.8;">Enable microphone for reactive visualization.</div>
            `, 'info', 8000);
        }, 2000);
    }

    // Check for premium tier and show notification
    import('./src/services/StateManager.js').then(({ stateManager }) => {
        const tier = stateManager.user.getState('tier');
        if (tier === 'paid') {
            setTimeout(() => {
                showNotification(`
                    <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px;">✨ Premium Access Enabled</div>
                    <div style="opacity: 0.9; font-size: 0.95em;">
                        You now have access to premium animations:<br>
                        • 🌈 Nebula<br>
                        • 🔷 Geometric Morph<br>
                        • 💫 Aura
                    </div>
                    <div style="margin-top: 10px; font-size: 0.85em; opacity: 0.8;">Press Tab to cycle through all animations</div>
                `, 'info', 6000);
            }, isFirstVisit ? 10000 : 2000);
        }
    });
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message.replace(/\n/g, '<br>');

    // Notification styles are now primarily in CSS, but keeping positioning logic here
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '16px',
        color: 'white',
        fontSize: '14px',
        lineHeight: '1.6',
        maxWidth: '340px',
        zIndex: '10001',
        opacity: '0',
        transform: 'translateX(30px) scale(0.95)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        background: type === 'error' ? 'rgba(231, 76, 60, 0.9)' :
            type === 'warning' ? 'rgba(243, 156, 18, 0.9)' : 'rgba(52, 152, 219, 0.9)'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) scale(1)';
    }, 100);

    const remove = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(30px) scale(0.95)';
        setTimeout(() => notification.remove(), 400);
    };

    setTimeout(remove, duration);
    notification.onclick = remove;
}

function showErrorMessage(message) {
    showNotification(message, 'error', 5000);
}

function setupDebugMode() {
    // 개발 모드에서 디버깅 도구 추가
    console.log('🔧 Debug mode enabled');

    // 전역 디버깅 객체 생성
    import('./src/services/StateManager.js').then(({ stateManager }) => {
        window.deepBreathDebug = {
            app: deepBreathApp,
            stateManager: stateManager,
            getState: () => deepBreathApp.getAppState(),
            toggleAnimation: () => deepBreathApp.toggleAnimation(),
            toggleSession: () => deepBreathApp.toggleSession(),
            reset: () => deepBreathApp.resetApp(),
            // Premium tier controls
            enablePremium: () => {
                stateManager.user.setTier('paid');
                console.log('✨ Premium tier enabled');
                showNotification('Premium tier enabled! Press Tab to see new animations.', 'info', 3000);
            },
            disablePremium: () => {
                stateManager.user.setTier('free');
                console.log('🆓 Free tier set');
                showNotification('Free tier set', 'info', 2000);
            },
            getTier: () => {
                const tier = stateManager.user.getState('tier');
                console.log(`Current tier: ${tier}`);
                return tier;
            }
        };

        // 키보드 단축키 안내
        console.log(`
🎹 Keyboard shortcuts:
• Space: Toggle audio
• Tab: Switch animation
• S: Start/stop session
• R: Reset app

🔍 Debug commands:
• deepBreathDebug.getState() - Get current state
• deepBreathDebug.toggleAnimation() - Switch animation
• deepBreathDebug.toggleSession() - Toggle session
• deepBreathDebug.reset() - Reset app

✨ Premium tier controls:
• deepBreathDebug.enablePremium() - Enable premium tier
• deepBreathDebug.disablePremium() - Disable premium tier
• deepBreathDebug.getTier() - Get current tier

💡 Or use query strings: ?premium=true or ?tier=paid
        `);
    });
}

// 에러 핸들링
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    showErrorMessage('예상치 못한 오류가 발생했습니다.');
});

window.addEventListener('unhandledrejection', (event) => {
    // Ignore autoplay policy errors or already handled audio errors
    if (event.reason && (event.reason.name === 'NotAllowedError' || event.reason.message?.includes('play()'))) {
        console.warn('🔇 Autoplay prevented or audio interaction needed');
        return;
    }
    console.error('💥 Unhandled promise rejection:', event.reason);
    showErrorMessage('Experience update encountered a silent issue. Breathing continues...');
});
