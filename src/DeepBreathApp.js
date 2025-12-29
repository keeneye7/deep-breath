// src/DeepBreathApp.js
import { MilkyWayAnimation } from './components/animations/MilkyWay.js';
import { ParticleAnimation } from './components/animations/Particles.js';
import { AuraAnimation } from './components/animations/Aura.js';
import { CosmicWebAnimation } from './components/animations/CosmicWeb.js';
import { FlowFieldAnimation } from './components/animations/FlowField.js';
import { NebulaAnimation } from './components/animations/Nebula.js';
import { GeometricMorphAnimation } from './components/animations/GeometricMorph.js';
import { AudioManager } from './components/audio/AudioManager.js';
import { stateManager } from './services/StateManager.js';
import { EventEmitter } from './utils/EventEmitter.js';
import { musicService } from './services/MusicService.js';
import { MusicControls } from './components/ui/MusicControls.js';
import ContentData from './utils/ContentData.js';

export class DeepBreathApp extends EventEmitter {
    constructor() {
        super();
        this.container = null;
        this.visualizer = null;
        this.volumeControl = null;

        // 컴포넌트 인스턴스
        this.currentAnimation = null;
        this.audioManager = new AudioManager();
        this.musicControls = null;

        // 상태
        this.isInitialized = false;
        this.animationType = 'milkyway';

        // 호흡 시각화 관련
        this.breathingVisualizer = null;
        this.microphoneStream = null;
        this.breathingAnalyser = null;

        // 모드 상태
        this.isContentMode = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // DOM 요소 찾기
            this.container = document.getElementById('container');
            this.visualizer = document.getElementById('visualizer');
            this.volumeControl = document.getElementById('volume-control');

            if (!this.container) {
                throw new Error('Container element not found');
            }

            // 상태 관리자 이벤트 구독
            this.setupStateSubscriptions();

            // 오디오 매니저 초기화
            await this.audioManager.initialize();

            // 음악 서비스 초기화 (이미 자동으로 초기화됨)
            this.setupMusicService();

            // 초기 애니메이션 설정
            this.animationType = stateManager.getState('currentAnimation') || 'milkyway';
            await this.switchAnimation(this.animationType).catch(err => {
                console.error('Initial animation failed:', err);
                return this.switchAnimation('particles'); // Fallback
            });

            // UI 컨트롤 설정
            this.setupUIControls();

            // 시간 기반 테마 서비스 초기화
            const { timeService } = await import('./services/TimeService.js');
            timeService.init();

            // 호흡 시각화 설정
            this.setupBreathingVisualizer();

            // 마이크 권한 요청
            await this.requestMicrophonePermission();

            this.isInitialized = true;
            this.emit('initialized');

            // Hide loading overlay
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 1000);
            }

            console.log('DeepBreath App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize DeepBreath App:', error);
            this.emit('error', error);
        }
    }

    setupMusicService() {
        // 음악 컨트롤 UI 생성
        this.musicControls = new MusicControls(musicService);

        // 음악 서비스 이벤트 구독
        musicService.on('initialized', () => {
            console.log('🎵 Music service ready');
            // 음악 컨트롤 표시 (3초 후 자동 숨김)
            setTimeout(() => {
                this.musicControls.show();
                setTimeout(() => {
                    this.musicControls.hide();
                }, 3000);
            }, 2000);
        });

        musicService.on('play', (track) => {
            console.log('🎵 Playing:', track.title);
            this.emit('musicPlay', track);
        });

        musicService.on('pause', () => {
            console.log('🎵 Music paused');
            this.emit('musicPause');
        });

        musicService.on('trackChanged', (track) => {
            console.log('🎵 Track changed:', track.title);
            this.emit('musicTrackChanged', track);
        });

        musicService.on('error', (error) => {
            console.error('🎵 Music service error:', error);
            this.emit('musicError', error);
        });
    }

    setupStateSubscriptions() {
        // 애니메이션 변경 구독
        stateManager.on('currentAnimationChanged', (newAnimation) => {
            if (newAnimation !== this.animationType) {
                this.switchAnimation(newAnimation);
            }
        });

        // 볼륨 변경 구독
        stateManager.on('audio.volumeChanged', (volume) => {
            this.audioManager.setVolume(volume);
            if (this.volumeControl) {
                this.volumeControl.value = volume;
            }
        });

        // 세션 상태 구독
        stateManager.on('sessionStarted', () => {
            this.emit('sessionStarted');
        });

        stateManager.on('sessionEnded', (data) => {
            this.emit('sessionEnded', data);
        });
    }


    handleKeyboardShortcuts(e) {
        switch (e.key.toLowerCase()) {
            case ' ': // 스페이스바 - 음악 재생/일시정지
                e.preventDefault();
                musicService.toggle();
                break;
            case 'tab': // 탭 - 애니메이션 전환
                e.preventDefault();
                this.toggleAnimation();
                break;
            case 's': // S - 세션 시작/종료
                e.preventDefault();
                this.toggleSession();
                break;
            case 'r': // R - 리셋
                e.preventDefault();
                this.resetApp();
                break;
            case 'm': // M - 음악 컨트롤 토글
                e.preventDefault();
                if (this.musicControls) {
                    this.musicControls.toggle();
                }
                break;
            case 'arrowleft': // 왼쪽 화살표 - 이전 곡
                e.preventDefault();
                musicService.playPrevious();
                break;
            case 'arrowright': // 오른쪽 화살표 - 다음 곡
                e.preventDefault();
                musicService.playNext();
                break;
            case 'arrowup': // 위쪽 화살표 - 볼륨 증가
                e.preventDefault();
                const currentVolume = musicService.getVolume();
                musicService.setVolume(Math.min(1, currentVolume + 0.1));
                break;
            case 'arrowdown': // 아래쪽 화살표 - 볼륨 감소
                e.preventDefault();
                const currentVol = musicService.getVolume();
                musicService.setVolume(Math.max(0, currentVol - 0.1));
                break;
            case 'f': // F - 전체화면
                e.preventDefault();
                this.toggleFullScreen();
                break;
            case 'escape': // Esc - 컨텐츠 모드 종료
                if (this.isContentMode) {
                    this.toggleContentMode();
                }
                break;
            case 'e': // E - 익스플로어(컨텐츠) 모드 토글
                e.preventDefault();
                this.toggleContentMode();
                break;
        }
    }

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    async switchAnimation(animationType) {
        try {
            // 기존 애니메이션 정리
            if (this.currentAnimation) {
                this.currentAnimation.dispose();
                this.currentAnimation = null;
            }

            const userTier = stateManager.user.getState('tier');
            const isPremium = userTier === 'paid';

            // 새 애니메이션 생성
            switch (animationType) {
                case 'milkyway':
                    this.currentAnimation = new MilkyWayAnimation(this.container);
                    break;
                case 'particles':
                    this.currentAnimation = new ParticleAnimation(this.container);
                    break;
                case 'cosmicweb':
                    this.currentAnimation = new CosmicWebAnimation(this.container);
                    break;
                case 'flowfield':
                    this.currentAnimation = new FlowFieldAnimation(this.container);
                    break;
                case 'nebula':
                    if (!isPremium) {
                        musicService.emit('premiumRequired', { title: 'Nebula Animation' });
                        return;
                    }
                    this.currentAnimation = new NebulaAnimation(this.container);
                    break;
                case 'geometric':
                    if (!isPremium) {
                        musicService.emit('premiumRequired', { title: 'Geometric Morph Animation' });
                        return;
                    }
                    this.currentAnimation = new GeometricMorphAnimation(this.container);
                    break;
                case 'aura':
                    if (!isPremium) {
                        musicService.emit('premiumRequired', { title: 'Aura Animation' });
                        return;
                    }
                    this.currentAnimation = new AuraAnimation(this.container);
                    break;
                default:
                    throw new Error(`Unknown animation type: ${animationType}`);
            }

            // 애니메이션 이벤트 구독
            this.setupAnimationEvents();

            // 애니메이션 초기화 및 시작
            await this.currentAnimation.initialize();

            this.animationType = animationType;
            stateManager.setCurrentAnimation(animationType);

            this.emit('animationChanged', animationType);

        } catch (error) {
            console.error('Failed to switch animation:', error);
            this.emit('animationError', error);
        }
    }

    setupAnimationEvents() {
        if (!this.currentAnimation) return;

        this.currentAnimation.on('breathingData', (data) => {
            // 호흡 데이터를 상태 관리자에 저장
            if (stateManager.getState('session.isActive')) {
                stateManager.addBreathingData(data);
            }

            // 다른 애니메이션에도 호흡 데이터 전달
            if (this.currentAnimation.updateBreathingData) {
                this.currentAnimation.updateBreathingData(data);
            }

            this.emit('breathingData', data);
        });

        this.currentAnimation.on('error', (error) => {
            console.error('Animation error:', error);
            this.emit('animationError', error);
        });
    }

    setupBreathingVisualizer() {
        if (!this.visualizer) return;

        // 기존 바 제거
        this.visualizer.innerHTML = '';

        const barCount = 32;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            this.visualizer.appendChild(bar);
        }

        this.breathingBars = this.visualizer.getElementsByClassName('bar');
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphoneStream = stream;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.breathingAnalyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 3; // 증가된 감도
            microphone.connect(gainNode);
            gainNode.connect(this.breathingAnalyser);

            this.breathingAnalyser.fftSize = 64;

            this.startBreathingVisualization();
            this.emit('microphoneConnected');

        } catch (error) {
            console.warn('Microphone access denied:', error);
            this.emit('microphoneError', error);
        }
    }

    startBreathingVisualization() {
        if (!this.breathingAnalyser || !this.breathingBars) return;

        const bufferLength = this.breathingAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const visualize = () => {
            if (!this.isInitialized) return;

            requestAnimationFrame(visualize);

            this.breathingAnalyser.getByteFrequencyData(dataArray);

            // 호흡 시각화 바 업데이트
            for (let i = 0; i < bufferLength && i < this.breathingBars.length; i++) {
                const bar = this.breathingBars[i];
                if (!bar) continue;
                const barHeight = dataArray[i] / 4;
                bar.style.height = `${barHeight}px`;
                bar.style.opacity = 0.5 + barHeight / 50;
            }

            // 평균 계산
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // 애니메이션에 호흡 데이터 전달
            if (this.currentAnimation && this.currentAnimation.updateBreathingData) {
                this.currentAnimation.updateBreathingData({
                    averageRate: average,
                    rawData: Array.from(dataArray)
                });
            }

            // 상태 관리자에 호흡 데이터 저장
            if (stateManager.getState('session.isActive')) {
                stateManager.addBreathingData({
                    averageRate: average,
                    timestamp: Date.now()
                });
            }
        };

        visualize();
    }

    // 컨트롤 메서드들
    async toggleAudio() {
        if (stateManager.getState('audio.isPlaying')) {
            this.audioManager.pause();
            stateManager.setAudioPlaying(false);
        } else {
            await this.audioManager.play();
            stateManager.setAudioPlaying(true);
        }
    }

    toggleAnimation() {
        const currentAnim = stateManager.getState('currentAnimation');
        const userTier = stateManager.user.getState('tier');
        const isPremium = userTier === 'paid';

        // Animation cycle order
        const freeAnimations = ['milkyway', 'particles', 'cosmicweb', 'flowfield'];
        const premiumAnimations = ['nebula', 'geometric', 'aura'];
        const allAnimations = isPremium ? [...freeAnimations, ...premiumAnimations] : freeAnimations;

        const currentIndex = allAnimations.indexOf(currentAnim);
        const nextIndex = (currentIndex + 1) % allAnimations.length;
        const newAnim = allAnimations[nextIndex];

        this.switchAnimation(newAnim);
    }

    toggleSession() {
        if (stateManager.getState('session.isActive')) {
            stateManager.endSession();
        } else {
            stateManager.startSession();
        }
    }

    resetApp() {
        // 세션 종료
        if (stateManager.getState('session.isActive')) {
            stateManager.endSession();
        }

        // 오디오 정지
        this.audioManager.stop();
        stateManager.setAudioPlaying(false);

        // 애니메이션 리셋
        if (this.currentAnimation && this.currentAnimation.reset) {
            this.currentAnimation.reset();
        }

        this.emit('appReset');
    }

    setupUIControls() {
        // 볼륨 컨트롤
        if (this.volumeControl) {
            const initialVolume = stateManager.getState('audio.volume');
            this.volumeControl.value = initialVolume;
            this.audioManager.setVolume(initialVolume);

            this.volumeControl.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                stateManager.setVolume(volume);
            });
        }

        // 컨텐츠 토글 버튼
        const exploreBtn = document.getElementById('toggle-content');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => this.toggleContentMode());
        }

        // 세션 토글 버튼
        const sessionBtn = document.getElementById('toggle-session-btn');
        if (sessionBtn) {
            sessionBtn.addEventListener('click', () => this.toggleSession());

            // 세션 상태에 따른 버튼 텍스트 변경
            stateManager.on('sessionStarted', () => {
                sessionBtn.textContent = 'Finish';
                sessionBtn.classList.add('active');
            });
            stateManager.on('sessionEnded', () => {
                sessionBtn.textContent = 'Start';
                sessionBtn.classList.remove('active');
            });
        }

        // 애니메이션 토글 버튼
        const animBtn = document.getElementById('toggle-animation-btn');
        if (animBtn) {
            animBtn.addEventListener('click', () => this.toggleAnimation());
        }

        // 음악 토글 버튼
        const musicBtn = document.getElementById('toggle-music-btn');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                if (this.musicControls) {
                    this.musicControls.toggle();
                } else {
                    musicService.toggle();
                }
            });

            musicService.on('play', () => musicBtn.classList.add('active'));
            musicService.on('pause', () => musicBtn.classList.remove('active'));
        }

        // 앱 리셋 버튼
        const resetBtn = document.getElementById('reset-app-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetApp());
        }

        // 클릭으로 오디오 재생 시작 (배경 클릭 시 모드 전환은 제거 - 버튼으로 대체)
        document.body.addEventListener('click', async (e) => {
            // UI 요소를 클릭한 경우 무시
            if (e.target.closest('#controls') || e.target.closest('#logo-container') || e.target.closest('#content-wrapper') || e.target.closest('.notification')) {
                return;
            }

            if (!stateManager.getState('audio.isPlaying')) {
                await this.audioManager.play();
                stateManager.setAudioPlaying(true);
            }
        });

        // 컨텐츠 닫기 버튼
        const closeBtn = document.getElementById('close-content');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleContentMode());
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // 정리
    dispose() {
        this.isInitialized = false;

        // 애니메이션 정리
        if (this.currentAnimation) {
            this.currentAnimation.dispose();
        }

        // 오디오 정리
        this.audioManager.dispose();

        // 마이크 스트림 정리
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
        }

        // 이벤트 리스너 정리
        this.removeAllListeners();
        stateManager.removeAllListeners();

        this.emit('disposed');
    }

    // 컨텐츠 모드 토글
    toggleContentMode() {
        this.isContentMode = !this.isContentMode;

        const contentUI = document.getElementById('content-mode-ui');
        const mainControls = document.getElementById('controls');

        if (this.isContentMode) {
            this.injectContent();
            contentUI.classList.remove('hidden');
            setTimeout(() => contentUI.classList.add('active'), 10);
            if (mainControls) mainControls.style.opacity = '0';
        } else {
            contentUI.classList.remove('active');
            if (mainControls) mainControls.style.opacity = '1';
            setTimeout(() => contentUI.classList.add('hidden'), 600);
        }

        this.emit('modeChanged', this.isContentMode ? 'explore' : 'focus');
    }

    injectContent() {
        console.log('DeepBreath: Attempting to inject content...');
        const main = document.getElementById('main-content');

        if (!main) {
            console.error('DeepBreath: #main-content element not found!');
            return;
        }

        // Relaxed check: if there's only whitespace or comments, proceed.
        // Or if it's already significantly populated, skip.
        if (main.children.length > 0) {
            console.log('DeepBreath: Content already injected (children found), skipping.');
            return;
        }

        console.log('DeepBreath: Data available:', ContentData);

        // Support both old and new data structures to prevent crashes
        const journey = ContentData.journey || ContentData;

        if (!journey || !journey.sections) {
            console.error('DeepBreath: Content journey sections missing!', ContentData);
            main.innerHTML = '<div class="content-section animate-fade-in"><p class="philosophy-content">Preparing your meditation journey... Please refresh if this takes too long.</p></div>';
            return;
        }
        let html = `
            <div class="content-title-area animate-fade-in">
                <h1 class="glitch-text" data-text="${journey.title}">${journey.title}</h1>
                <p class="philosophy-subtitle">${journey.subtitle}</p>
                <p class="author">${journey.author}</p>
            </div>
        `;

        journey.sections.forEach((section, index) => {
            const delay = (index + 0.5) * 0.15;
            const animateClass = `animate-fade-up`;
            const style = `style="animation-delay: ${delay}s"`;

            switch (section.type) {
                case 'rich-text':
                    html += `
                        <div class="content-section ${animateClass}" ${style}>
                            ${section.heading ? `<h2>${section.heading}</h2>` : ''}
                            ${section.content.map(p => `<p class="philosophy-content">${p}</p>`).join('')}
                        </div>
                    `;
                    break;
                case 'quote':
                    html += `
                        <div class="quote-block ${animateClass}" ${style}>
                            <p>${section.text}</p>
                            ${section.author ? `<cite>${section.author}</cite>` : ''}
                            ${section.subtext ? `<div class="quote-subtext">${section.subtext}</div>` : ''}
                        </div>
                    `;
                    break;
                case 'divider':
                    html += `<div class="content-divider ${animateClass}" ${style}></div>`;
                    break;
                case 'meditation-pause':
                    html += `
                        <div class="meditation-pause ${animateClass}" ${style}>
                            <p class="pause-text">${section.title}</p>
                            <p class="breath-count">${section.subtitle}</p>
                        </div>
                    `;
                    break;
                case 'list':
                    html += `
                        <div class="content-section ${animateClass}" ${style}>
                            ${section.heading ? `<h2>${section.heading}</h2>` : ''}
                            <ul class="article-list">
                                ${section.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                    break;
                case 'call-to-action':
                    html += `
                        <div class="premium-cta-section ${animateClass}" ${style}>
                            <div class="premium-card">
                                <div class="premium-badge">PREMIUM</div>
                                <h2>${section.heading}</h2>
                                <p class="premium-sub">${section.subheading}</p>
                                <p class="premium-desc">${section.description}</p>
                                <ul class="premium-features">
                                    ${section.features.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('')}
                                </ul>
                                <button class="cta-button pulse">${section.cta}</button>
                            </div>
                        </div>
                    `;
                    break;
            }
        });

        const footerHtml = `
            <div class="content-footer animate-fade-in" style="animation-delay: 2s">
                <p>"${ContentData.footer.message}"</p>
                <div class="footer-logo">DeepBreath.us</div>
            </div>
        `;

        main.innerHTML = html + footerHtml;
    }


    // 상태 정보
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            animationType: this.animationType,
            audioState: this.audioManager.getState(),
            sessionState: stateManager.getState('session'),
            analytics: stateManager.getState('analytics')
        };
    }
}

// 전역 앱 인스턴스
export const deepBreathApp = new DeepBreathApp();
