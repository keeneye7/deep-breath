# 기술 스택 및 아키텍처

## 🏗️ 전체 아키텍처

### 시스템 구조도
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/JS)    │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Assets    │    │   External APIs │    │   Redis Cache   │
│   (CloudFlare)  │    │   (OpenAI, etc) │    │   (Session)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 프론트엔드 기술 스택

### 핵심 기술
```javascript
{
  "framework": "Vanilla JavaScript (ES6+)",
  "bundler": "Webpack 5",
  "css": "CSS3 + CSS Variables",
  "graphics": "Three.js + WebGL",
  "audio": "Web Audio API",
  "pwa": "Service Workers + Web App Manifest",
  "testing": "Jest + Cypress"
}
```

### 주요 라이브러리
```json
{
  "dependencies": {
    "three": "^0.159.0",
    "threejs-toys": "^0.0.8",
    "workbox-webpack-plugin": "^6.5.4",
    "idb": "^7.1.1"
  },
  "devDependencies": {
    "webpack": "^5.88.0",
    "babel-loader": "^9.1.2",
    "css-loader": "^6.8.1",
    "terser-webpack-plugin": "^5.3.9",
    "compression-webpack-plugin": "^10.0.0"
  }
}
```

### 폴더 구조
```
src/
├── components/
│   ├── animations/
│   │   ├── MilkyWay.js
│   │   ├── Particles.js
│   │   ├── Fractal.js
│   │   └── Aurora.js
│   ├── audio/
│   │   ├── AudioPlayer.js
│   │   ├── Synthesizer.js
│   │   └── EffectsProcessor.js
│   ├── ui/
│   │   ├── ChatBot.js
│   │   ├── Dashboard.js
│   │   └── Settings.js
│   └── auth/
│       ├── LoginForm.js
│       └── SignupForm.js
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── storage.js
│   └── offline.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── performance.js
└── styles/
    ├── components/
    ├── animations/
    └── globals.css
```

## 🔧 백엔드 기술 스택

### 핵심 기술
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "database": "MongoDB + Mongoose",
  "cache": "Redis",
  "authentication": "JWT + bcrypt",
  "payments": "Stripe",
  "ai": "OpenAI GPT-4 API",
  "deployment": "Docker + PM2"
}
```

### API 구조
```
api/
├── auth/
│   ├── POST /signup
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh
├── users/
│   ├── GET /profile
│   ├── PUT /profile
│   ├── GET /stats
│   └── DELETE /account
├── music/
│   ├── GET /tracks
│   ├── GET /categories
│   ├── POST /playlists
│   └── GET /recommendations
├── sessions/
│   ├── POST /start
│   ├── PUT /update
│   ├── POST /complete
│   └── GET /history
├── chatbot/
│   ├── POST /chat
│   ├── GET /conversations
│   └── DELETE /conversation/:id
├── payments/
│   ├── POST /create-subscription
│   ├── POST /cancel-subscription
│   ├── POST /webhook
│   └── GET /billing-history
└── analytics/
    ├── POST /track
    ├── GET /dashboard
    └── GET /reports
