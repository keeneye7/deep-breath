# Phase 2: 음악 시스템 & 유료 플랜 (2-3개월)

## 🎯 목표
다양한 음악 라이브러리를 통합하고 유료 구독 모델을 도입하여 수익화 기반을 마련합니다.

## 🎵 음악 시스템 확장

### 1. 저작권 무료 음악 API 통합
**기간**: 3주
**우선순위**: 높음

#### 추천 음악 API 서비스
1. **Freesound.org API**
   - 무료 사운드 이펙트 및 앰비언트 음악
   - Creative Commons 라이선스
   - 월 15,000 요청 무료

2. **Pixabay Music API**
   - 고품질 로열티 프리 음악
   - 상업적 사용 가능
   - 무료 플랜: 월 5,000 다운로드

3. **Zapsplat API** (백업 옵션)
   - 프리미엄 사운드 라이브러리
   - 월 $22부터 시작

#### 음악 카테고리 구성
```javascript
const musicCategories = {
  nature: {
    name: '자연음',
    subcategories: ['rain', 'ocean', 'forest', 'birds'],
    description: '자연의 소리로 마음을 진정시키세요'
  },
  ambient: {
    name: '앰비언트',
    subcategories: ['drone', 'pad', 'texture', 'space'],
    description: '몰입감 있는 분위기 음악'
  },
  binaural: {
    name: '바이노럴 비트',
    subcategories: ['alpha', 'theta', 'delta', 'gamma'],
    description: '뇌파 동조를 통한 깊은 명상'
  },
  instrumental: {
    name: '악기 연주',
    subcategories: ['piano', 'guitar', 'flute', 'singing_bowl'],
    description: '부드러운 악기 연주'
  }
};
```

#### 음악 관리 시스템
```javascript
// Music Schema
{
  _id: ObjectId,
  title: String,
  artist: String,
  category: String,
  subcategory: String,
  duration: Number, // seconds
  fileUrl: String,
  thumbnailUrl: String,
  tags: [String],
  bpm: Number,
  key: String,
  mood: String, // 'calm', 'energetic', 'peaceful', 'focus'
  isPremium: Boolean,
  downloadCount: Number,
  rating: Number,
  source: String, // 'freesound', 'pixabay', 'custom'
  license: String,
  createdAt: Date
}

// Playlist Schema
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  description: String,
  tracks: [ObjectId], // Music IDs
  isPublic: Boolean,
  duration: Number, // total duration
  createdAt: Date,
  updatedAt: Date
}
```

### 2. 고급 오디오 플레이어 구현
**기간**: 2주
**우선순위**: 높음

#### 기능 명세
- **크로스페이드**: 트랙 간 부드러운 전환
- **이퀄라이저**: 주파수 조절 (프리미엄 기능)
- **루프 모드**: 무한 반복 재생
- **타이머**: 자동 종료 설정
- **오프라인 재생**: 다운로드된 트랙 재생 (프리미엄)

#### 구현 예시
```javascript
class AdvancedAudioPlayer {
  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.equalizer = this.createEqualizer();
    this.crossfadeTime = 3; // seconds
  }

  createEqualizer() {
    const frequencies = [60, 170, 350, 1000, 3500, 10000];
    return frequencies.map(freq => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });
  }

  async crossfade(currentTrack, nextTrack) {
    const fadeOutTime = this.crossfadeTime;
    const fadeInTime = this.crossfadeTime;
    
    // Fade out current track
    currentTrack.gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      this.audioContext.currentTime + fadeOutTime
    );
    
    // Start next track and fade in
    nextTrack.play();
    nextTrack.gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
    nextTrack.gainNode.gain.exponentialRampToValueAtTime(
      1, 
      this.audioContext.currentTime + fadeInTime
    );
  }
}
```

## 💰 유료 플랜 시스템

### 1. 구독 모델 설계
**기간**: 2주
**우선순위**: 높음

#### 플랜 구조
```javascript
const subscriptionPlans = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      musicTracks: 50,
      animations: 2,
      sessionHistory: 7, // days
      downloadLimit: 0,
      equalizer: false,
      customPlaylists: 1,
      adFree: false
    }
  },
  premium: {
    name: 'Premium',
    price: 9.99, // monthly
    features: {
      musicTracks: 'unlimited',
      animations: 'all',
      sessionHistory: 'unlimited',
      downloadLimit: 100, // per month
      equalizer: true,
      customPlaylists: 'unlimited',
      adFree: true,
      prioritySupport: true,
      earlyAccess: true
    }
  },
  annual: {
    name: 'Annual Premium',
    price: 99.99, // yearly (2 months free)
    features: {
      // Same as premium
      ...subscriptionPlans.premium.features,
      discount: '17%'
    }
  }
};
```

