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
                🌟 DeepBreath에 오신 것을 환영합니다!
                
                💡 사용법:
                • 스페이스바: 음악 재생/일시정지
                • Tab: 애니메이션 전환
                • S: 명상 세션 시작/종료
                • R: 리셋
                
                🎤 마이크 권한을 허용하면 호흡에 반응하는 시각화를 경험할 수 있습니다.
            `, 'info', 8000);
        }, 2000);
    }
}

function showNotification(message, type = 'info', duration = 3000) {
    // 알림 표시 (간단한 구현)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message.replace(/\n/g, '<br>');
    
    // 스타일 적용
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        lineHeight: '1.4',
        maxWidth: '300px',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        backgroundColor: type === 'error' ? '#e74c3c' : 
                        type === 'warning' ? '#f39c12' : '#3498db'
    });
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 표시
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

function showErrorMessage(message) {
    showNotification(message, 'error', 5000);
}

function setupDebugMode() {
    // 개발 모드에서 디버깅 도구 추가
    console.log('🔧 Debug mode enabled');
    
    // 전역 디버깅 객체 생성
    window.deepBreathDebug = {
        app: deepBreathApp,
        getState: () => deepBreathApp.getAppState(),
        toggleAnimation: () => deepBreathApp.toggleAnimation(),
        toggleSession: () => deepBreathApp.toggleSession(),
        reset: () => deepBreathApp.resetApp()
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
    `);
}

// 에러 핸들링
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    showErrorMessage('예상치 못한 오류가 발생했습니다.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
    showErrorMessage('비동기 작업 중 오류가 발생했습니다.');
});