```

### 데이터베이스 스키마
```javascript
// 주요 컬렉션들
const collections = {
  users: "사용자 정보 및 프로필",
  sessions: "명상 세션 기록",
  music: "음악 라이브러리",
  playlists: "사용자 플레이리스트",
  chatbot_conversations: "챗봇 대화 기록",
  subscriptions: "구독 정보",
  analytics_events: "사용자 행동 분석",
  recommendations: "개인화 추천 데이터"
};
```

## 🌐 외부 서비스 통합

### 음악 API 서비스
```javascript
const musicAPIs = {
  primary: {
    name: "Freesound.org",
    endpoint: "https://freesound.org/apiv2/",
    authentication: "API Key",
    rateLimit: "15,000 requests/month (free)",
    cost: "Free"
  },
  secondary: {
    name: "Pixabay Music",
    endpoint: "https://pixabay.com/api/",
    authentication: "API Key",
    rateLimit: "5,000 downloads/month (free)",
    cost: "Free"
  },
  premium: {
    name: "Zapsplat",
    endpoint: "https://api.zapsplat.com/",
    authentication: "OAuth 2.0",
    rateLimit: "Unlimited",
    cost: "$22/month"
  }
};
```

### AI 서비스
```javascript
const aiServices = {
  chatbot: {
    provider: "OpenAI",
    model: "gpt-4",
    endpoint: "https://api.openai.com/v1/chat/completions",
    cost: "$0.03/1K tokens (input), $0.06/1K tokens (output)"
  },
  musicGeneration: {
    provider: "Custom Web Audio API",
    fallback: "OpenAI API for composition logic",
    cost: "Minimal (mostly client-side)"
  }
};
```

### 결제 시스템
```javascript
const paymentConfig = {
  provider: "Stripe",
  features: [
    "구독 관리",
    "웹훅 처리",
    "다국가 결제",
    "세금 계산",
    "환불 처리"
  ],
  cost: "2.9% + $0.30 per transaction"
};
```

## 🔒 보안 및 인증

### 보안 조치
```javascript
const securityMeasures = {
  authentication: {
    method: "JWT (JSON Web Tokens)",
    expiration: "7 days (access), 30 days (refresh)",
    storage: "httpOnly cookies + localStorage"
  },
  encryption: {
    passwords: "bcrypt (12 rounds)",
    sensitive_data: "AES-256-GCM",
    transport: "TLS 1.3"
  },
  validation: {
    input: "Joi validation schemas",
    sanitization: "DOMPurify + validator.js",
    rateLimit: "express-rate-limit"
  },
  headers: {
    csp: "Content Security Policy",
    hsts: "HTTP Strict Transport Security",
    xss: "X-XSS-Protection",
    frameOptions: "X-Frame-Options: DENY"
  }
};
```

### 환경 변수 관리
```bash
# .env.example
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/deepbreath
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# External APIs
OPENAI_API_KEY=sk-...
FREESOUND_API_KEY=your-freesound-key
PIXABAY_API_KEY=your-pixabay-key

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...
GOOGLE_ANALYTICS_ID=GA-...
```

## 📊 모니터링 및 분석

### 성능 모니터링
```javascript
const monitoring = {
  apm: {
    service: "New Relic / DataDog",
    metrics: [
      "응답 시간",
      "처리량",
      "에러율",
      "메모리 사용량"
    ]
  },
  logging: {
    service: "Winston + ELK Stack",
    levels: ["error", "warn", "info", "debug"],
    retention: "30 days"
  },
  analytics: {
    service: "Google Analytics 4",
    customEvents: [
      "session_started",
      "music_played",
      "chat_initiated",
      "subscription_upgraded"
    ]
  }
};
```

### 에러 추적
```javascript
const errorTracking = {
  service: "Sentry",
  features: [
    "실시간 에러 알림",
    "성능 모니터링",
    "사용자 피드백 수집",
    "릴리스 추적"
  ],
  integration: {
    frontend: "@sentry/browser",
    backend: "@sentry/node"
  }
};
```

## 🚀 배포 및 인프라

### 호스팅 환경
```javascript
const infrastructure = {
  frontend: {
    service: "Vercel / Netlify",
    features: [
      "자동 배포",
      "CDN",
      "SSL 인증서",
      "도메인 관리"
    ],
    cost: "Free tier available"
  },
  backend: {
    service: "Railway / Heroku / DigitalOcean",
    features: [
      "자동 스케일링",
      "로드 밸런싱",
      "백업",
      "모니터링"
    ],
    cost: "$10-50/month"
  },
  database: {
    service: "MongoDB Atlas",
    tier: "M10 (Dedicated)",
    cost: "$57/month",
    features: [
      "자동 백업",
      "모니터링",
      "보안",
      "글로벌 클러스터"
    ]
  },
  cache: {
    service: "Redis Cloud",
    tier: "30MB (Free)",
    upgrade: "250MB ($7/month)"
  }
};
```

### CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v3
      - name: Deploy to Railway
        run: railway deploy
```

## 📱 모바일 및 PWA

### PWA 기능
```javascript
const pwaFeatures = {
  manifest: {
    name: "DeepBreath Meditation",
    short_name: "DeepBreath",
    theme_color: "#000000",
    background_color: "#000000",
    display: "standalone",
    orientation: "portrait"
  },
  serviceWorker: {
    caching: "Cache First for assets, Network First for API",
    offline: "Basic functionality available offline",
    sync: "Background sync for session data"
  },
  features: [
    "홈 화면에 추가",
    "오프라인 사용",
    "푸시 알림",
    "백그라운드 동기화"
  ]
};
```

## 💰 비용 예상

### 월간 운영 비용
```javascript
const monthlyCosts = {
  hosting: {
    frontend: "$0 (Vercel Free)",
    backend: "$25 (Railway Pro)",
    database: "$57 (MongoDB Atlas M10)",
    cache: "$7 (Redis Cloud 250MB)"
  },
  apis: {
    openai: "$50-200 (usage-based)",
    music: "$22 (Zapsplat)",
    stripe: "2.9% of revenue"
  },
  monitoring: {
    sentry: "$26 (Team plan)",
    analytics: "$0 (Google Analytics)"
  },
  total: "$187-357/month (excluding Stripe fees)"
};
```

### 확장성 고려사항
```javascript
const scalabilityPlan = {
  "1K users": "현재 스택으로 충분",
  "10K users": {
    backend: "Load balancer + multiple instances",
    database: "MongoDB Atlas M20 ($115/month)",
    cache: "Redis Cloud 1GB ($15/month)"
  },
  "100K users": {
    backend: "Kubernetes cluster",
    database: "Sharded cluster",
    cdn: "CloudFlare Pro",
    monitoring: "Enterprise monitoring solutions"
  }
};
```

---

*이 기술 스택은 프로젝트 진행에 따라 필요에 맞게 조정될 수 있습니다.*
