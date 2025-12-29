// src/components/ui/MusicControls.js - 음악 제어 UI 컴포넌트
import { EventEmitter } from '../../utils/EventEmitter.js';

export class MusicControls extends EventEmitter {
    constructor(musicService) {
        super();
        this.musicService = musicService;
        this.container = null;
        this.isVisible = false;
        this.currentTrack = null;

        this.init();
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        this.setupMusicServiceListeners();
        console.log('🎛️ MusicControls initialized');
    }

    createUI() {
        // 메인 컨테이너 생성
        this.container = document.createElement('div');
        this.container.className = 'music-controls';
        this.container.innerHTML = `
            <div class="music-controls-panel">
                <!-- 현재 재생 중인 트랙 정보 -->
                <div class="track-info">
                    <div class="track-title">음악을 선택해주세요</div>
                    <div class="track-artist">DeepBreath</div>
                </div>
                
                <!-- 재생 컨트롤 -->
                <div class="playback-controls">
                    <button class="control-btn prev-btn" title="이전 곡">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    
                    <button class="control-btn play-pause-btn" title="재생/일시정지">
                        <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    </button>
                    
                    <button class="control-btn next-btn" title="다음 곡">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 진행률 바 -->
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                        <div class="progress-handle"></div>
                    </div>
                    <div class="time-display">
                        <span class="current-time">0:00</span>
                        <span class="total-time">0:00</span>
                    </div>
                </div>
                
                <!-- 볼륨 컨트롤 -->
                <div class="volume-container">
                    <button class="volume-btn" title="음소거">
                        <svg class="volume-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                    <div class="volume-slider">
                        <input type="range" class="volume-input" min="0" max="100" value="70">
                    </div>
                </div>
                
                <!-- 플레이리스트 토글 -->
                <button class="playlist-btn" title="플레이리스트">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                </button>
            </div>
            
            <!-- 플레이리스트 패널 -->
            <div class="playlist-panel" style="display: none;">
                <div class="playlist-header">
                    <div class="playlist-recommendation-title">추천 플레이리스트</div>
                    <div class="playlist-categories">
                        <button class="category-btn active" data-category="all">전체</button>
                        <button class="category-btn" data-category="meditation">명상</button>
                        <button class="category-btn" data-category="nature">자연</button>
                        <button class="category-btn" data-category="instrumental">연주</button>
                    </div>
                </div>
                <div class="playlist-content">
                    <!-- 플레이리스트 항목들이 동적으로 추가됨 -->
                </div>
            </div>
        `;

        // 스타일 적용
        this.applyStyles();

        // DOM에 추가
        document.body.appendChild(this.container);
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .music-controls {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 15px;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 1000;
                min-width: 320px;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .music-controls.visible {
                transform: translateY(0);
                opacity: 1;
            }
            
            .music-controls-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .track-info {
                text-align: center;
            }
            
            .track-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .track-artist {
                font-size: 12px;
                opacity: 0.7;
            }
            
            .playback-controls {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
            }
            
            .control-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .control-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }
            
            .play-pause-btn {
                background: rgba(255, 255, 255, 0.1);
                padding: 12px;
            }
            
            .progress-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .progress-bar {
                position: relative;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                cursor: pointer;
            }
            
            .progress-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 2px;
                width: 0%;
                transition: width 0.1s ease;
            }
            
            .progress-handle {
                position: absolute;
                top: -4px;
                left: 0%;
                width: 12px;
                height: 12px;
                background: #4CAF50;
                border-radius: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .progress-bar:hover .progress-handle {
                opacity: 1;
            }
            
            .time-display {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                opacity: 0.7;
            }
            
            .volume-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .volume-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
            }
            
            .volume-slider {
                flex: 1;
            }
            
            .volume-input {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                outline: none;
                -webkit-appearance: none;
            }
            
