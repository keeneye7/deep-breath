// src/components/audio/AudioManager.js
import { EventEmitter } from '../../utils/EventEmitter.js';

export class AudioManager extends EventEmitter {
    constructor() {
        super();
        this.audioElement = null;
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.currentTrack = null;
        this.volume = 0.5;
        this.isPlaying = false;
        this.isLooping = true;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // 기존 오디오 엘리먼트 찾기 또는 생성
            this.audioElement = document.getElementById('background-music') || this.createAudioElement();
            
            // Web Audio API 컨텍스트 생성
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.gainNode = this.audioContext.createGain();
            
            // 오디오 엘리먼트를 Web Audio API에 연결
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            source.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // 초기 설정
            this.gainNode.gain.value = this.volume;
            this.audioElement.loop = this.isLooping;
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.emit('initialized');
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.emit('error', error);
        }
    }

    createAudioElement() {
        const audio = document.createElement('audio');
        audio.id = 'background-music';
        audio.src = 'audio.mp3'; // 기본 트랙
        audio.preload = 'auto';
        document.body.appendChild(audio);
        return audio;
    }

    setupEventListeners() {
        if (!this.audioElement) return;

        this.audioElement.addEventListener('loadstart', () => {
            this.emit('loadStart');
        });

        this.audioElement.addEventListener('canplay', () => {
            this.emit('canPlay');
        });

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.emit('play');
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.emit('pause');
        });

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.emit('ended');
        });

        this.audioElement.addEventListener('error', (e) => {
            this.emit('error', e.error);
        });

        this.audioElement.addEventListener('timeupdate', () => {
            this.emit('timeUpdate', {
                currentTime: this.audioElement.currentTime,
                duration: this.audioElement.duration,
                progress: this.audioElement.duration ? this.audioElement.currentTime / this.audioElement.duration : 0
            });
        });

        this.audioElement.addEventListener('volumechange', () => {
            this.volume = this.audioElement.volume;
            this.emit('volumeChange', this.volume);
        });
    }

    // 재생 제어 메서드
    async play() {
        if (!this.audioElement) return;

        try {
            // 사용자 상호작용 후에만 재생 가능
            await this.audioElement.play();
            this.isPlaying = true;
            this.emit('playStarted');
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.emit('playError', error);
        }
    }

    pause() {
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.isPlaying = false;
        this.emit('paused');
    }

    stop() {
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.emit('stopped');
    }

    // 볼륨 제어
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        
        this.emit('volumeChanged', this.volume);
    }

    getVolume() {
        return this.volume;
    }

    // 트랙 관리
    async loadTrack(src, metadata = {}) {
        if (!this.audioElement) return;

        const wasPlaying = this.isPlaying;
        
        try {
            this.audioElement.src = src;
            this.currentTrack = {
                src,
                ...metadata,
                loadedAt: Date.now()
            };
            
            this.emit('trackLoading', this.currentTrack);
            
            // 메타데이터 로드 대기
            await new Promise((resolve, reject) => {
                const onLoadedMetadata = () => {
                    this.audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.audioElement.removeEventListener('error', onError);
                    resolve();
                };
                
                const onError = (e) => {
                    this.audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.audioElement.removeEventListener('error', onError);
                    reject(e);
                };
                
                this.audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
                this.audioElement.addEventListener('error', onError);
            });
            
            this.emit('trackLoaded', this.currentTrack);
            
            // 이전에 재생 중이었다면 자동 재생
            if (wasPlaying) {
                await this.play();
            }
            
        } catch (error) {
            console.error('Failed to load track:', error);
            this.emit('trackLoadError', error);
        }
    }

    getCurrentTrack() {
        return this.currentTrack;
    }

    // 루프 설정
    setLoop(loop) {
        this.isLooping = loop;
        if (this.audioElement) {
            this.audioElement.loop = loop;
        }
        this.emit('loopChanged', loop);
    }

    // 재생 위치 제어
    setCurrentTime(time) {
        if (!this.audioElement) return;
        
        this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration || 0));
        this.emit('seeked', this.audioElement.currentTime);
    }

    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }

    getDuration() {
        return this.audioElement ? this.audioElement.duration : 0;
    }

    // 오디오 분석 데이터 가져오기
    getAnalyserData() {
        if (!this.analyser) return null;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        return {
            frequencyData: Array.from(dataArray),
            bufferLength,
            sampleRate: this.audioContext ? this.audioContext.sampleRate : 44100
        };
    }

    // 페이드 인/아웃 효과
    async fadeIn(duration = 1000) {
        if (!this.gainNode) return;

        const startVolume = 0;
        const endVolume = this.volume;
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + (duration / 1000);

        this.gainNode.gain.setValueAtTime(startVolume, startTime);
        this.gainNode.gain.linearRampToValueAtTime(endVolume, endTime);
        
        this.emit('fadeInStarted', { duration, startVolume, endVolume });
        
        // 페이드 완료 대기
        setTimeout(() => {
            this.emit('fadeInCompleted');
        }, duration);
    }

    async fadeOut(duration = 1000) {
        if (!this.gainNode) return;

        const startVolume = this.gainNode.gain.value;
        const endVolume = 0;
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + (duration / 1000);

        this.gainNode.gain.setValueAtTime(startVolume, startTime);
        this.gainNode.gain.linearRampToValueAtTime(endVolume, endTime);
        
        this.emit('fadeOutStarted', { duration, startVolume, endVolume });
        
        // 페이드 완료 후 일시정지
        setTimeout(() => {
            this.pause();
            this.gainNode.gain.value = this.volume; // 볼륨 복원
            this.emit('fadeOutCompleted');
        }, duration);
    }

    // 크로스페이드 (다음 단계에서 구현)
    async crossfade(newSrc, duration = 3000) {
        // 향후 구현 예정
        this.emit('crossfadeRequested', { newSrc, duration });
    }

    // 정리
    dispose() {
        this.stop();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.removeAllListeners();
        this.isInitialized = false;
        this.emit('disposed');
    }

    // 상태 정보
    getState() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            volume: this.volume,
            isLooping: this.isLooping,
            currentTrack: this.currentTrack,
            currentTime: this.getCurrentTime(),
            duration: this.getDuration()
        };
    }
}
