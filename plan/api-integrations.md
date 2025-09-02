# API 통합 계획

## 🎵 음악 API 통합

### 1. Freesound.org API
**우선순위**: 높음 | **Phase**: 2

#### API 개요
- **엔드포인트**: `https://freesound.org/apiv2/`
- **인증**: API Key
- **제한**: 15,000 requests/month (무료)
- **라이선스**: Creative Commons

#### 구현 계획
```javascript
class FreesoundAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://freesound.org/apiv2';
    this.rateLimit = new RateLimiter(15000, 'month');
  }
  
  async searchSounds(query, filters = {}) {
    const params = new URLSearchParams({
      query,
      token: this.apiKey,
      format: 'json',
      fields: 'id,name,description,duration,download,previews,license',
      ...filters
    });
    
    if (!this.rateLimit.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }
    
    const response = await fetch(`${this.baseURL}/search/text/?${params}`);
    const data = await response.json();
    
    return this.transformResults(data.results);
  }
  
  transformResults(results) {
    return results.map(sound => ({
      id: sound.id,
      title: sound.name,
      description: sound.description,
      duration: sound.duration,
      previewUrl: sound.previews['preview-hq-mp3'],
      downloadUrl: sound.download,
      license: sound.license,
      source: 'freesound'
    }));
  }
  
  async getRecommendedSounds(category) {
    const categoryQueries = {
      nature: 'rain OR ocean OR forest OR birds',
      ambient: 'ambient OR drone OR atmosphere',
      meditation: 'meditation OR zen OR peaceful',
      binaural: 'binaural OR brainwave OR frequency'
    };
    
    return await this.searchSounds(categoryQueries[category], {
      duration: '[60 TO 1800]', // 1분-30분
      sort: 'rating_desc'
    });
  }
}
```

#### 사용 예시
```javascript
// 음악 검색 및 저장
const freesound = new FreesoundAPI(process.env.FREESOUND_API_KEY);

async function importMeditationMusic() {
  const categories = ['nature', 'ambient', 'meditation', 'binaural'];
  
  for (const category of categories) {
    const sounds = await freesound.getRecommendedSounds(category);
    
    for (const sound of sounds) {
      await Music.create({
        title: sound.title,
        description: sound.description,
        category: category,
        duration: sound.duration,
        fileUrl: sound.previewUrl,
        source: 'freesound',
        license: sound.license,
        isPremium: false
      });
    }
  }
}
```

### 2. Pixabay Music API
**우선순위**: 중간 | **Phase**: 2

#### API 개요
- **엔드포인트**: `https://pixabay.com/api/music/`
- **인증**: API Key
- **제한**: 5,000 downloads/month (무료)
- **라이선스**: Pixabay License (상업적 사용 가능)

#### 구현 계획
```javascript
class PixabayMusicAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://pixabay.com/api/music/';
  }
  
  async searchMusic(category, options = {}) {
    const params = new URLSearchParams({
      key: this.apiKey,
      category: category,
      min_duration: 60,
      max_duration: 1800,
      per_page: 20,
      ...options
    });
    
    const response = await fetch(`${this.baseURL}?${params}`);
    const data = await response.json();
    
    return data.hits.map(track => ({
      id: track.id,
      title: track.tags,
      duration: track.duration,
      downloadUrl: track.download_url,
      previewUrl: track.preview_url,
      license: 'Pixabay License',
      source: 'pixabay'
    }));
  }
}
```

### 3. 음악 캐싱 및 최적화
**우선순위**: 높음 | **Phase**: 2

#### 캐싱 전략
```javascript
class MusicCacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.s3 = new AWS.S3(); // 또는 다른 클라우드 스토리지
  }
  
  async cacheMusic(musicData) {
    const cacheKey = `music:${musicData.source}:${musicData.id}`;
    
    // 메타데이터 캐싱 (Redis)
    await this.redis.setex(cacheKey, 86400, JSON.stringify(musicData));
    
    // 오디오 파일 캐싱 (S3)
    if (musicData.downloadUrl) {
      const audioBuffer = await this.downloadAudio(musicData.downloadUrl);
      const s3Key = `music/${musicData.source}/${musicData.id}.mp3`;
      
      await this.s3.upload({
        Bucket: process.env.S3_BUCKET,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg'
      }).promise();
      
      musicData.cachedUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
    }
    
    return musicData;
  }
  
  async getCachedMusic(source, id) {
    const cacheKey = `music:${source}:${id}`;
    const cached = await this.redis.get(cacheKey);
    
    return cached ? JSON.parse(cached) : null;
  }
}
```

## 🤖 AI API 통합

### 1. OpenAI GPT-4 API
**우선순위**: 높음 | **Phase**: 3

#### 챗봇 구현
```javascript
class MeditationChatbot {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.systemPrompt = this.buildSystemPrompt();
  }
  
  buildSystemPrompt() {
    return `
당신은 DeepBreath 명상 앱의 AI 가이드 '세레나'입니다.

역할과 성격:
- 따뜻하고 공감적인 명상 전문가
- 사용자의 마음 상태를 이해하고 적절한 조언 제공
- 한국어로 자연스럽고 친근하게 대화

