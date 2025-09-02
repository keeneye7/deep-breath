// src/services/MusicService.js - 음악 API 통합 서비스
import { EventEmitter } from '../utils/EventEmitter.js';

export class MusicService extends EventEmitter {
    constructor() {
        super();
        this.currentTrack = null;
        this.playlist = [];
        this.isPlaying = false;
        this.volume = 0.7;
        this.audioElement = null;
        this.apiKeys = {
            freesound: null, // 환경변수에서 로드 예정
            pixabay: null    // 환경변수에서 로드 예정
        };
        
        // 음악 카테고리 정의
        this.categories = {
            meditation: ['meditation', 'ambient', 'zen', 'mindfulness'],
            nature: ['rain', 'ocean', 'forest', 'birds', 'water'],
            instrumental: ['piano', 'guitar', 'flute', 'strings'],
            binaural: ['binaural', 'theta', 'alpha', 'delta'],
            chanting: ['om', 'mantra', 'tibetan', 'singing bowl']
        };
        
        this.init();
    }
    
    async init() {
        try {
            // 오디오 엘리먼트 생성
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.volume = this.volume;
            
            // 오디오 이벤트 리스너 설정
            this.setupAudioEventListeners();
            
            // 기본 플레이리스트 로드
            await this.loadDefaultPlaylist();
            
            this.emit('initialized');
            console.log('🎵 MusicService initialized');
            
        } catch (error) {
            console.error('❌ MusicService initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    setupAudioEventListeners() {
        this.audioElement.addEventListener('loadstart', () => {
            this.emit('loading', this.currentTrack);
        });
        
        this.audioElement.addEventListener('canplay', () => {
            this.emit('ready', this.currentTrack);
        });
        
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.emit('play', this.currentTrack);
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.emit('pause', this.currentTrack);
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.emit('ended', this.currentTrack);
            this.playNext();
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('🎵 Audio error:', e);
            this.emit('audioError', e);
            this.playNext(); // 오류 시 다음 곡으로
        });
        
        this.audioElement.addEventListener('timeupdate', () => {
            if (this.currentTrack) {
                const progress = {
                    currentTime: this.audioElement.currentTime,
                    duration: this.audioElement.duration,
                    percentage: (this.audioElement.currentTime / this.audioElement.duration) * 100
                };
                this.emit('progress', progress);
            }
        });
    }
    
    async loadDefaultPlaylist() {
        // 기본 로컬 음악 파일들 (저작권 무료)
        const defaultTracks = [
            {
                id: 'local_ambient_1',
                title: 'Deep Meditation',
                artist: 'DeepBreath',
                url: './audio.mp3', // 기존 파일 활용
                category: 'meditation',
                duration: 300, // 5분
                isLocal: true
            }
        ];
        
        this.playlist = [...defaultTracks];
        
        // 외부 API에서 추가 음악 로드 시도
        try {
            const apiTracks = await this.fetchTracksFromAPIs();
            this.playlist = [...this.playlist, ...apiTracks];
        } catch (error) {
            console.warn('⚠️ Could not load tracks from external APIs:', error);
        }
        
        this.emit('playlistUpdated', this.playlist);
    }
    
    async fetchTracksFromAPIs() {
        const tracks = [];
        
        // Freesound API 호출 (무료 명상 음악)
        try {
            const freesoundTracks = await this.fetchFromFreesound();
            tracks.push(...freesoundTracks);
        } catch (error) {
            console.warn('⚠️ Freesound API error:', error);
        }
        
        // Pixabay API 호출 (무료 음악)
        try {
            const pixabayTracks = await this.fetchFromPixabay();
            tracks.push(...pixabayTracks);
        } catch (error) {
            console.warn('⚠️ Pixabay API error:', error);
        }
        
        return tracks;
    }
    
    async fetchFromFreesound() {
        // Freesound API 구현 (API 키 필요)
        // 현재는 모의 데이터 반환
        return [
            {
                id: 'freesound_1',
                title: 'Tibetan Singing Bowl',
                artist: 'Freesound Community',
                url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
                category: 'chanting',
                duration: 180,
                source: 'freesound'
            },
            {
                id: 'freesound_2',
                title: 'Rain Forest Ambience',
                artist: 'Freesound Community',
                url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
                category: 'nature',
                duration: 600,
                source: 'freesound'
            }
        ];
    }
    
    async fetchFromPixabay() {
        // Pixabay API 구현 (API 키 필요)
        // 현재는 모의 데이터 반환
        return [
            {
                id: 'pixabay_1',
                title: 'Peaceful Piano',
                artist: 'Pixabay Music',
                url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
                category: 'instrumental',
                duration: 240,
                source: 'pixabay'
            }
        ];
    }
    
    // 음악 재생 제어
    async play(trackId = null) {
        try {
            if (trackId) {
                const track = this.playlist.find(t => t.id === trackId);
                if (track) {
                    await this.loadTrack(track);
                }
            }
            
            if (this.audioElement.src) {
                await this.audioElement.play();
            }
        } catch (error) {
            console.error('🎵 Play error:', error);
            this.emit('error', error);
        }
    }
    
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
        }
    }
    
    async toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            await this.play();
        }
    }
    
    async loadTrack(track) {
        this.currentTrack = track;
        this.audioElement.src = track.url;
        this.emit('trackChanged', track);
    }
    
    playNext() {
        if (this.playlist.length === 0) return;
        
        const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrack?.id);
        const nextIndex = (currentIndex + 1) % this.playlist.length;
        const nextTrack = this.playlist[nextIndex];
        
        this.play(nextTrack.id);
    }
    
    playPrevious() {
        if (this.playlist.length === 0) return;
        
        const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrack?.id);
        const prevIndex = currentIndex <= 0 ? this.playlist.length - 1 : currentIndex - 1;
        const prevTrack = this.playlist[prevIndex];
        
        this.play(prevTrack.id);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        this.emit('volumeChanged', this.volume);
    }
    
    getVolume() {
        return this.volume;
    }
    
    // 카테고리별 음악 필터링
    getTracksByCategory(category) {
        return this.playlist.filter(track => track.category === category);
    }
    
    // 랜덤 재생
    playRandom() {
        if (this.playlist.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        const randomTrack = this.playlist[randomIndex];
        this.play(randomTrack.id);
    }
    
    // 플레이리스트 관리
    addTrack(track) {
        this.playlist.push(track);
        this.emit('playlistUpdated', this.playlist);
    }
    
    removeTrack(trackId) {
        this.playlist = this.playlist.filter(t => t.id !== trackId);
        this.emit('playlistUpdated', this.playlist);
    }
    
    // 현재 상태 반환
    getState() {
        return {
            currentTrack: this.currentTrack,
            isPlaying: this.isPlaying,
            volume: this.volume,
            playlist: this.playlist,
            currentTime: this.audioElement?.currentTime || 0,
            duration: this.audioElement?.duration || 0
        };
    }
    
    // 정리
    destroy() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
        this.removeAllListeners();
    }
}

// 싱글톤 인스턴스 생성
export const musicService = new MusicService();
