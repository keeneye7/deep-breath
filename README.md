# DeepBreath.us | 시간 기반 명상 경험

**DeepBreath.us**는 Three.js를 활용한 인터랙티브 명상 및 오디오 비주얼라이저 웹 애플리케이션입니다. 시간의 흐름에 따라 변화하는 우주적 경험을 제공하며, 사용자의 호흡과 동기화되는 시각적 효과를 통해 깊은 명상 상태로 안내합니다.

## ✨ 주요 기능

- 🌌 **다양한 Three.js 애니메이션**: 
  - **Free Tier**: Milky Way, Particles, Cosmic Web, Flow Field
  - **Premium Tier**: Nebula, Geometric Morph, Aura
- 🎵 **오디오 비주얼라이저**: 실시간 오디오 분석 및 반응형 시각화
- 🎤 **마이크 연동**: 사용자의 호흡을 감지하여 애니메이션에 반영
- ⏱️ **명상 세션 타이머**: 시간 기반 명상 세션 관리
- 🎨 **반응형 UI**: 모바일 및 데스크톱 최적화
- 🌓 **시간대별 테마**: 하루의 시간에 따라 변화하는 분위기
- ⌨️ **키보드 단축키**: 빠른 컨트롤을 위한 단축키 지원


## 🚀 시작하기

### 필수 요구사항
- Node.js (v14 이상)
- 최신 웹 브라우저 (WebGL 지원 필수)

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/keeneye7/deep-breath.git
   cd deep-breath
   ```

2. **로컬 서버 실행**
   ```bash
   npx -y serve -p 3000 .
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

### 프리미엄 기능 테스트

프리미엄 애니메이션을 테스트하려면 URL에 query string을 추가하세요:

```
http://localhost:3000?premium=true
http://localhost:3000?tier=paid
http://localhost:3000?membership=premium
```

다시 무료 버전으로 돌아가려면:

```
http://localhost:3000?premium=false
http://localhost:3000?tier=free
```

> 💡 **Tip**: Query string 설정은 localStorage보다 우선순위가 높으므로 즉시 적용됩니다.

## 📁 프로젝트 구조

```plaintext
deep-breath/
│
├── index.html                 # 메인 HTML 파일
├── main.js                    # 앱 초기화 및 이벤트 핸들링
├── styles.css                 # 전역 스타일시트
├── audio.mp3                  # 배경 음악
├── logo.svg                   # 로고 파일
├── favicon.webp               # 파비콘
│
├── src/
│   ├── DeepBreathApp.js       # 메인 앱 클래스 (앱 전체 관리)
│   │
│   ├── components/            # UI 및 시각 컴포넌트
│   │   ├── animations/        # Three.js 애니메이션
│   │   │   ├── MilkyWay.js    # 은하수 애니메이션 (Free)
│   │   │   ├── Particles.js   # 파티클 시스템 (Free)
│   │   │   ├── CosmicWeb.js   # 우주 그물망 효과 (Free)
│   │   │   ├── FlowField.js   # 플로우 필드 파티클 (Free)
│   │   │   ├── Nebula.js      # 성운 효과 (Premium)
│   │   │   ├── GeometricMorph.js # 기하학적 변형 (Premium)
│   │   │   └── Aura.js        # 오라 효과 (Premium)
│   │   │
│   │   ├── audio/             # 오디오 관련 컴포넌트
│   │   │   └── AudioManager.js # 오디오 분석 및 관리
│   │   │
│   │   └── ui/                # UI 컴포넌트
│   │       └── MusicControls.js # 음악 컨트롤 UI
│   │
│   ├── services/              # 비즈니스 로직 서비스
│   │   ├── MusicService.js    # 음악 재생 관리
│   │   ├── StateManager.js    # 앱 상태 관리
│   │   └── TimeService.js     # 시간 기반 로직
│   │
│   ├── contexts/              # 컨텍스트 (앱 전역 상태)
│   │   ├── EnvironmentContext.js # 환경 설정
│   │   ├── SessionContext.js     # 세션 관리
│   │   └── UserContext.js        # 사용자 정보
│   │
│   └── utils/                 # 유틸리티 함수
│       ├── EventEmitter.js    # 이벤트 시스템
│       └── ContentData.js     # 콘텐츠 데이터
│
├── milkyway.js                # 레거시 은하수 스크립트
├── particle.js                # 레거시 파티클 스크립트
│
└── plan/                      # 프로젝트 기획 문서
```

## 🎮 사용법

### 기본 컨트롤

- **Space**: 음악 재생/일시정지
- **Tab**: 애니메이션 전환 (Free: Milky Way → Particles → Cosmic Web → Flow Field | Premium: + Nebula → Geometric → Aura)
- **S**: 명상 세션 시작/종료
- **R**: 앱 리셋
- **F**: 전체화면 토글
- **↑/↓**: 볼륨 조절

### UI 버튼

- **Explore**: 콘텐츠 모드 (저널, 가이드 등)
- **Start**: 명상 세션 시작
- **Animation**: 애니메이션 전환
- **Music**: 음악 재생/일시정지
- **Reset**: 씬 리셋
- **Volume Slider**: 볼륨 조절