### 2. 결제 시스템 통합
**기간**: 2주
**우선순위**: 높음

#### Stripe 통합
```javascript
// 결제 처리 API
router.post('/create-subscription', async (req, res) => {
  try {
    const { userId, planId, paymentMethodId } = req.body;
    
    // Stripe Customer 생성 또는 조회
    let customer = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    
    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.profile.name,
        payment_method: paymentMethodId
      });
    } else {
      customer = customer.data[0];
    }
    
    // 구독 생성
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: getPriceId(planId) }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });
    
    // 데이터베이스 업데이트
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': planId,
      'subscription.stripeCustomerId': customer.id,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.status': subscription.status,
      'subscription.startDate': new Date(),
      'subscription.endDate': new Date(subscription.current_period_end * 1000)
    });
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 웹훅 처리
```javascript
// Stripe 웹훅 처리
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }
  
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
  }
  
  res.json({received: true});
});
```

### 3. 기능 제한 시스템
**기간**: 1주
**우선순위**: 중간

#### 미들웨어 구현
```javascript
// 구독 상태 확인 미들웨어
const checkSubscription = (requiredFeature) => {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    const plan = subscriptionPlans[user.subscription.plan];
    
    if (!plan.features[requiredFeature]) {
      return res.status(403).json({
        error: 'Premium feature required',
        upgradeUrl: '/upgrade'
      });
    }
    
    next();
  };
};

// 사용 예시
router.get('/premium-music', checkSubscription('musicTracks'), async (req, res) => {
  // 프리미엄 음악 제공
});
```

## 🎨 사용자 인터페이스 개선

### 1. 음악 브라우저 UI
**기간**: 2주
**우선순위**: 중간

#### 컴포넌트 구조
```javascript
// MusicBrowser.js
const MusicBrowser = () => {
  const [selectedCategory, setSelectedCategory] = useState('nature');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  
  return (
    <div className="music-browser">
      <CategoryTabs 
        categories={musicCategories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <TrackGrid 
        tracks={tracks}
        onPlay={setCurrentTrack}
        currentTrack={currentTrack}
      />
      <AudioPlayer 
        track={currentTrack}
        onNext={playNext}
        onPrevious={playPrevious}
      />
    </div>
  );
};
```

### 2. 구독 관리 대시보드
**기간**: 1주
**우선순위**: 중간

#### 기능 포함
- 현재 플랜 상태
- 사용량 통계
- 결제 내역
- 플랜 변경/취소

## 📊 성공 지표

### 비즈니스 지표
- 유료 전환율: 5-8%
- 월간 이탈률: < 5%
- 평균 수익 per 사용자 (ARPU): $8
- 고객 만족도: > 4.5/5

### 기술적 지표
- 음악 로딩 시간: < 3초
- 결제 성공률: > 98%
- API 응답 시간: < 500ms
- 오디오 품질: 320kbps

## 🚨 위험 요소 및 대응

### 1. 저작권 문제
**위험**: 음악 저작권 침해
**대응**:
- 모든 음악 라이선스 문서화
- 정기적인 라이선스 검토
- 법무팀 자문

### 2. 결제 보안
**위험**: 결제 정보 유출
**대응**:
- PCI DSS 준수
- Stripe 보안 기능 활용
- 정기적인 보안 감사

### 3. 음악 품질 관리
**위험**: 저품질 음악으로 인한 사용자 이탈
**대응**:
- 음악 큐레이션 프로세스
- 사용자 평점 시스템
- 정기적인 품질 검토

## 📅 상세 일정

### 7-8주차 (Phase 2 시작)
- [ ] 음악 API 연동 설계
- [ ] Freesound API 통합
- [ ] 기본 음악 카테고리 구성

### 9-10주차
- [ ] 고급 오디오 플레이어 개발
- [ ] 크로스페이드 기능 구현
- [ ] 이퀄라이저 UI 개발

### 11-12주차
- [ ] Stripe 결제 시스템 통합
- [ ] 구독 관리 시스템 구축
- [ ] 웹훅 처리 구현

### 13-14주차
- [ ] 음악 브라우저 UI 개발
- [ ] 플레이리스트 기능 구현
- [ ] 기능 제한 시스템 적용

### 15-16주차
- [ ] 구독 대시보드 개발
- [ ] 결제 플로우 최적화
- [ ] 베타 테스트 및 버그 수정

## 🎯 다음 단계 준비

Phase 3을 위한 준비:
- 사용자 행동 데이터 수집 강화
- AI 추천 시스템을 위한 데이터 구조 설계
- 챗봇 통합을 위한 API 준비

---

*Phase 2 완료 후 Phase 3: AI 챗봇 & 개인화 기능으로 진행합니다.*
