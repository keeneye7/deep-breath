# Cloudflare Workers 배포 전략

## 🌐 현재 환경 분석

### 기존 구조
- **호스팅**: Cloudflare Workers
- **배포**: GitHub → main 브랜치 자동 배포
- **도메인**: deepbreath.us
- **현재 상태**: 정적 웹사이트 (HTML, CSS, JS)

## 📋 단계별 마이그레이션 계획

### Phase 1: Cloudflare Workers 최적화 (현재 환경 유지)
**기간**: 1-2주
**목표**: 현재 구조를 유지하면서 기능 확장

#### 1.1 프론트엔드 개선
```javascript
// 현재 구조 유지하면서 개선
const improvements = {
  codeOrganization: [
    "모듈화된 JavaScript 구조",
    "컴포넌트 기반 아키텍처",
    "상태 관리 시스템",
    "이벤트 시스템 구축"
  ],
  
  newFeatures: [
    "사용자 설정 로컬 저장",
    "세션 기록 (localStorage)",
    "기본 분석 (클라이언트 사이드)",
    "개선된 UI/UX"
  ],
  
  performance: [
    "코드 스플리팅",
    "지연 로딩",
    "캐싱 최적화",
    "번들 크기 최적화"
  ]
};
```

#### 1.2 Cloudflare Workers 활용
```javascript
// workers/analytics.js - 간단한 분석 수집
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST' && request.url.includes('/api/analytics')) {
      const data = await request.json();
      
      // Cloudflare KV에 분석 데이터 저장
      await env.ANALYTICS_KV.put(
        `session_${Date.now()}`, 
        JSON.stringify(data),
        { expirationTtl: 86400 * 30 } // 30일
      );
      
      return new Response('OK', { status: 200 });
    }
    
    // 정적 파일 서빙
    return env.ASSETS.fetch(request);
  }
};
```

### Phase 2: 하이브리드 아키텍처 (2-4주)
**목표**: Cloudflare Workers + 외부 백엔드 서비스

#### 2.1 Cloudflare Workers as API Gateway
```javascript
// workers/api-gateway.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API 라우팅
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // 정적 파일 서빙
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  switch (true) {
    case path.startsWith('/api/auth'):
      return handleAuth(request, env);
    case path.startsWith('/api/music'):
      return handleMusic(request, env);
    case path.startsWith('/api/analytics'):
      return handleAnalytics(request, env);
    default:
      return new Response('Not Found', { status: 404 });
  }
}
```

#### 2.2 외부 서비스 통합
```javascript
const externalServices = {
  database: {
    service: "PlanetScale / Supabase",
    reason: "Serverless-friendly MySQL/PostgreSQL",
    integration: "REST API 호출"
  },
  
  authentication: {
    service: "Auth0 / Clerk",
    reason: "완전 관리형 인증 서비스",
    integration: "JWT 토큰 검증"
  },
  
  payments: {
    service: "Stripe",
    reason: "표준 결제 처리",
    integration: "Webhook을 Workers로"
  },
  
  ai: {
    service: "OpenAI API",
    reason: "챗봇 기능",
    integration: "직접 API 호출"
  }
};
```

### Phase 3: 완전한 서버리스 아키텍처 (4-8주)
**목표**: Cloudflare 생태계 완전 활용

#### 3.1 Cloudflare 서비스 활용
```javascript
const cloudflareServices = {
  workers: "API 로직 및 라우팅",
  kv: "세션 데이터 및 캐시",
  d1: "관계형 데이터베이스 (SQLite)",
  r2: "음악 파일 저장",
  durable_objects: "실시간 기능 (채팅, 동기화)",
  analytics: "사용자 분석",
  stream: "향후 비디오 콘텐츠"
};
```

#### 3.2 데이터베이스 마이그레이션
```sql
-- Cloudflare D1 스키마
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profile TEXT, -- JSON
  subscription TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  duration INTEGER,
  animation TEXT,
  music TEXT,
  breathing_data TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE music (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT,
  duration INTEGER,
  file_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  metadata TEXT -- JSON
);
```

## 🚀 구현 로드맵

