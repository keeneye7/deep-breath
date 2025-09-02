// src/DeepBreathApp.js
import { MilkyWayAnimation } from './components/animations/MilkyWay.js';
import { ParticleAnimation } from './components/animations/Particles.js';
import { AudioManager } from './components/audio/AudioManager.js';
import { stateManager } from './services/StateManager.js';
import { EventEmitter } from './utils/EventEmitter.js';

export class DeepBreathApp extends EventEmitter {
    constructor() {
        super();
        this.container = null;
        this.visualizer = null;
        this.volumeControl = null;
        
        // 컴포넌트 인스턴스
        this.currentAnimation = null;
        this.audioManager = new AudioManager();
        
        // 상태
        this.isInitialized = false;
        this.animationType = 'milkyway';
        
        // 호흡 시각화 관련
        this.breathingVisualizer = null;
        this.microphoneStream = null;
        this.breathingAnalyser = null;
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

            // 초기 애니메이션 설정
            this.animationType = stateManager.getState('currentAnimation') || 'milkyway';
            await this.switchAnimation(this.animationType);

            // UI 컨트롤 설정
            this.setupUIControls();

            // 호흡 시각화 설정
            this.setupBreathingVisualizer();

            // 마이크 권한 요청
            await this.requestMicrophonePermission();

            this.isInitialized = true;
            this.emit('initialized');

            console.log('DeepBreath App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize DeepBreath App:', error);
            this.emit('error', error);
        }
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

        // 클릭으로 오디오 재생 시작
        document.body.addEventListener('click', async () => {
            if (!stateManager.getState('audio.isPlaying')) {
                await this.audioManager.play();
                stateManager.setAudioPlaying(true);
            }
        }, { once: true });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        switch (e.key.toLowerCase()) {
            case ' ': // 스페이스바 - 재생/일시정지
                e.preventDefault();
                this.toggleAudio();
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
        }
    }

    async switchAnimation(animationType) {
        try {
            // 기존 애니메이션 정리
            if (this.currentAnimation) {
                this.currentAnimation.dispose();
                this.currentAnimation = null;
            }

            // 새 애니메이션 생성
            switch (animationType) {
                case 'milkyway':
                    this.currentAnimation = new MilkyWayAnimation(this.container);
                    break;
                case 'particles':
                    this.currentAnimation = new ParticleAnimation(this.container);
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
                const barHeight = dataArray[i] / 4;
                this.breathingBars[i].style.height = `${barHeight}px`;
                this.breathingBars[i].style.opacity = 0.5 + barHeight / 50;
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
        const newAnim = currentAnim === 'milkyway' ? 'particles' : 'milkyway';
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
