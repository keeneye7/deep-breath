// src/services/StateManager.js
import { EventEmitter } from '../utils/EventEmitter.js';

export class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = {
            // 애니메이션 상태
            currentAnimation: 'milkyway',
            animationSettings: {
                milkyway: {
                    targetScale: 1,
                    maxScale: 2,
                    phase: 0
                },
                particles: {
                    coordScale: 0.5,
                    noiseIntensity: 0.0005,
                    pointSize: 1
                }
            },
            
            // 오디오 상태
            audio: {
                volume: 0.5,
                isPlaying: false,
                currentTrack: null,
                isLooping: true
            },
            
            // 사용자 설정
            userSettings: {
                preferredAnimation: 'milkyway',
                autoStart: true,
                microphoneEnabled: true,
                theme: 'dark',
                language: 'ko'
            },
            
            // 세션 상태
            session: {
                isActive: false,
                startTime: null,
                duration: 0,
                breathingData: [],
                currentPhase: 'idle' // idle, active, paused, completed
            },
            
            // 분석 데이터
            analytics: {
                totalSessions: 0,
                totalDuration: 0,
                averageSessionLength: 0,
                lastSessionDate: null
            }
        };
        
        this.loadFromStorage();
    }

    // 상태 업데이트 메서드
    setState(path, value) {
        const keys = path.split('.');
        let current = this.state;
        
        // 중첩된 객체 탐색
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // 변경 이벤트 발생
        this.emit('stateChanged', { path, value, oldValue });
        this.emit(`${path}Changed`, value, oldValue);
        
        // 로컬 스토리지에 저장
        this.saveToStorage();
    }

    // 상태 조회 메서드
    getState(path) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }

    // 애니메이션 관련 메서드
    setCurrentAnimation(animationType) {
        this.setState('currentAnimation', animationType);
        this.setState('userSettings.preferredAnimation', animationType);
    }

    updateAnimationSettings(animationType, settings) {
        const currentSettings = this.getState(`animationSettings.${animationType}`) || {};
        const newSettings = { ...currentSettings, ...settings };
        this.setState(`animationSettings.${animationType}`, newSettings);
    }

    // 오디오 관련 메서드
    setVolume(volume) {
        this.setState('audio.volume', Math.max(0, Math.min(1, volume)));
    }

    setAudioPlaying(isPlaying) {
        this.setState('audio.isPlaying', isPlaying);
    }

    setCurrentTrack(track) {
        this.setState('audio.currentTrack', track);
    }

    // 세션 관리 메서드
    startSession() {
        const now = Date.now();
        this.setState('session.isActive', true);
        this.setState('session.startTime', now);
        this.setState('session.currentPhase', 'active');
        this.setState('session.breathingData', []);
        
        this.emit('sessionStarted', now);
    }

    pauseSession() {
        this.setState('session.currentPhase', 'paused');
        this.emit('sessionPaused');
    }

    resumeSession() {
        this.setState('session.currentPhase', 'active');
        this.emit('sessionResumed');
    }

    endSession() {
        const startTime = this.getState('session.startTime');
        const duration = startTime ? Date.now() - startTime : 0;
        
        this.setState('session.isActive', false);
        this.setState('session.duration', duration);
        this.setState('session.currentPhase', 'completed');
        
        // 분석 데이터 업데이트
        this.updateAnalytics(duration);
        
        this.emit('sessionEnded', {
            duration,
            breathingData: this.getState('session.breathingData')
        });
    }

    addBreathingData(data) {
        const currentData = this.getState('session.breathingData') || [];
        const newData = [...currentData, {
            timestamp: Date.now(),
            ...data
        }];
        
        this.setState('session.breathingData', newData);
    }

    // 분석 데이터 업데이트
    updateAnalytics(sessionDuration) {
        const totalSessions = this.getState('analytics.totalSessions') + 1;
        const totalDuration = this.getState('analytics.totalDuration') + sessionDuration;
        const averageSessionLength = totalDuration / totalSessions;
        
        this.setState('analytics.totalSessions', totalSessions);
        this.setState('analytics.totalDuration', totalDuration);
        this.setState('analytics.averageSessionLength', averageSessionLength);
        this.setState('analytics.lastSessionDate', Date.now());
    }

    // 사용자 설정 메서드
    updateUserSettings(settings) {
        const currentSettings = this.getState('userSettings');
        const newSettings = { ...currentSettings, ...settings };
        this.setState('userSettings', newSettings);
    }

    // 로컬 스토리지 관리
    saveToStorage() {
        try {
            const dataToSave = {
                userSettings: this.getState('userSettings'),
                analytics: this.getState('analytics'),
                animationSettings: this.getState('animationSettings'),
                audio: {
                    volume: this.getState('audio.volume'),
                    isLooping: this.getState('audio.isLooping')
                }
            };
            
            localStorage.setItem('deepbreath_state', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('deepbreath_state');
            if (saved) {
                const data = JSON.parse(saved);
                
                // 저장된 데이터를 현재 상태에 병합
                if (data.userSettings) {
                    this.state.userSettings = { ...this.state.userSettings, ...data.userSettings };
                }
                if (data.analytics) {
                    this.state.analytics = { ...this.state.analytics, ...data.analytics };
                }
                if (data.animationSettings) {
                    this.state.animationSettings = { ...this.state.animationSettings, ...data.animationSettings };
                }
                if (data.audio) {
                    this.state.audio = { ...this.state.audio, ...data.audio };
                }
                
                // 현재 애니메이션을 사용자 선호도로 설정
                if (data.userSettings && data.userSettings.preferredAnimation) {
                    this.state.currentAnimation = data.userSettings.preferredAnimation;
                }
            }
        } catch (error) {
            console.error('Failed to load state from localStorage:', error);
        }
    }

    // 상태 초기화
    reset() {
        this.state = {
            currentAnimation: 'milkyway',
            animationSettings: {
                milkyway: { targetScale: 1, maxScale: 2, phase: 0 },
                particles: { coordScale: 0.5, noiseIntensity: 0.0005, pointSize: 1 }
            },
            audio: { volume: 0.5, isPlaying: false, currentTrack: null, isLooping: true },
            userSettings: { preferredAnimation: 'milkyway', autoStart: true, microphoneEnabled: true, theme: 'dark', language: 'ko' },
            session: { isActive: false, startTime: null, duration: 0, breathingData: [], currentPhase: 'idle' },
            analytics: { totalSessions: 0, totalDuration: 0, averageSessionLength: 0, lastSessionDate: null }
        };
        
        this.saveToStorage();
        this.emit('stateReset');
    }

    // 디버깅용 메서드
    getFullState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // 상태 구독 헬퍼
    subscribe(path, callback) {
        const eventName = `${path}Changed`;
        this.on(eventName, callback);
        
        // 현재 값으로 즉시 호출
        callback(this.getState(path));
        
        // 구독 해제 함수 반환
        return () => this.off(eventName, callback);
    }
}

// 싱글톤 인스턴스 생성
export const stateManager = new StateManager();
