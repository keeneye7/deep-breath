// src/services/MusicService.js - Refactored for Time-based Curation & Tiers
import { EventEmitter } from '../utils/EventEmitter.js';
import { stateManager } from './StateManager.js';

export class MusicService extends EventEmitter {
    constructor() {
        super();
        this.currentTrack = null;
        this.playlist = [];
        this.isPlaying = false;
        this.volume = 0.7;
        this.audioElement = null;

        // 시간대별 테마 추천 설정
        this.timeRecommendations = {
            dawn: { categories: ['chanting', 'binaural'], title: '신비로운 새벽의 소리' },
            day: { categories: ['nature', 'instrumental'], title: '활기찬 하루의 동반자' },
            dusk: { categories: ['meditation', 'ambient'], title: '노을과 함께하는 명상' },
            night: { categories: ['sleep', 'binaural'], title: '깊은 안식을 위한 밤' }
        };

        this.init();
    }

    async init() {
        try {
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.volume = this.volume;

            this.setupAudioEventListeners();

            // 초기 환경 데이터 로드 대기 후 플레이리스트 구성
            await this.loadPlaylist().catch(err => {
                console.error('Initial playlist load failed:', err);
            });

            // 시간 변화 감지하여 플레이리스트 자동 갱신
            stateManager.env.on('timePhaseChanged', async () => {
                await this.loadPlaylist().catch(e => console.error('Time phase change playlist reload failed:', e));
            });

            // 티어 변경 시 플레이리스트 갱신
            stateManager.user.on('tierChanged', async () => {
                await this.loadPlaylist().catch(e => console.error('Tier change playlist reload failed:', e));
            });

            this.emit('initialized');
        } catch (error) {
            console.error('❌ MusicService initialization failed:', error);
            this.emit('error', error);
        }
    }

    setupAudioEventListeners() {
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.emit('play', this.currentTrack);
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.emit('pause', this.currentTrack);
        });

        this.audioElement.addEventListener('ended', () => {
            this.playNext();
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio element error:', e);

            // If the current track is external and failed, fallback to local track
            if (this.currentTrack && this.currentTrack.url !== './audio.mp3') {
                console.warn('External track failed, falling back to local audio.mp3');
                this.loadTrack({
                    id: 'fallback',
                    title: 'Deep Stillness (Local)',
                    artist: 'DeepBreath',
                    url: './audio.mp3'
                });
                this.play().catch(err => console.error('Fallback play failed:', err));
                return;
            }

            // 일반적인 에러 발생 시 3초 후 다음 곡 재생 (무한 루프 방지)
            if (!this._errorRetryTimeout) {
                this._errorRetryTimeout = setTimeout(() => {
                    this._errorRetryTimeout = null;
                    this.playNext();
                }, 3000);
            }
        });
        this.audioElement.addEventListener('timeupdate', () => {
            if (this.currentTrack) {
                this.emit('progress', {
                    currentTime: this.audioElement.currentTime,
                    duration: this.audioElement.duration,
                    percentage: (this.audioElement.currentTime / this.audioElement.duration) * 100
                });
            }
        });
    }

    async loadPlaylist() {
        const timePhase = stateManager.env.getState('timePhase') || 'day';
        const userTier = stateManager.user.getState('tier') || 'free';
        const rec = this.timeRecommendations[timePhase];

        const allTracks = [
            { id: 'm1', title: 'Deep Zen', artist: 'DeepBreath', category: 'meditation', tier: 'free', url: './audio.mp3' },
            { id: 'm2', title: 'Forest Rain', artist: 'DeepBreath', category: 'nature', tier: 'free', url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3' },
            { id: 'p1', title: 'Singing Bowl Gold', artist: 'Premium', category: 'chanting', tier: 'paid', url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3' },
            { id: 'p2', title: 'Cosmic Alpha', artist: 'Premium', category: 'binaural', tier: 'paid', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
            { id: 'p3', title: 'Midnight Sleep', artist: 'Premium', category: 'sleep', tier: 'paid', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' }
        ];

        // 플레이리스트 구성: 현재 시간대 카테고리 트랙들
        this.playlist = allTracks.filter(track => rec.categories.includes(track.category));

        console.log(`🎵 Playlist updated for [${timePhase}] phase and [${userTier}] tier. Status: ${this.playlist.length} tracks.`);
        this.emit('playlistUpdated', {
            playlist: this.playlist,
            recommendationTitle: rec.title,
            userTier: userTier
        });

        // 현재 선택된 곡이 플레이리스트에 없으면 첫 번째 곡으로 로드
        if (!this.currentTrack || !this.playlist.find(t => t.id === this.currentTrack.id)) {
            const firstAvailable = this.playlist.find(t => t.tier === 'free') || this.playlist[0];
            if (firstAvailable) this.loadTrack(firstAvailable);
        }
    }

    async loadTrack(track) {
        if (!track || !track.url) return;

        try {
            this.currentTrack = track;
            this.audioElement.src = track.url;
            this.emit('trackChanged', track);
        } catch (error) {
            console.error('Failed to load track:', error);
            this.emit('error', error);
        }
    }

    async play(trackId = null) {
        try {
            let trackToPlay = null;
            if (trackId) {
                trackToPlay = this.playlist.find(t => t.id === trackId);
            } else {
                trackToPlay = this.currentTrack;
            }

            if (trackToPlay) {
                const userTier = stateManager.user.getState('tier');
                if (trackToPlay.tier === 'paid' && userTier !== 'paid') {
                    this.emit('premiumRequired', trackToPlay);
                    return;
                }

                // Track loading is now part of play to ensure consistency
                if (this.audioElement.src !== trackToPlay.url) {
                    await this.loadTrack(trackToPlay);
                }

                if (this.audioElement.src) {
                    await this.audioElement.play();
                }
            }
        } catch (error) {
            console.error('Playback failed:', error);
            this.emit('error', error);
        }
    }

    pause() { this.audioElement.pause(); }
    async toggle() { this.isPlaying ? this.pause() : await this.play(); }

    playNext() {
        if (this.playlist.length === 0) return;
        const idx = this.playlist.findIndex(t => t.id === this.currentTrack?.id);
        const next = this.playlist[(idx + 1) % this.playlist.length];
        this.play(next.id);
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.audioElement) this.audioElement.volume = this.volume;
        this.emit('volumeChanged', this.volume);
    }

    getState() {
        return {
            currentTrack: this.currentTrack,
            isPlaying: this.isPlaying,
            playlist: this.playlist,
            tier: stateManager.user.getState('tier')
        };
    }
}

export const musicService = new MusicService();