### Week 1-2: 현재 구조 개선
```javascript
const week1_2_tasks = {
  codeRefactoring: [
    "기존 코드 모듈화",
    "컴포넌트 시스템 구축",
    "상태 관리 구현",
    "이벤트 시스템 추가"
  ],
  
  newFeatures: [
    "사용자 설정 저장 (localStorage)",
    "세션 기록 기능",
    "기본 분석 수집",
    "개선된 UI 컴포넌트"
  ],
  
  infrastructure: [
    "빌드 시스템 개선",
    "개발 환경 설정",
    "테스트 환경 구축",
    "Git 워크플로우 최적화"
  ]
};
```

### Week 3-4: Cloudflare Workers API 구축
```javascript
const week3_4_tasks = {
  workersSetup: [
    "Workers 프로젝트 구조 설정",
    "API 라우팅 시스템",
    "KV 스토리지 활용",
    "기본 인증 시스템"
  ],
  
  apiEndpoints: [
    "/api/analytics - 분석 데이터 수집",
    "/api/settings - 사용자 설정",
    "/api/sessions - 세션 기록",
    "/api/music - 음악 메타데이터"
  ]
};
```

### Week 5-8: 외부 서비스 통합
```javascript
const week5_8_tasks = {
  authentication: [
    "Auth0/Clerk 통합",
    "JWT 토큰 처리",
    "사용자 프로필 관리",
    "권한 시스템"
  ],
  
  payments: [
    "Stripe 통합",
    "구독 관리",
    "웹훅 처리",
    "결제 플로우"
  ],
  
  musicAPI: [
    "Freesound API 통합",
    "음악 캐싱 (R2)",
    "카테고리 시스템",
    "검색 기능"
  ]
};
```

## 🔧 개발 환경 설정

### 1. Wrangler CLI 설정
```bash
# Cloudflare Workers CLI 설치
npm install -g wrangler

# 프로젝트 초기화
wrangler init deepbreath-workers

# 개발 서버 실행
wrangler dev

# 배포
wrangler deploy
```

### 2. 프로젝트 구조
```
deepbreath/
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── main.js
├── workers/
│   ├── api-gateway.js
│   ├── analytics.js
│   └── auth.js
├── wrangler.toml
├── package.json
└── webpack.config.js
```

### 3. wrangler.toml 설정
```toml
name = "deepbreath"
main = "workers/api-gateway.js"
compatibility_date = "2024-01-01"

[env.production]
name = "deepbreath-prod"
route = "deepbreath.us/*"

[env.development]
name = "deepbreath-dev"

[[kv_namespaces]]
binding = "ANALYTICS_KV"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "MUSIC_BUCKET"
bucket_name = "deepbreath-music"

[[d1_databases]]
binding = "DB"
database_name = "deepbreath-db"
database_id = "your-d1-database-id"
```

## 📊 모니터링 및 분석

### 1. Cloudflare Analytics 활용
```javascript
// 기본 분석 수집
const analytics = {
  pageViews: "Cloudflare 기본 제공",
  customEvents: "Workers Analytics Engine",
  performance: "Real User Monitoring (RUM)",
  errors: "Workers 로그"
};
```

### 2. 커스텀 분석
```javascript
// workers/analytics.js
export async function trackEvent(eventName, properties, env) {
  const event = {
    timestamp: Date.now(),
    event: eventName,
    properties,
    userAgent: request.headers.get('User-Agent'),
    ip: request.headers.get('CF-Connecting-IP')
  };
  
  // Analytics Engine에 전송
  env.ANALYTICS.writeDataPoint({
    blobs: [eventName, JSON.stringify(properties)],
    doubles: [Date.now()],
    indexes: [eventName]
  });
}
```

## 💰 비용 최적화

### Cloudflare Workers 비용 구조
```javascript
const costStructure = {
  workers: {
    free: "100,000 requests/day",
    paid: "$5/month for 10M requests",
    current: "무료 티어로 충분"
  },
  
  kv: {
    free: "100,000 reads/day, 1,000 writes/day",
    paid: "$0.50/million reads",
    usage: "사용자 설정, 세션 데이터"
  },
  
  d1: {
    free: "5M rows read/month, 100K rows written/month",
    paid: "$0.001/1K rows read",
    usage: "사용자 데이터, 음악 메타데이터"
  },
  
  r2: {
    free: "10GB storage/month",
    paid: "$0.015/GB/month",
    usage: "음악 파일 캐싱"
  }
};
```

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

---

*이 전략은 현재 Cloudflare Workers 환경을 최대한 활용하면서 점진적으로 기능을 확장하는 방향으로 설계되었습니다.*