전문 분야:
- 명상 기법 (마음챙김, 호흡명상, 바디스캔 등)
- 스트레스 관리 및 감정 조절
- 수면 개선 및 이완 기법
- 집중력 향상 방법

제한사항:
- 의료적 진단이나 치료 조언 금지
- 심각한 정신건강 문제는 전문가 상담 권유
- 개인정보 수집 최소화

응답 스타일:
- 2-3문장으로 간결하게
- 실용적이고 구체적인 조언
- 격려와 지지의 메시지 포함
`;
  }
  
  async chat(message, userContext = {}) {
    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildUserMessage(message, userContext) }
      ];
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 300,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      return {
        response: response.choices[0].message.content,
        usage: response.usage,
        intent: await this.classifyIntent(message)
      };
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        response: '죄송합니다. 잠시 후 다시 시도해주세요.',
        error: true
      };
    }
  }
  
  buildUserMessage(message, context) {
    let contextInfo = '';
    
    if (context.recentSessions) {
      contextInfo += `최근 명상 세션: ${context.recentSessions}회\n`;
    }
    
    if (context.preferredStyle) {
      contextInfo += `선호하는 명상 스타일: ${context.preferredStyle}\n`;
    }
    
    return `${contextInfo}\n사용자 메시지: ${message}`;
  }
  
  async classifyIntent(message) {
    const intents = {
      greeting: ['안녕', '하이', '헬로', '처음'],
      meditation_help: ['명상', '어떻게', '방법', '시작'],
      breathing: ['호흡', '숨', '브리딩'],
      stress: ['스트레스', '불안', '걱정', '긴장'],
      sleep: ['잠', '수면', '잠들기', '불면'],
      technical: ['오류', '문제', '안됨', '작동']
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
  }
}
```

#### 비용 관리
```javascript
class OpenAICostManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.monthlyBudget = 200; // $200/month
  }
  
  async trackUsage(usage) {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = `openai:usage:${month}`;
    
    const cost = this.calculateCost(usage);
    await this.redis.hincrby(key, 'total_cost', Math.round(cost * 100)); // cents
    await this.redis.hincrby(key, 'requests', 1);
    await this.redis.expire(key, 86400 * 32); // 32 days
    
    return cost;
  }
  
  calculateCost(usage) {
    const inputCost = (usage.prompt_tokens / 1000) * 0.03;
    const outputCost = (usage.completion_tokens / 1000) * 0.06;
    return inputCost + outputCost;
  }
  
  async checkBudget() {
    const month = new Date().toISOString().slice(0, 7);
    const key = `openai:usage:${month}`;
    
    const totalCostCents = await this.redis.hget(key, 'total_cost') || 0;
    const totalCost = totalCostCents / 100;
    
    return {
      used: totalCost,
      budget: this.monthlyBudget,
      remaining: this.monthlyBudget - totalCost,
      percentage: (totalCost / this.monthlyBudget) * 100
    };
  }
}
```

### 2. 의도 분류 및 엔티티 추출
**우선순위**: 중간 | **Phase**: 3

#### 로컬 NLP 처리
```javascript
class LocalNLPProcessor {
  constructor() {
    this.intentPatterns = {
      meditation_start: [
        /명상.*시작/,
        /명상.*하고.*싶/,
        /명상.*해보/
      ],
      breathing_help: [
        /호흡.*방법/,
        /숨.*쉬는.*법/,
        /브리딩/
      ],
      music_request: [
        /음악.*추천/,
        /음악.*바꿔/,
        /다른.*음악/
      ],
      session_feedback: [
        /세션.*어땠/,
        /명상.*끝/,
        /어떻게.*느껴/
      ]
    };
    
    this.entities = {
      duration: /(\d+)분/,
      mood: /(평화로운|차분한|활기찬|집중)/,
      time: /(아침|점심|저녁|밤)/
    };
  }
  
  classifyIntent(text) {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return intent;
      }
    }
    return 'general';
  }
  
  extractEntities(text) {
    const entities = {};
    
    for (const [entityType, pattern] of Object.entries(this.entities)) {
      const match = text.match(pattern);
      if (match) {
        entities[entityType] = match[1] || match[0];
      }
    }
    
    return entities;
  }
}
```

## 💳 결제 API 통합

### 1. Stripe API
**우선순위**: 높음 | **Phase**: 2

