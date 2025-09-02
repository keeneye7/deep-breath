# Phase 3: AI 챗봇 & 개인화 기능 (3-4개월)

## 🎯 목표
AI 기반 명상 가이드 챗봇을 구축하고 사용자 맞춤형 경험을 제공하여 사용자 참여도와 만족도를 극대화합니다.

## 🤖 AI 챗봇 시스템

### 1. 명상 가이드 챗봇 개발
**기간**: 4주
**우선순위**: 높음

#### 기술 스택 선택
1. **OpenAI GPT-4 API** (추천)
   - 자연스러운 대화 능력
   - 명상 관련 지식 풍부
   - 월 $20부터 시작

2. **Claude API** (대안)
   - 안전하고 도움이 되는 응답
   - 긴 컨텍스트 처리 가능

3. **로컬 LLM** (장기 계획)
   - Llama 2 또는 Mistral 7B
   - 비용 절감 및 데이터 프라이버시

#### 챗봇 페르소나 설계
```javascript
const meditationBotPersona = {
  name: "세레나 (Serena)",
  personality: {
    tone: "차분하고 따뜻한",
    style: "공감적이고 격려하는",
    expertise: "명상, 마음챙김, 스트레스 관리",
    language: "한국어 (자연스러운 존댓말)"
  },
  capabilities: [
    "명상 기법 안내",
    "호흡법 지도",
    "스트레스 관리 조언",
    "개인화된 명상 추천",
    "진행 상황 격려",
    "간단한 상담"
  ],
  limitations: [
    "의료 조언 제공 불가",
    "심각한 정신건강 문제는 전문가 추천",
    "개인정보 수집 최소화"
  ]
};
```

#### 대화 플로우 설계
```javascript
const conversationFlows = {
  onboarding: {
    steps: [
      "인사 및 소개",
      "명상 경험 파악",
      "목표 설정",
      "선호도 조사",
      "첫 세션 추천"
    ]
  },
  dailyCheckIn: {
    steps: [
      "기분 상태 확인",
      "스트레스 레벨 파악",
      "오늘의 명상 추천",
      "동기부여 메시지"
    ]
  },
  sessionGuidance: {
    steps: [
      "세션 전 준비",
      "실시간 가이드",
      "세션 후 피드백",
      "다음 단계 제안"
    ]
  },
  troubleshooting: {
    steps: [
      "문제 파악",
      "해결책 제시",
      "대안 방법 안내",
      "추가 리소스 제공"
    ]
  }
};
```

### 2. 챗봇 백엔드 구현
**기간**: 3주
**우선순위**: 높음

#### API 구조
```javascript
// Chatbot Schema
{
  _id: ObjectId,
  userId: ObjectId,
  sessionId: String,
  messages: [{
    role: String, // 'user', 'assistant', 'system'
    content: String,
    timestamp: Date,
    metadata: {
      intent: String,
      confidence: Number,
      entities: [Object]
    }
  }],
  context: {
    userProfile: Object,
    currentGoals: [String],
    recentSessions: [Object],
    preferences: Object
  },
  createdAt: Date,
  updatedAt: Date
}

// Intent Classification
const intents = {
  greeting: "인사 및 일반적인 대화",
  meditation_guidance: "명상 방법 문의",
  breathing_technique: "호흡법 관련",
  stress_management: "스트레스 관리",
  session_feedback: "세션 후 피드백",
  technical_support: "기술적 문제",
  subscription_inquiry: "구독 관련 문의"
};
```

#### 챗봇 API 엔드포인트
```javascript
// routes/chatbot.js
router.post('/chat', async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;
    
    // 사용자 컨텍스트 로드
    const userContext = await buildUserContext(userId);
    
    // 의도 분석
    const intent = await classifyIntent(message);
    
    // GPT-4 API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(userContext, intent)
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // 대화 기록 저장
    await saveChatMessage(userId, sessionId, message, response.choices[0].message.content);
    
    // 개인화된 추천 생성
    const recommendations = await generateRecommendations(userId, intent);
    
    res.json({
      response: response.choices[0].message.content,
      recommendations,
      intent,
      sessionId
    });
    
  } catch (error) {
    res.status(500).json({ error: '챗봇 서비스에 문제가 발생했습니다.' });
  }
});

// 시스템 프롬프트 생성
function buildSystemPrompt(userContext, intent) {
  return `
당신은 DeepBreath 명상 앱의 AI 가이드 '세레나'입니다.

사용자 정보:
- 명상 경험: ${userContext.experience}
- 선호하는 명상 유형: ${userContext.preferences.meditationType}
- 최근 세션: ${userContext.recentSessions.length}회
- 현재 목표: ${userContext.goals.join(', ')}

