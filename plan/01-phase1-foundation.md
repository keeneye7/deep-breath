# Phase 1: 기반 시스템 구축 (1-2개월)

## 🎯 목표
현재의 정적 웹사이트를 동적이고 확장 가능한 플랫폼으로 전환하기 위한 기반 인프라를 구축합니다.

## 📋 주요 작업

### 1. 백엔드 API 서버 구축
**기간**: 2주
**우선순위**: 높음

#### 기술 스택
- **Node.js + Express.js** - 빠른 개발과 JavaScript 생태계 활용
- **MongoDB** - 유연한 스키마, 사용자 데이터 저장에 적합
- **JWT** - 토큰 기반 인증
- **bcrypt** - 비밀번호 암호화

#### 구현 내용
```javascript
// 기본 API 구조
/api/auth/          // 인증 관련
/api/users/         // 사용자 관리
/api/music/         // 음악 관리
/api/sessions/      // 명상 세션 기록
/api/preferences/   // 사용자 설정
```

#### 데이터베이스 스키마
```javascript
// User Schema
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  profile: {
    name: String,
    avatar: String,
    preferences: {
      favoriteAnimations: [String],
      preferredMusicGenres: [String],
      sessionDuration: Number
    }
  },
  subscription: {
    plan: String, // 'free', 'premium'
    startDate: Date,
    endDate: Date
  },
  createdAt: Date,
  lastLogin: Date
}

// Session Schema
{
  _id: ObjectId,
  userId: ObjectId,
  duration: Number,
  animation: String,
  music: String,
  breathingData: {
    averageRate: Number,
    consistency: Number
  },
  createdAt: Date
}
```

### 2. 사용자 인증 시스템
**기간**: 1주
**우선순위**: 높음

#### 기능 명세
- 이메일/비밀번호 회원가입
- 로그인/로그아웃
- 비밀번호 재설정
- 소셜 로그인 (Google, 추후 확장)

#### 프론트엔드 컴포넌트
```javascript
// 새로 추가할 UI 컴포넌트
- LoginModal.js
- SignupModal.js
- UserProfile.js
- PasswordReset.js
```

### 3. 프론트엔드 리팩토링
**기간**: 2주
**우선순위**: 중간

#### 현재 구조 개선
```
현재: 단일 HTML 파일
개선: 모듈화된 컴포넌트 구조

src/
├── components/
│   ├── animations/
│   │   ├── MilkyWay.js
│   │   └── Particles.js
│   ├── audio/
│   │   ├── AudioPlayer.js
│   │   └── VolumeControl.js
│   ├── ui/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Modal.js
│   └── auth/
│       ├── LoginForm.js
│       └── SignupForm.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── storage.js
├── utils/
│   ├── constants.js
│   └── helpers.js
└── styles/
    ├── components/
    └── globals.css
```

#### 상태 관리
- **Context API** 사용 (Redux 대신 가벼운 솔루션)
- 사용자 상태, 음악 상태, UI 상태 관리

### 4. 데이터 수집 및 분석 기반
**기간**: 1주
**우선순위**: 중간

#### 수집할 데이터
- 사용자 행동 패턴
- 세션 지속 시간
- 선호하는 애니메이션/음악
- 호흡 패턴 데이터

#### 구현 방법
```javascript
// 간단한 이벤트 트래킹
const trackEvent = (eventName, properties) => {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: new Date(),
      userId: getCurrentUser()?.id
    })
  });
};

// 사용 예시
trackEvent('session_started', {
  animation: 'milkyway',
  duration: 600 // 10분
});
```

## 🛠️ 기술적 구현 세부사항

### 1. 개발 환경 설정
```bash
# 백엔드 설정
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install -D nodemon

# 프론트엔드 빌드 도구 추가
npm install -D webpack webpack-cli babel-loader @babel/core @babel/preset-env
```

### 2. 환경 변수 설정
```env
# .env 파일
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/deepbreath
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:8080
```

### 3. API 엔드포인트 예시
```javascript
// routes/auth.js
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }
    
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 사용자 생성
    const user = new User({
      email,
      password: hashedPassword,
      profile: { name }
    });
    
    await user.save();
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.profile.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});
```

## 📊 성공 지표

### 기술적 지표
- API 응답 시간 < 200ms
- 데이터베이스 쿼리 최적화
- 프론트엔드 번들 크기 < 500KB
- 모바일 성능 점수 > 90

### 사용자 지표
- 회원가입 완료율 > 80%
- 로그인 성공률 > 95%
- 세션 데이터 수집률 > 90%

## 🚨 위험 요소 및 대응

### 1. 데이터 마이그레이션
**위험**: 기존 사용자 데이터 손실
**대응**: 
- 로컬 스토리지 데이터 백업 기능
- 점진적 마이그레이션 전략

### 2. 성능 저하
**위험**: 새로운 기능으로 인한 로딩 시간 증가
**대응**:
- 코드 스플리팅 적용
- 이미지 최적화
- CDN 사용 검토

### 3. 보안 취약점
**위험**: 사용자 데이터 보안
**대응**:
- HTTPS 강제 적용
- 입력 데이터 검증
- 정기적인 보안 감사

## 📅 상세 일정

### 1주차
- [x] 프로젝트 구조 설계
- [ ] 백엔드 기본 설정
- [ ] 데이터베이스 스키마 설계
- [ ] 기본 API 엔드포인트 구현

### 2주차
- [ ] 사용자 인증 API 완성
- [ ] JWT 토큰 시스템 구현
- [ ] 기본 미들웨어 설정

### 3주차
- [ ] 프론트엔드 컴포넌트 분리
- [ ] 상태 관리 시스템 구축
- [ ] API 연동

### 4주차
- [ ] 사용자 인터페이스 개선
- [ ] 데이터 수집 시스템 구현
- [ ] 테스트 및 버그 수정

### 5-6주차
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 배포 준비

## 🎯 다음 단계 준비

Phase 2를 위한 준비 작업:
- 음악 API 연동을 위한 기반 구조
- 결제 시스템 통합 준비
- 사용자 구독 상태 관리 시스템

---

*Phase 1 완료 후 Phase 2: 음악 시스템 & 유료 플랜으로 진행합니다.*