## 🎬 애니메이션 소개

### Free Tier 애니메이션

#### 🌌 Milky Way (은하수)
수만 개의 별들이 우주 공간을 떠다니며 다양한 패턴으로 변화합니다. 호흡에 따라 별들의 움직임과 밀도가 변화하여 깊은 우주 속을 여행하는 듯한 경험을 제공합니다.

#### ✨ Particles (파티클)
15,000개의 메인 파티클, 2,000개의 트레일 파티클, 20개의 발광 오브로 구성된 다층 파티클 시스템입니다. 커스텀 셰이더를 사용하여 부드러운 발광 효과를 구현하고, 마우스 움직임과 호흡에 실시간으로 반응합니다. 각 파티클은 그라데이션 색상(청록→보라→분홍)을 가지며 유기적으로 움직입니다.

#### 🕸️ Cosmic Web (우주 그물망)
150개의 노드가 서로 연결되어 살아있는 우주 네트워크를 형성합니다. 각 노드는 유기적으로 움직이며, 가까운 노드들끼리 빛의 선으로 연결됩니다. 호흡에 따라 네트워크의 활동성이 변화합니다.

#### 🌊 Flow Field (플로우 필드)
10,000개의 파티클이 3D 플로우 필드를 따라 흐릅니다. 수학적 노이즈 함수를 사용하여 자연스러운 흐름을 생성하며, 호흡 강도에 따라 흐름의 속도와 방향이 변화합니다.

### Premium Tier 애니메이션

#### 🌈 Nebula (성운)
커스텀 셰이더를 사용한 다층 구조의 성운 효과입니다. 분홍, 보라, 파랑, 청록색의 구름 레이어가 겹쳐지며 회전하고, 3,000개의 별들이 배경을 장식합니다. 호흡에 따라 성운의 밀도와 회전 속도가 조절됩니다.

#### 🔷 Geometric Morph (기하학적 변형)
정이십면체, 정팔면체, 정사면체, 정십이면체, 토러스, 토러스 매듭 등 6가지 기하학적 도형이 부드럽게 변형됩니다. 와이어프레임 렌더링과 500개의 궤도 파티클이 미래지향적인 시각 효과를 만듭니다.

#### 💫 Aura (오라)
3개의 동심원 링이 겹쳐지며 일렁이는 프리미엄 오라 효과입니다. 각 링은 서로 다른 속도로 회전하며, 호흡에 따라 크기가 변화합니다. 2,000개의 먼지 입자가 부드러운 분위기를 연출합니다.

## 🎨 커스터마이징

### 애니메이션 추가

새로운 Three.js 애니메이션을 추가하려면:

1. `src/components/animations/` 폴더에 새 파일 생성
2. 기본 애니메이션 클래스 구조 따르기:
   ```javascript
   export class MyAnimation {
       constructor(scene, camera, renderer) {
           this.scene = scene;
           this.camera = camera;
           this.renderer = renderer;
           this.init();
       }
       
       init() {
           // 초기화 로직
       }
       
       update(audioData) {
           // 애니메이션 업데이트
       }
       
       dispose() {
           // 리소스 정리
       }
   }
   ```
3. `DeepBreathApp.js`에 애니메이션 등록

### 배경 음악 변경

`audio.mp3` 파일을 원하는 음악 파일로 교체하거나, `index.html`의 audio 태그 src 속성을 수정하세요.

### 스타일 수정

`styles.css` 파일에서 색상, 레이아웃, 애니메이션 등을 커스터마이징할 수 있습니다.

## 🔧 개발 모드

로컬 환경에서 실행 시 자동으로 디버그 모드가 활성화됩니다:

```javascript
// 브라우저 콘솔에서 사용 가능

// 기본 컨트롤
deepBreathDebug.getState()        // 현재 앱 상태 확인
deepBreathDebug.toggleAnimation() // 애니메이션 전환
deepBreathDebug.toggleSession()   // 세션 토글
deepBreathDebug.reset()           // 앱 리셋

// 프리미엄 티어 컨트롤
deepBreathDebug.enablePremium()   // 프리미엄 활성화
deepBreathDebug.disablePremium()  // 프리미엄 비활성화
deepBreathDebug.getTier()         // 현재 티어 확인
```

## 🌟 향후 계획

- [ ] AI 기반 실시간 비주얼 생성 (프리미엄 기능)
- [ ] 더 다양한 Three.js 효과 추가
- [ ] 사용자 커스텀 애니메이션 업로드
- [ ] 소셜 공유 기능
- [ ] 명상 통계 및 진행 상황 추적
- [ ] 다국어 지원 확대

## 🤝 기여하기

기여를 환영합니다! 버그 리포트, 기능 제안, 풀 리퀘스트 모두 환영합니다.

### 기여 방법
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🌐 라이브 데모

[deepbreath.us](https://deepbreath.us)에서 라이브 데모를 확인하세요.

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for mindful breathing and cosmic connection**