대화 규칙:
1. 항상 따뜻하고 공감적인 톤으로 응답하세요
2. 구체적이고 실용적인 조언을 제공하세요
3. 의료적 조언은 피하고 전문가 상담을 권하세요
4. 사용자의 진전을 격려하고 인정하세요
5. 한국어로 자연스럽게 대화하세요

현재 의도: ${intent}
`;
}
```

### 3. 프론트엔드 챗봇 UI
**기간**: 2주
**우선순위**: 중간

#### 챗봇 인터페이스 컴포넌트
```javascript
// ChatBot.js
const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const sendMessage = async (message) => {
    setIsTyping(true);
    
    // 사용자 메시지 추가
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);
    
    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: getCurrentUser().id,
          sessionId: generateSessionId()
        })
      });
      
      const data = await response.json();
      
      // AI 응답 추가
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        recommendations: data.recommendations
      }]);
      
    } catch (error) {
      console.error('챗봇 오류:', error);
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <div className={`chatbot ${isOpen ? 'open' : 'closed'}`}>
      <ChatHeader onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <>
          <MessageList messages={messages} isTyping={isTyping} />
          <ChatInput 
            value={inputValue}
            onChange={setInputValue}
            onSend={sendMessage}
          />
        </>
      )}
    </div>
  );
};
```

## 🎨 개인화 시스템

### 1. 사용자 행동 분석
**기간**: 3주
**우선순위**: 높음

#### 데이터 수집 포인트
```javascript
const trackingEvents = {
  session_events: [
    'session_started',
    'session_completed',
    'session_paused',
    'session_skipped'
  ],
  interaction_events: [
    'animation_changed',
    'music_selected',
    'volume_adjusted',
    'chat_initiated'
  ],
  preference_events: [
    'favorite_added',
    'playlist_created',
    'setting_changed',
    'feedback_given'
  ]
};

// 행동 패턴 분석
const analyzeUserBehavior = async (userId) => {
  const sessions = await Session.find({ userId }).sort({ createdAt: -1 }).limit(30);
  
  return {
    preferredTimes: extractPreferredTimes(sessions),
    averageSessionLength: calculateAverageLength(sessions),
    favoriteAnimations: findFavoriteAnimations(sessions),
    musicPreferences: analyzeMusicChoices(sessions),
    progressTrend: calculateProgressTrend(sessions),
    engagementLevel: calculateEngagement(sessions)
  };
};
```

### 2. 추천 알고리즘 구현
**기간**: 3주
**우선순위**: 높음

#### 콘텐츠 기반 필터링
```javascript
class RecommendationEngine {
  constructor() {
    this.weights = {
      userPreference: 0.4,
      sessionHistory: 0.3,
      timeOfDay: 0.1,
      mood: 0.1,
      similarUsers: 0.1
    };
  }
  
  async generateRecommendations(userId, context = {}) {
    const userProfile = await this.getUserProfile(userId);
    const behaviorData = await this.getBehaviorData(userId);
    
    // 음악 추천
    const musicRecommendations = await this.recommendMusic(userProfile, behaviorData, context);
    
    // 애니메이션 추천
    const animationRecommendations = await this.recommendAnimations(userProfile, behaviorData);
    
    // 세션 길이 추천
    const sessionDuration = this.recommendSessionDuration(behaviorData, context);
    
    return {
      music: musicRecommendations,
      animations: animationRecommendations,
      sessionDuration,
      reasoning: this.explainRecommendations(userProfile, context)
    };
  }
  
  async recommendMusic(userProfile, behaviorData, context) {
    const scores = {};
    const allMusic = await Music.find({ isPremium: { $lte: userProfile.isPremium } });
    
    for (const track of allMusic) {
      let score = 0;
      
      // 사용자 선호도 기반
      if (userProfile.preferences.musicGenres.includes(track.category)) {
        score += this.weights.userPreference;
      }
      
      // 시간대 기반
      if (this.isTimeAppropriate(track, context.timeOfDay)) {
        score += this.weights.timeOfDay;
      }
      
      // 기분 기반
      if (track.mood === context.mood) {
        score += this.weights.mood;
      }
      
      // 과거 세션 기반
      if (behaviorData.favoriteGenres.includes(track.category)) {
        score += this.weights.sessionHistory;
      }
      
      scores[track._id] = score;
    }
    
    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);
  }
}
```

### 3. 개인화된 대시보드
**기간**: 2주
**우선순위**: 중간

