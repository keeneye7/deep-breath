# 깊은 호흡 명상

이 프로젝트는 깊은 호흡 명상을 위한 웹 애플리케이션입니다. 사용자의 호흡에 반응하는 인터랙티브 3D 시각화를 제공하여 진정되고 몰입감 있는 경험을 제공합니다. 페이지에는 차분한 배경 음악도 포함되어 있습니다.

## 기능
- Three.js를 사용한 인터랙티브 3D 시각화
- 사용자의 마이크를 통한 호흡 감지
- 차분한 배경 음악
- 간단하고 깔끔한 사용자 인터페이스

## 설정 방법

### 사전 요구 사항
- 컴퓨터에 Node.js 및 npm이 설치되어 있어야 합니다.
- ffmpeg가 설치되어 시스템의 PATH에서 접근 가능해야 합니다. (MP3 파일 생성 시 필요)

### 설치

1. **레포지토리 클론:**
   ```bash
   git clone https://github.com/yourusername/deep-breathing-meditation.git
   cd deep-breathing-meditation
필요한 npm 패키지 설치:

bash
Copy code
npm install express
프로젝트 디렉토리에 music.mp3 파일을 추가합니다.

사용 방법
서버 실행:

bash
Copy code
node server.js
웹 브라우저를 열고 다음 주소로 이동:

arduino
Copy code
http://localhost:3000/
파일 구조
bash
Copy code
deep-breathing-meditation/
│
├── index.html           # 메인 HTML 파일
├── styles.css           # CSS 스타일
├── script.js            # Three.js 및 호흡 시각화를 위한 JavaScript 파일
├── server.js            # MP3 파일을 스트리밍하는 Node.js 서버
├── music.mp3            # 배경 음악 파일 (직접 추가)
├── package.json         # Node.js 패키지 설정
└── README.md            # 프로젝트 문서
작동 원리
index.html: Three.js 장면의 컨테이너와 오디오 요소를 포함하여 페이지의 기본 구조를 설정하는 메인 HTML 파일입니다.
styles.css: 페이지를 스타일링하는 CSS로, 검은색 배경과 콘텐츠를 중앙에 배치합니다.
script.js: Three.js 설정을 처리하고, 사용자의 호흡에 따라 회전하고 확대/축소되는 3D 구를 생성합니다. Web Audio API를 사용하여 사용자의 마이크 입력을 분석합니다.
server.js: HTML 파일을 제공하고 MP3 파일을 스트리밍하는 간단한 Express.js 서버입니다.
music.mp3: 명상 세션에 사용할 배경 음악 파일입니다.
음악 파일 생성
배경 음악으로 사용할 차분한 톤을 생성해야 하는 경우 다음 Python 스크립트를 사용할 수 있습니다:

python
Copy code
from pydub import AudioSegment
from pydub.generators import Sine

# 사인파 생성기 생성
sine_wave = Sine(440)  # 440 Hz는 A4 음의 주파수입니다.

# 2분 길이의 오디오 세그먼트 생성
audio_segment = sine_wave.to_audio_segment(duration=120000)  # 120000 ms = 2분

# 볼륨 조정
audio_segment = audio_segment - 20  # 볼륨을 20dB 줄입니다.

# 부드러운 루프를 위해 페이드 인 및 페이드 아웃 적용
audio_segment = audio_segment.fade_in(2000).fade_out(2000)

# 오디오 세그먼트를 MP3 파일로 내보내기
audio_segment.export("music.mp3", format="mp3")

print("music.mp3 파일이 성공적으로 생성되었습니다.")
필요한 라이브러리 설치:

bash
Copy code
pip install pydub
ffmpeg 설치 및 시스템 PATH에서 접근 가능하게 설정합니다.

스크립트 실행:

bash
Copy code
python generate_music.py
이 스크립트는 music.mp3 파일을 생성하여 배경 음악으로 사용할 수 있습니다.

라이선스
이 프로젝트는 오픈 소스이며 MIT 라이선스 하에 제공됩니다.

mathematica
Copy code

이 `README.md` 파일은 프로젝트에 대한 개요, 설정 방법, 파일 구조 및 사용 방법을 제공합니다. 레포지토리 URL을 실제 GitHub 레포지토리 URL로 대체하십시오.