#### 구독 관리
```javascript
class StripeSubscriptionManager {
  constructor(secretKey) {
    this.stripe = require('stripe')(secretKey);
  }
  
  async createCustomer(userEmail, name) {
    return await this.stripe.customers.create({
      email: userEmail,
      name: name,
      metadata: {
        source: 'deepbreath_app'
      }
    });
  }
  
  async createSubscription(customerId, priceId, paymentMethodId) {
    try {
      // 결제 방법 고객에게 연결
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      // 기본 결제 방법으로 설정
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      // 구독 생성
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent']
      });
      
      return subscription;
      
    } catch (error) {
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }
  
  async handleWebhook(event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
    }
  }
  
  async handlePaymentSucceeded(invoice) {
    const subscription = await this.stripe.subscriptions.retrieve(
      invoice.subscription
    );
    
    // 데이터베이스 업데이트
    await User.findOneAndUpdate(
      { 'subscription.stripeCustomerId': invoice.customer },
      {
        'subscription.status': 'active',
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
      }
    );
  }
  
  async handlePaymentFailed(invoice) {
    // 결제 실패 처리
    await User.findOneAndUpdate(
      { 'subscription.stripeCustomerId': invoice.customer },
      { 'subscription.status': 'past_due' }
    );
    
    // 사용자에게 알림 발송
    await this.sendPaymentFailedNotification(invoice.customer);
  }
}
```

#### 가격 정책 관리
```javascript
const pricingPlans = {
  monthly: {
    priceId: 'price_monthly_premium',
    amount: 999, // $9.99
    currency: 'usd',
    interval: 'month'
  },
  annual: {
    priceId: 'price_annual_premium',
    amount: 9999, // $99.99
    currency: 'usd',
    interval: 'year'
  }
};

// Stripe에서 가격 생성
async function createStripePrices() {
  for (const [planName, plan] of Object.entries(pricingPlans)) {
    await stripe.prices.create({
      unit_amount: plan.amount,
      currency: plan.currency,
      recurring: { interval: plan.interval },
      product: 'prod_deepbreath_premium',
      nickname: `DeepBreath Premium ${planName}`
    });
  }
}
```

## 📊 분석 API 통합

### 1. Google Analytics 4
**우선순위**: 중간 | **Phase**: 1

#### 이벤트 추적
```javascript
class AnalyticsManager {
  constructor(measurementId) {
    this.measurementId = measurementId;
    this.initializeGA4();
  }
  
  initializeGA4() {
    // GA4 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId);
  }
  
  trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }
  
  trackMeditationSession(sessionData) {
    this.trackEvent('meditation_session_completed', {
      session_duration: sessionData.duration,
      animation_type: sessionData.animation,
      music_category: sessionData.musicCategory,
      user_level: sessionData.userLevel
    });
  }
  
  trackSubscription(subscriptionData) {
    this.trackEvent('purchase', {
      transaction_id: subscriptionData.transactionId,
      value: subscriptionData.amount,
      currency: subscriptionData.currency,
      items: [{
        item_id: subscriptionData.planId,
        item_name: subscriptionData.planName,
        category: 'subscription',
        quantity: 1,
        price: subscriptionData.amount
      }]
    });
  }
}
```

### 2. 사용자 행동 분석
**우선순위**: 높음 | **Phase**: 3

#### 커스텀 분석 시스템
```javascript
class UserBehaviorAnalytics {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
  }
  
  trackUserAction(action, data = {}) {
    const event = {
      timestamp: Date.now(),
      action,
      data,
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId()
    };
    
    this.events.push(event);
    
    // 배치로 서버에 전송
    if (this.events.length >= 10) {
      this.flushEvents();
    }
  }
  
  async flushEvents() {
    if (this.events.length === 0) return;
    
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: this.events,
          sessionDuration: Date.now() - this.sessionStart
        })
      });
      
      this.events = [];
    } catch (error) {
      console.error('Analytics flush failed:', error);
    }
  }
  
  // 페이지 언로드 시 남은 이벤트 전송
  beforeUnload() {
    if (this.events.length > 0) {
      navigator.sendBeacon('/api/analytics/batch', JSON.stringify({
        events: this.events,
        sessionDuration: Date.now() - this.sessionStart
      }));
    }
  }
}
```

## 🔄 API 통합 모니터링

### 1. 헬스 체크 시스템
```javascript
class APIHealthMonitor {
  constructor() {
    this.apis = {
      freesound: 'https://freesound.org/apiv2/search/text/',
      openai: 'https://api.openai.com/v1/models',
      stripe: 'https://api.stripe.com/v1/account'
    };
    
    this.healthStatus = {};
  }
  
  async checkAllAPIs() {
    const results = {};
    
    for (const [name, endpoint] of Object.entries(this.apis)) {
      results[name] = await this.checkAPI(name, endpoint);
    }
    
    return results;
  }
  
  async checkAPI(name, endpoint) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint, {
        method: 'HEAD',
        timeout: 5000
      });
      
      const responseTime = Date.now() - start;
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        statusCode: response.status,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }
}
```

### 2. 에러 처리 및 재시도 로직
```javascript
class APIRetryManager {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1초
  }
  
  async executeWithRetry(apiCall, retries = this.maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = this.calculateDelay(this.maxRetries - retries);
        await this.sleep(delay);
        return this.executeWithRetry(apiCall, retries - 1);
      }
      throw error;
    }
  }
  
  isRetryableError(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status) || 
           error.code === 'NETWORK_ERROR';
  }
  
  calculateDelay(attempt) {
    return this.baseDelay * Math.pow(2, attempt); // 지수 백오프
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

*이 API 통합 계획은 각 Phase에 맞춰 단계적으로 구현됩니다.*