            .volume-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 12px;
                height: 12px;
                background: #4CAF50;
                border-radius: 50%;
                cursor: pointer;
            }
            
            .playlist-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                margin-left: auto;
            }
            
            .playlist-panel {
                margin-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .playlist-header h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
            }
            
            .playlist-categories {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .category-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .category-btn.active,
            .category-btn:hover {
                background: #4CAF50;
            }
            
            .playlist-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .playlist-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .playlist-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .playlist-item.active {
                background: rgba(76, 175, 80, 0.2);
            }
            
            .playlist-item-info {
                flex: 1;
            }
            
            .playlist-item-title {
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 2px;
            }
            
            .playlist-item-artist {
                font-size: 10px;
                opacity: 0.7;
            }
            
            .playlist-item-duration {
                font-size: 10px;
                opacity: 0.5;
            }
            
            .playlist-recommendation-title {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #4CAF50;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .premium-badge {
                font-size: 9px;
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: white;
                padding: 1px 5px;
                border-radius: 4px;
                margin-left: 8px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .playlist-item.locked {
                opacity: 0.6;
            }
            
            .playlist-item.locked .playlist-item-title::after {
                content: ' 🔒';
                font-size: 10px;
            }
        `;

        document.head.appendChild(style);
    }

    setupEventListeners() {
        const panel = this.container.querySelector('.music-controls-panel');

        // 재생/일시정지 버튼
        const playPauseBtn = panel.querySelector('.play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            this.musicService.toggle();
        });

        // 이전/다음 버튼
        panel.querySelector('.prev-btn').addEventListener('click', () => {
            this.musicService.playPrevious();
        });

        panel.querySelector('.next-btn').addEventListener('click', () => {
            this.musicService.playNext();
        });

        // 진행률 바
        const progressBar = panel.querySelector('.progress-bar');
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            this.seekTo(percentage);
        });

        // 볼륨 슬라이더
        const volumeInput = panel.querySelector('.volume-input');
        volumeInput.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.musicService.setVolume(volume);
        });

        // 볼륨 버튼 (음소거)
        panel.querySelector('.volume-btn').addEventListener('click', () => {
            this.toggleMute();
        });

        // 플레이리스트 토글
        const playlistBtn = panel.querySelector('.playlist-btn');
        const playlistPanel = this.container.querySelector('.playlist-panel');
        playlistBtn.addEventListener('click', () => {
            const isVisible = playlistPanel.style.display !== 'none';
            playlistPanel.style.display = isVisible ? 'none' : 'block';
        });

        // 카테고리 버튼들
        const categoryBtns = this.container.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterPlaylist(btn.dataset.category);
            });
        });
    }

    setupMusicServiceListeners() {
        // 음악 서비스 이벤트 리스너
        this.musicService.on('play', (track) => {
            this.updatePlayPauseButton(true);
            this.updateTrackInfo(track);
        });

        this.musicService.on('pause', () => {
            this.updatePlayPauseButton(false);
        });

        this.musicService.on('trackChanged', (track) => {
            this.updateTrackInfo(track);
            this.updatePlaylistHighlight(track);
        });

        this.musicService.on('progress', (progress) => {
            this.updateProgress(progress);
        });

        this.musicService.on('volumeChanged', (volume) => {
            this.updateVolumeDisplay(volume);
        });

        this.musicService.on('playlistUpdated', (data) => {
            this.updatePlaylist(data.playlist, data.recommendationTitle, data.userTier);
        });

        this.musicService.on('premiumRequired', (track) => {
            this.showPremiumAlert(track);
        });
    }

    updatePlayPauseButton(isPlaying) {
        const playIcon = this.container.querySelector('.play-icon');
        const pauseIcon = this.container.querySelector('.pause-icon');

        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    updateTrackInfo(track) {
        if (!track) return;

        const titleEl = this.container.querySelector('.track-title');
        const artistEl = this.container.querySelector('.track-artist');

        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;

        this.currentTrack = track;
    }

    updateProgress(progress) {
        const progressFill = this.container.querySelector('.progress-fill');
        const progressHandle = this.container.querySelector('.progress-handle');
        const currentTimeEl = this.container.querySelector('.current-time');
        const totalTimeEl = this.container.querySelector('.total-time');

        const percentage = progress.percentage || 0;
        progressFill.style.width = `${percentage}%`;
        progressHandle.style.left = `${percentage}%`;

        currentTimeEl.textContent = this.formatTime(progress.currentTime);
        totalTimeEl.textContent = this.formatTime(progress.duration);
    }

    updateVolumeDisplay(volume) {
        const volumeInput = this.container.querySelector('.volume-input');
        volumeInput.value = volume * 100;
    }

    updatePlaylist(playlist, recommendationTitle, userTier) {
        const playlistContent = this.container.querySelector('.playlist-content');
        const recommendationEl = this.container.querySelector('.playlist-recommendation-title');

        if (recommendationEl && recommendationTitle) {
            recommendationEl.textContent = recommendationTitle;
        }

        playlistContent.innerHTML = '';

        playlist.forEach(track => {
            const isLocked = track.tier === 'paid' && userTier !== 'paid';
            const item = document.createElement('div');
            item.className = `playlist-item ${isLocked ? 'locked' : ''}`;
            item.dataset.trackId = track.id;

            item.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-title">
                        ${track.title}
                        ${track.tier === 'paid' ? '<span class="premium-badge">PAID</span>' : ''}
                    </div>
                    <div class="playlist-item-artist">${track.artist}</div>
                </div>
                <div class="playlist-item-duration">${isLocked ? 'Premium' : '3:00'}</div>
            `;

            item.addEventListener('click', () => {
                this.musicService.play(track.id);
            });

            playlistContent.appendChild(item);
        });
    }

    showPremiumAlert(track) {
        // 간단한 프리미엄 안내창
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 20000; backdrop-filter: blur(5px);
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a1a; padding: 30px; border-radius: 15px;
            max-width: 320px; text-align: center; border: 1px solid #f39c12;
        `;

        dialog.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 20px;">✨</div>
            <h2 style="margin: 0 0 15px; color: #f39c12;">Premium Content</h2>
            <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
                '${track.title}'은 유료 회원 전용 콘텐츠입니다.<br>
                지금 멤버십에 가입하고 고품질 명상 음악과 다양한 기능을 무제한으로 감상하세요.
            </p>
            <button class="upgrade-btn" style="
                background: #f39c12; border: none; color: white;
                padding: 12px 25px; border-radius: 8px; font-weight: bold;
                cursor: pointer; margin-top: 20px; width: 100%;
            ">멤버십 가입하기</button>
            <button class="close-btn" style="
                background: transparent; border: none; color: #777;
                margin-top: 15px; cursor: pointer; font-size: 12px;
            ">나중에 하기</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const safeRemove = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        dialog.querySelector('.close-btn').onclick = safeRemove;
        dialog.querySelector('.upgrade-btn').onclick = () => {
            alert('결제 페이지로 이동합니다 (데모)');
            // 실제 환경에서는 결제 페이지로 이동하거나 stateManager.user.setTier('paid') 호출 시뮬레이션
            stateManager.user.setTier('paid');
            safeRemove();
        };
    }

    updatePlaylistHighlight(track) {
        const items = this.container.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.trackId === track?.id);
        });
    }

    filterPlaylist(category) {
        const items = this.container.querySelectorAll('.playlist-item');
        const playlist = this.musicService.getState().playlist;

        items.forEach(item => {
            const trackId = item.dataset.trackId;
            const track = playlist.find(t => t.id === trackId);

            if (category === 'all' || track?.category === category) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    seekTo(percentage) {
        if (this.musicService.audioElement && this.musicService.audioElement.duration) {
            const newTime = this.musicService.audioElement.duration * percentage;
            this.musicService.audioElement.currentTime = newTime;
        }
    }

    toggleMute() {
        const currentVolume = this.musicService.getVolume();
        if (currentVolume > 0) {
            this.previousVolume = currentVolume;
            this.musicService.setVolume(0);
        } else {
            this.musicService.setVolume(this.previousVolume || 0.7);
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    show() {
        this.isVisible = true;
        this.container.classList.add('visible');
        this.emit('shown');
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('visible');
        this.emit('hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.removeAllListeners();
    }
}