#### 대시보드 컴포넌트
```javascript
// PersonalizedDashboard.js
const PersonalizedDashboard = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    loadPersonalizedContent();
  }, []);
  
  const loadPersonalizedContent = async () => {
    const [recsData, statsData, goalsData] = await Promise.all([
      fetch('/api/recommendations').then(r => r.json()),
      fetch('/api/user/stats').then(r => r.json()),
      fetch('/api/user/goals').then(r => r.json())
    ]);
    
    setRecommendations(recsData);
    setStats(statsData);
    setGoals(goalsData);
  };
  
  return (
    <div className="personalized-dashboard">
      <WelcomeSection user={getCurrentUser()} />
      
      <StatsOverview 
        totalSessions={stats?.totalSessions}
        totalMinutes={stats?.totalMinutes}
        streak={stats?.currentStreak}
        improvement={stats?.improvement}
      />
      
      <RecommendedContent 
        music={recommendations?.music}
        animations={recommendations?.animations}
        sessionDuration={recommendations?.sessionDuration}
      />
      
      <GoalsProgress goals={goals} />
      
      <RecentActivity sessions={stats?.recentSessions} />
    </div>
  );
};
```

## 🧠 고급 개인화 기능

### 1. 적응형 세션 조정
**기간**: 2주
**우선순위**: 중간

#### 실시간 조정 시스템
```javascript
class AdaptiveSessionManager {
  constructor() {
    this.adjustmentFactors = {
      breathingRate: 0.3,
      heartRateVariability: 0.2,
      sessionProgress: 0.2,
      userFeedback: 0.3
    };
  }
  
  async adjustSession(sessionId, biometricData) {
    const session = await Session.findById(sessionId);
    const adjustments = {};
    
    // 호흡 패턴 기반 조정
    if (biometricData.breathingRate > session.targetBreathingRate * 1.2) {
      adjustments.musicTempo = 'slower';
      adjustments.animationSpeed = 'reduced';
      adjustments.guidanceFrequency = 'increased';
    }
    
    // 스트레스 레벨 기반 조정
    if (biometricData.stressLevel > 0.7) {
      adjustments.sessionExtension = 5; // 5분 연장
      adjustments.musicCategory = 'nature'; // 자연음으로 변경
    }
    
    return adjustments;
  }
}
```

### 2. 소셜 기능 (선택적)
**기간**: 2주
**우선순위**: 낮음

#### 커뮤니티 기능
- 익명 진행 상황 공유
- 명상 챌린지 참여
- 격려 메시지 교환
- 그룹 명상 세션

## 📊 성공 지표

### 사용자 참여도
- 챗봇 사용률: > 60%
- 개인화 추천 수용률: > 40%
- 세션 완료율 향상: +25%
- 사용자 만족도: > 4.6/5

### 기술적 지표
- 챗봇 응답 시간: < 2초
- 추천 정확도: > 70%
- API 가용성: > 99.5%
- 개인화 처리 시간: < 500ms

## 🚨 위험 요소 및 대응

### 1. AI 응답 품질
**위험**: 부적절하거나 잘못된 조언
**대응**:
- 응답 필터링 시스템
- 정기적인 대화 품질 검토
- 사용자 피드백 수집

### 2. 개인정보 보호
**위험**: 민감한 개인 데이터 노출
**대응**:
- 데이터 암호화
- 최소 데이터 수집 원칙
- GDPR 준수

### 3. API 비용 관리
**위험**: AI API 비용 급증
**대응**:
- 사용량 모니터링
- 캐싱 전략 구현
- 비용 임계값 설정

## 📅 상세 일정

### 17-18주차 (Phase 3 시작)
- [ ] AI 챗봇 아키텍처 설계
- [ ] OpenAI API 통합
- [ ] 기본 대화 플로우 구현

### 19-20주차
- [ ] 의도 분류 시스템 구축
- [ ] 사용자 컨텍스트 관리
- [ ] 챗봇 UI 개발

### 21-22주차
- [ ] 행동 분석 시스템 구현
- [ ] 추천 알고리즘 개발
- [ ] 개인화 대시보드 구축

### 23-24주차
- [ ] 적응형 세션 조정 기능
- [ ] 고급 개인화 기능
- [ ] 성능 최적화

### 25-26주차
- [ ] 베타 테스트 및 피드백 수집
- [ ] AI 모델 파인튜닝
- [ ] 버그 수정 및 개선

## 🎯 다음 단계 준비

Phase 4를 위한 준비:
- 고급 시각화 기능을 위한 데이터 구조
- 소셜 기능 확장 계획
- 성능 최적화 전략 수립

---

*Phase 3 완료 후 Phase 4: 고급 기능 & 최적화로 진행합니다.*
