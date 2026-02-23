import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Layers,
  Hourglass,
  X,
  Music,
  Bird,
  Wind,
  Waves,
  Bug,
  Bell,
  Lock,
  Flower,
  Play,
  Pause,
  CloudRain,
  CloudSun,
  Wind as WindIcon,
  CloudLightning,
  Droplets,
  RotateCcw,
  Ban,
  Settings
} from 'lucide-react';
import {
  Note,
  RainDrop,
  Ripple,
  AmbienceType,
  AmbienceConfig,
  Theme,
  NoteParticle,
  SoundType,
  PresetEffect
} from './types';
import { NOTES, THEMES, GRAVITY_SPEED, PAD_Y_PERCENT, SHISHIODOSHI_PRESETS } from './constants';
import { audioEngine } from './services/audioEngine';
import { billingService } from './services/billingService';
import SakuraVisualizer from './components/SakuraVisualizer';
import SakuraTree from './components/SakuraTree';
import './index.css'; // これが Tailwind の設定を含んでるはずや！

interface SongStep {
  noteId: string;
  delay: number;
}

const SONGS: Record<string, { name: string, steps: SongStep[], isPremium?: boolean }> = {
  sakura: {
    name: 'さくらさくら',
    steps: [
      { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
      { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
      { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_d4', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 800 },
      { noteId: 'n_g3', delay: 800 }, { noteId: 'n_e3', delay: 800 }, { noteId: 'n_d3', delay: 1600 },
    ]
  },
  haru: {
    name: '春の調べ',
    isPremium: true,
    steps: [
      { noteId: 'n_d3', delay: 300 }, { noteId: 'n_e3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_b3', delay: 600 },
      { noteId: 'n_d4', delay: 300 }, { noteId: 'n_b3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_e3', delay: 600 },
      { noteId: 'n_g4', delay: 400 }, { noteId: 'n_a4', delay: 400 }, { noteId: 'n_b4', delay: 800 },
      { noteId: 'n_a4', delay: 400 }, { noteId: 'n_g4', delay: 400 }, { noteId: 'n_e4', delay: 800 },
    ]
  },
  tsuki: {
    name: '月夜の川',
    isPremium: true,
    steps: [
      { noteId: 'n_d3', delay: 1200 }, { noteId: 'n_a3', delay: 1200 }, { noteId: 'n_d4', delay: 2400 },
      { noteId: 'n_e3', delay: 1200 }, { noteId: 'n_b3', delay: 1200 }, { noteId: 'n_e4', delay: 2400 },
      { noteId: 'n_g3', delay: 1200 }, { noteId: 'n_d4', delay: 1200 }, { noteId: 'n_g4', delay: 2400 },
    ]
  },
  fubuki: {
    name: '花吹雪',
    isPremium: true,
    steps: [
      { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_g4', delay: 200 }, { noteId: 'n_e4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_g3', delay: 200 }, { noteId: 'n_a3', delay: 200 }, { noteId: 'n_d3', delay: 800 },
    ]
  }
};

interface SoundPreset {
  name: string;
  density: number;
  icon: React.ReactNode;
  ambience: Partial<Record<AmbienceType, boolean>>;
  distant: number;
  eaves: number;
  landscape: number;
  effect: PresetEffect;
  isPremium?: boolean;
}

const SOUND_PRESETS: Record<string, SoundPreset> = {
  fox: {
    name: '狐の嫁入り',
    density: 0.15,
    icon: <CloudSun size={14} />,
    ambience: { rain: true, birds: true, windChime: true, thunder: true, wind: false, smallBirds: false, river: false, crickets: false, honeybee: false, suikinkutsu: false },
    distant: 0.9, eaves: 0.1, landscape: 0.3, effect: 'fox'
  },
  shower: {
    name: '花時雨',
    density: 0.4,
    icon: <CloudRain size={14} />,
    ambience: { rain: true, smallBirds: true, river: true, suikinkutsu: true, birds: false, wind: false, crickets: false, windChime: false, thunder: false, honeybee: false },
    distant: 0.7, eaves: 0.3, landscape: 0.5, effect: 'shower',
    isPremium: true
  },
  scatter: {
    name: '花散らし',
    density: 0.6,
    icon: <WindIcon size={14} />,
    ambience: { rain: true, wind: true, windChime: true, thunder: true, river: false, honeybee: false, birds: false, smallBirds: false, crickets: false, suikinkutsu: false },
    distant: 0.5, eaves: 0.5, landscape: 0.6, effect: 'blizzard',
    isPremium: true
  },
  storm: {
    name: '春の嵐',
    density: 0.9,
    icon: <CloudLightning size={14} />,
    ambience: { rain: true, wind: true, river: true, crickets: true, suikinkutsu: true, birds: false, smallBirds: false, honeybee: false, windChime: false, thunder: false },
    distant: 0.6, eaves: 0.7, landscape: 0.4, effect: 'storm',
    isPremium: false
  }
};

const SOUND_LABELS: Record<SoundType, string> = {
  Suikin: '水琴',
  Bamboo: '竹',
  Crystal: '水晶',
  MusicBox: 'オルゴール',
  Ether: '空',
  Deep: '深響'
};

const SERENE_QUOTES = [
  "雨の音に、心を寄せて",
  "静寂は、波紋のなかに",
  "時の流れを、音に聴く",
  "静かな庭で、自分と向き合う",
  "一滴の雫が、世界を揺らす",
  "雨上がり、虹を待つ心",
  "風のささやき、花の溜息",
  "立ち止まることも、旅のひとつ",
  "今日の雨が、明日の花を咲かせる",
  "雑音を捨て、雨音に溶ける",
  "揺れる花びら、変わらぬ静けさ",
  "雨の音は、空からの手紙",
  "雨音の隙間へ、忘れものを探しに",
  "風が書いた物語のひとかけら",
  "さよならも言わず、春は透き通る",
  "世界が眠るまで、庭の呼吸を聴いている",
  "昨日までの渇きを、ひとしずくの音が癒やす",
  "空が泣き止むまで、ここで静けさを編もう",
  "静けさの中に、答えは落ちている",
  "心の雨が、あなたの庭を潤す",
  "一雨ごとに、春は深まり、心は透き通る",
  "今日は、ただ雨音を聴くだけで",
  "何もしない時間が、心を耕す",
  "誰かのためではなく、自分のための静寂を",
  "呼吸を整える、庭が深まる",
  "春の雨は、優しく心をほどいてくれる",
  "雨は、明日への準備",
  "花びらが、雨を受け止めている",
  "濡れた枝先に、春が宿る",
  "まだ散らない花もある",
  "雨粒が、枝先でひと息つく",
  "まだ開かない蕾も、春を知っている",
  "花の影が、水面でほどけていく",
  "濡れた石畳に、やわらかな時間",
  "風が止むと、雨の声が近づく",
  "花びらは、急がない",
  "庭の奥で、小さな春が揺れる",
  "曇り空にも、光はある",
  "雨は、静けさの輪郭を描く",
  "濡れた空気が、心をやわらげる",
  "きれいに散ることも、桜",
  "ひとしずく、またひとしずく",
  "春は、音のかたちをしている",
  "遠くの雨が、こちらへ歩いてくる",
  "花びらが、音に溶ける",
  "まだ何も、決めなくていい",
  "雨は、急かさない",
  "濡れた土が、静かに息をする",
  "枝の先に、今日が宿る",
  "空は、低くやさしい",
  "雨音が、部屋をやわらかくする",
  "咲いていることに、理由はいらない",
  "風は、花の記憶を運ぶ",
  "春の庭は、まだ眠らない",
  "音だけが、ここにある",
  "花びらが、時間をほどく",
  "雨は、遠い日の匂い",
  "散ることも、春のひとつ",
  "水たまりに、空が落ちる",
  "桜の雨が、窓をそっと叩く夜",
  "春雨の音に、今日の心をそっとゆだねて",
  "ひとしずく、落ちるたびにほどける心",
  "指先で、小さな波を起こしてみる",
  "何もしなくても、雨は降る",
  "言葉にならない、想いを音に",
  "雨粒の、ひとつひとつに宿る",
  "春の風が、雨雲を運ぶ",
  "迷いは雨に溶けて、音になる",
  "繰り返される、ひととき",
  "いつかの涙が、音になる",
  "重なる音が、心をほどく",
  "池にたゆたう、花びらのように",
  "その種は、やがて花になる",
  "雨が音になり、音が雨になる",
  "てのひらに、ひとひらの音",
  "記憶はやがて、音になる",
];

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasStarted, setHasStarted] = useState(false);
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<NoteParticle[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const [showMixer, setShowMixer] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showEisho, setShowEisho] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [lockShakeTarget, setLockShakeTarget] = useState<string | null>(null);
  const [premiumToastVisible, setPremiumToastVisible] = useState(false);
  const premiumToastTimerRef = useRef<number | null>(null);
  const [backgroundPlayback, setBackgroundPlayback] = useState<boolean>(() => {
    const saved = localStorage.getItem('sakura_ame_backgroundPlayback');
    return saved !== null ? saved === 'true' : true;
  });
  const [purchaseStatus, setPurchaseStatus] = useState<'success' | 'canceled' | 'failed' | null>(null);
  const [isBillingReady, setIsBillingReady] = useState(false);

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('sakura_ame_premium') === 'true';
  });

  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_masterVolume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [distantRainVol, setDistantRainVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_distantRainVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [eavesRainVol, setEavesRainVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_eavesRainVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [landscapeVol, setLandscapeVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_landscapeVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [rainDensity, setRainDensity] = useState<number>(() => {
    const saved = localStorage.getItem('sakura_ame_rainDensity');
    return saved !== null ? parseFloat(saved) : 0.15;
  });

  const [currentSoundType, setCurrentSoundType] = useState<SoundType>(() => {
    const saved = localStorage.getItem('sakura_ame_soundType');
    return (saved as SoundType) || 'Suikin';
  });

  const currentSoundTypeRef = useRef<SoundType>(currentSoundType);
  const [activeEffect, setActiveEffect] = useState<PresetEffect>('none');
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedId = localStorage.getItem('sakura_ame_themeId');
    return THEMES.find(t => t.id === savedId) || THEMES[0];
  });

  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isTimerFinishedFading, setIsTimerFinishedFading] = useState(false);
  const [isShishiodoshiTilting, setIsShishiodoshiTilting] = useState(false);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentSongKey, setCurrentSongKey] = useState<string>('sakura');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const autoPlayTimeoutRef = useRef<number | null>(null);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>(() => {
    const saved = localStorage.getItem('sakura_ame_ambience');
    const defaultAmbience = {
      rain: { active: true, volume: 0.3 },
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      smallBirds: { active: false, volume: 0.3 },
      river: { active: false, volume: 0.4 },
      crickets: { active: false, volume: 0.2 },
      windChime: { active: false, volume: 0.2, isPremium: true },
      honeybee: { active: false, volume: 0.4, isPremium: true },
      thunder: { active: false, volume: 0.3, isPremium: true },
      suikinkutsu: { active: false, volume: 0.4, isPremium: true },
    };
    return saved ? JSON.parse(saved) : defaultAmbience;
  });

  const [currentQuote, setCurrentQuote] = useState("");

  const [loginStreak, setLoginStreak] = useState<number>(1);
  const [justResetStreak, setJustResetStreak] = useState(false);

  const requestRef = useRef<number>(null);
  const activeNotificationRef = useRef<Notification | null>(null);
  const bgNotificationIntervalRef = useRef<number | null>(null);
  const timerRemainingRef = useRef<number | null>(timerRemaining);

  // スワイプ追跡用 refs
  const isDraggingRef = useRef(false);
  const lastSwipedNoteRef = useRef<string | null>(null);
  const swipeCooldownRef = useRef<Record<string, number>>({});
  const leftDrumRef = useRef<HTMLDivElement>(null);
  const rightDrumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const localPremium = localStorage.getItem('sakura_ame_premium');
    if (localPremium === 'true') {
      setIsPremium(true);
    }
  }, []);

  // 起動日数の管理 (Sakura Tree)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastOpened = localStorage.getItem('sakura_ame_last_opened');
    let streak = parseInt(localStorage.getItem('sakura_ame_login_streak') || '1', 10);

    if (lastOpened !== today) {
      if (lastOpened) {
        // 前回の記録がある場合のみカウントアップ（初回は1のまま）
        if (streak >= 15) {
          // 15日目に達した次の日は 1 にリセット
          streak = 1;
        } else {
          streak += 1;
        }
      }
      localStorage.setItem('sakura_ame_last_opened', today);
      localStorage.setItem('sakura_ame_login_streak', streak.toString());

      if (streak === 15) {
        setJustResetStreak(true); // 今回散るアニメーションを見せるフラグ
      }
    } else {
      // 今日すでに開いている場合は、リロード時に15日目なら再度アニメーションを見せるか、そのままにするか。
      // 今回は「15日目の間は何度でも散る」仕様とする。
      if (streak === 15) {
        setJustResetStreak(true);
      }
    }

    setLoginStreak(streak);
  }, []);

  useEffect(() => {
    localStorage.setItem('sakura_ame_masterVolume', masterVolume.toString());
    localStorage.setItem('sakura_ame_distantRainVol', distantRainVol.toString());
    localStorage.setItem('sakura_ame_eavesRainVol', eavesRainVol.toString());
    localStorage.setItem('sakura_ame_landscapeVol', landscapeVol.toString());
    localStorage.setItem('sakura_ame_rainDensity', rainDensity.toString());
    localStorage.setItem('sakura_ame_soundType', currentSoundType);
    localStorage.setItem('sakura_ame_themeId', currentTheme.id);
    localStorage.setItem('sakura_ame_ambience', JSON.stringify(ambience));
    localStorage.setItem('sakura_ame_backgroundPlayback', String(backgroundPlayback));
  }, [masterVolume, distantRainVol, eavesRainVol, landscapeVol, rainDensity, currentSoundType, currentTheme, ambience, backgroundPlayback]);

  // バックグラウンド通知を表示する関数
  const showBackgroundNotification = useCallback(async (remaining?: number | null) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }

    const isTimerActive = remaining !== undefined && remaining !== null && remaining > 0;
    const bodyText = isTimerActive
      ? `タイマー残り時間: ${Math.floor(remaining / 60)}分${remaining % 60}秒`
      : '雨が静かに降っています';

    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification(isTimerActive ? '桜雨 (タイマー作動中)' : '桜雨', {
          body: bodyText,
          icon: 'notification-icon.png',
          badge: 'notification-icon.png',
          tag: 'sakura-ame-bg',
          renotify: true,
          silent: true,
          actions: [
            { action: 'stop', title: '雨を止める' }
          ],
        } as NotificationOptions);
      } else {
        // SW が無い場合はフォールバック（アクションボタンなし）
        const n = new Notification(isTimerActive ? '桜雨 (タイマー作動中)' : '桜雨', {
          body: bodyText,
          icon: 'notification-icon.png',
          tag: 'sakura-ame-bg',
          silent: true,
        });
        activeNotificationRef.current = n;
      }
    } catch {
      // 通知表示に失敗した場合は静かに無視
    }
  }, []);

  // timerRemaining の最新値を ref に同期（バックグラウンドインターバルから参照するため）
  useEffect(() => {
    timerRemainingRef.current = timerRemaining;
  }, [timerRemaining]);

  // visibilitychange: バックグラウンド時のミュート & 通知
  useEffect(() => {
    const stopBgInterval = () => {
      if (bgNotificationIntervalRef.current) {
        window.clearInterval(bgNotificationIntervalRef.current);
        bgNotificationIntervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        // フォアグラウンド復帰
        stopBgInterval();
        setDrops([]);
        if (!isMuted) {
          audioEngine.setMasterVolume(masterVolume);
        }
        // 通知を閉じる
        if (activeNotificationRef.current) {
          activeNotificationRef.current.close();
          activeNotificationRef.current = null;
        }
        // SW 経由の通知もクリア
        navigator.serviceWorker?.ready.then((reg) => {
          reg.getNotifications({ tag: 'sakura-ame-bg' }).then((notifications) => {
            notifications.forEach((n) => n.close());
          });
        }).catch(() => { });
      } else {
        // バックグラウンドへ
        if (!backgroundPlayback) {
          // OFF → ミュート
          audioEngine.setMasterVolume(0);
        } else {
          // ON → 即座に通知表示 & 1秒ごとに更新
          showBackgroundNotification(timerRemainingRef.current);
          stopBgInterval();
          bgNotificationIntervalRef.current = window.setInterval(() => {
            showBackgroundNotification(timerRemainingRef.current);
          }, 1000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopBgInterval();
    };
  }, [backgroundPlayback, isMuted, masterVolume, showBackgroundNotification]);

  // Service Worker からの STOP_RAIN メッセージをリッスン
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_RAIN') {
        setIsMuted(true);
        audioEngine.setMasterVolume(0);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initBilling = async () => {
      try {
        const isAvailable = await billingService.init();
        if (isMounted) setIsBillingReady(isAvailable);

        if (isAvailable) {
          try {
            const hasPurchased = await billingService.checkPurchaseHistory();
            if (isMounted && hasPurchased) {
              setIsPremium(true);
              localStorage.setItem('sakura_ame_premium', 'true');
            }
          } catch (historyError) {
            console.error("History check failed:", historyError);
          }
        }

      } catch (initError) {
        console.error("Billing init error:", initError);
        if (isMounted) setIsBillingReady(false);
      }
    };

    initBilling();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    currentSoundTypeRef.current = currentSoundType;
  }, [currentSoundType]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval: number;
    if (timerRemaining !== null && timerRemaining > 0) {
      interval = window.setInterval(() => {
        setTimerRemaining(prev => {
          if (prev === null) return null;
          if (prev === 16) audioEngine.fadeOutMaster(15);
          if (prev <= 1) {
            finishTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRemaining]);

  // プレロード（事前読み込み）の処理
  useEffect(() => {
    const imagesToPreload = [
      'bg-start.webp',
      // t => t.bgImage と記述して、リスト内の各要素を正しく参照します
      ...THEMES.map(t => t.bgImage),
      ...THEMES.map(t => t.bgImage2x)
    ].filter(src => typeof src === 'string'); // 念のため、空の要素を除外するガードを入れるとより安全です

    imagesToPreload.forEach((src) => {
      const img = new Image();
      // ここで src が undefined にならないよう徹底
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  // 起動時の「一言」をセット
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SERENE_QUOTES.length);
    setCurrentQuote(SERENE_QUOTES[randomIndex]);
  }, []);

  const finishTimer = () => {
    setTimerRemaining(0);
    setDrops([]);
    setIsAutoPlaying(false);
    setIsShishiodoshiTilting(true);
    setTimeout(() => {
      setIsShishiodoshiTilting(false);
      audioEngine.playShishiodoshi();
      audioEngine.playTempleBell();
      triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, '#fff', 300);
    }, 1500);

    setTimeout(() => {
      setIsTimerFinished(true);
      setTimerTotal(null);
      setTimerRemaining(null);
    }, 15000);
  };

  const startExperience = async () => {
    audioEngine.init();
    await audioEngine.resume();
    (Object.keys(ambience) as AmbienceType[]).forEach((type) => {
      audioEngine.setAmbience(type, ambience[type].active, ambience[type].volume);
    });
    audioEngine.setLayerVolume('distantRain', distantRainVol);
    audioEngine.setLayerVolume('eavesRain', eavesRainVol);
    audioEngine.setLayerVolume('landscape', landscapeVol);
    audioEngine.setMasterVolume(masterVolume);
    setHasStarted(true);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMasterVolume(nextMute ? 0 : masterVolume);
  };

  const triggerPremiumLock = useCallback((targetId: string) => {
    audioEngine.playLockSound();
    setLockShakeTarget(targetId);
    setTimeout(() => setLockShakeTarget(null), 500);
    setPremiumToastVisible(true);
    if (premiumToastTimerRef.current) window.clearTimeout(premiumToastTimerRef.current);
    premiumToastTimerRef.current = window.setTimeout(() => setPremiumToastVisible(false), 3000);
  }, []);

  const toggleAmbience = (type: AmbienceType) => {
    if (ambience[type].isPremium && !isPremium) {
      triggerPremiumLock(`ambience-${type}`);
      return;
    }
    const nextActive = !ambience[type].active;
    const nextAmbience = {
      ...ambience,
      [type]: { ...ambience[type], active: nextActive }
    };
    setAmbience(nextAmbience);
    audioEngine.setAmbience(type, nextActive, ambience[type].volume);
  };

  const applySoundPreset = (key: string) => {
    const preset = SOUND_PRESETS[key];
    if (!preset) return;

    if (preset.isPremium && !isPremium) {
      triggerPremiumLock(`preset-${key}`);
      return;
    }

    const newAmbience = { ...ambience };
    (Object.keys(newAmbience) as AmbienceType[]).forEach(type => {
      const isActive = preset.ambience[type] ?? false;
      if (newAmbience[type].isPremium && !isPremium && isActive) {
        newAmbience[type].active = false;
      } else {
        newAmbience[type].active = isActive;
      }
      audioEngine.setAmbience(type, newAmbience[type].active, newAmbience[type].volume);
    });

    setAmbience(newAmbience);
    setRainDensity(preset.density);

    setDistantRainVol(preset.distant);
    setEavesRainVol(preset.eaves);
    setLandscapeVol(preset.landscape);
    setActiveEffect(preset.effect);

    audioEngine.setLayerVolume('distantRain', preset.distant);
    audioEngine.setLayerVolume('eavesRain', preset.eaves);
    audioEngine.setLayerVolume('landscape', preset.landscape);

    triggerVisualRipple(dimensions.width / 2, dimensions.height - 100, currentTheme.accentColor, 100);
  };

  const selectSong = (key: string) => {
    const song = SONGS[key];
    if (song.isPremium && !isPremium) {
      triggerPremiumLock(`song-${key}`);
      return;
    }
    setCurrentSongKey(key);
    setCurrentStepIndex(0);
    setIsAutoPlaying(true);
    closePopups();
  };

  const selectTheme = (theme: Theme) => {
    if (theme.isPremium && !isPremium) {
      triggerPremiumLock(`theme-${theme.id}`);
      return;
    }
    setCurrentTheme(theme);
    closePopups();
  };

  const selectInstrument = (type: SoundType) => {
    setCurrentSoundType(type);
    closePopups();
  };

  const handlePurchase = async () => {
    if (!isBillingReady || purchaseStatus === 'processing') return;

    try {
      setPurchaseStatus('processing');

      // 念のため再確認
      const alreadyOwned = await billingService.checkPurchaseHistory();

      if (alreadyOwned) {
        setIsPremium(true);
        localStorage.setItem('sakura_ame_premium', 'true');

        setShowPremiumModal(false); // ← 先に閉じる
        setPurchaseStatus('success');

        setTimeout(() => {
          setPurchaseStatus(null);
        }, 4000);

        return;
      }

      const result = await billingService.requestPurchase();

      if (result === 'success') {
        setIsPremium(true);
        localStorage.setItem('sakura_ame_premium', 'true');

        setShowPremiumModal(false); // ← 先に閉じる
        setPurchaseStatus('success');

        setTimeout(() => {
          setPurchaseStatus(null);
        }, 4000);

      } else if (result === 'canceled') {
        setPurchaseStatus('canceled');
        setTimeout(() => setPurchaseStatus(null), 2000);

      } else {
        setPurchaseStatus('failed');
        setTimeout(() => setPurchaseStatus(null), 2000);
      }

    } catch (error: any) {
      console.error("Purchase error:", error);

      if (error?.code === 'ITEM_ALREADY_OWNED') {
        setIsPremium(true);
        localStorage.setItem('sakura_ame_premium', 'true');

        setShowPremiumModal(false);
        setPurchaseStatus('success');

        setTimeout(() => {
          setPurchaseStatus(null);
        }, 4000);

      } else if (error?.code === 'USER_CANCELED') {
        setPurchaseStatus('canceled');
        setTimeout(() => setPurchaseStatus(null), 2000);

      } else {
        setPurchaseStatus('failed');
        setTimeout(() => setPurchaseStatus(null), 2000);
      }
    }
  };



  // 波紋を生成する関数
  const triggerVisualRipple = (x: number, y: number, color: string, startSize: number = 10) => {
    const newRipple: Ripple = {
      id: Math.random().toString(36),
      x,
      y,
      size: startSize,
      opacity: 0.8,
      color: color
    };
    setRipples(prev => [...prev, newRipple]);
  };

  const handleHit = useCallback((noteId: string, x: number, y: number) => {
    const note = NOTES.find(n => n.id === noteId);
    if (note && !isMuted) {
      audioEngine.playTone(note.frequency, currentSoundTypeRef.current);

      const burst: NoteParticle[] = [];
      const pCount = activeEffect === 'blizzard' ? 12 : 6;
      for (let i = 0; i < pCount; i++) {
        burst.push({
          id: Math.random().toString(36),
          x: x,
          y: y,
          rotation: Math.random() * Math.PI * 2,
          opacity: 1,
          velocity: {
            x: (Math.random() - 0.5) * (activeEffect === 'blizzard' ? 8 : 4),
            y: -1.5 - Math.random() * (activeEffect === 'blizzard' ? 4 : 2)
          },
          color: currentTheme.particleColor,
          size: 6 + Math.random() * 8
        });
      }
      setParticles(prev => [...prev, ...burst]);
    } // 👈 if文の終わり

    triggerVisualRipple(x, y, currentTheme.accentColor, 10); // 👈 ここを安全にコメントアウト
  }, [isMuted, currentTheme, activeEffect]);

  const spawnDrop = useCallback((noteId: string) => {
    if (isTimerFinished || document.hidden) return;
    setActiveNote(noteId);
    setTimeout(() => setActiveNote(null), 300);
    const note = NOTES.find(n => n.id === noteId);
    if (!note) return;
    const startX = (dimensions.width * note.cloudLeft) / 100 + (Math.random() * 40 - 20);
    const targetY = (dimensions.height * PAD_Y_PERCENT) / 100;

    const baseSpeed = activeEffect === 'storm' ? GRAVITY_SPEED + 6 : GRAVITY_SPEED;

    setDrops(prev => [...prev, {
      id: Math.random().toString(36),
      noteId: note.id,
      x: startX,
      y: -50,
      speed: baseSpeed + (Math.random() * 4),
      targetY: targetY,
      hasHit: false,
      opacity: 0.6 + Math.random() * 0.4
    }]);
  }, [isTimerFinished, dimensions, activeEffect]);

  // スワイプ: 座標から最寄りの花弁ノートを探す
  const findNoteAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    const drumRefs = [leftDrumRef, rightDrumRef];
    const drumIndices = [0, 1];
    const HIT_RADIUS = 40; // px — 花弁の当たり判定半径

    for (let d = 0; d < drumRefs.length; d++) {
      const drumEl = drumRefs[d].current;
      if (!drumEl) continue;
      const rect = drumEl.getBoundingClientRect();
      const drumNotes = NOTES.filter(n => n.drumIndex === drumIndices[d]);

      for (const note of drumNotes) {
        // 花弁の位置をドラム内 % からスクリーン座標に変換
        const noteScreenX = rect.left + (note.left / 100) * rect.width;
        const noteScreenY = rect.top + (note.top / 100) * rect.height;
        const dx = clientX - noteScreenX;
        const dy = clientY - noteScreenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HIT_RADIUS) {
          return note.id;
        }
      }
    }
    return null;
  }, []);

  // スワイプ: 花弁を鳴らす（cooldown 付き）
  const triggerSwipeNote = useCallback((noteId: string) => {
    const now = Date.now();
    const lastTime = swipeCooldownRef.current[noteId] || 0;
    if (now - lastTime < 120) return; // 120ms cooldown
    swipeCooldownRef.current[noteId] = now;
    spawnDrop(noteId);
  }, [spawnDrop]);

  // スワイプ開始
  const handleSwipeStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    lastSwipedNoteRef.current = null;
    swipeCooldownRef.current = {};

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const noteId = findNoteAtPoint(clientX, clientY);
    if (noteId) {
      lastSwipedNoteRef.current = noteId;
      triggerSwipeNote(noteId);
    }
  }, [findNoteAtPoint, triggerSwipeNote]);

  // スワイプ中
  const handleSwipeMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const noteId = findNoteAtPoint(clientX, clientY);

    if (noteId && noteId !== lastSwipedNoteRef.current) {
      lastSwipedNoteRef.current = noteId;
      triggerSwipeNote(noteId);
    }
  }, [findNoteAtPoint, triggerSwipeNote]);

  // スワイプ終了
  const handleSwipeEnd = useCallback(() => {
    isDraggingRef.current = false;
    lastSwipedNoteRef.current = null;
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || isTimerFinished) {
      if (autoPlayTimeoutRef.current) {
        window.clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
      return;
    }
    const song = SONGS[currentSongKey];
    if (!song) return;
    const step = song.steps[currentStepIndex];
    if (document.hidden && backgroundPlayback && !isMuted) {
      const note = NOTES.find(n => n.id === step.noteId);
      if (note) {
        audioEngine.playTone(note.frequency, currentSoundTypeRef.current);
      }
    } else if (!document.hidden) {
      spawnDrop(step.noteId);
    }
    autoPlayTimeoutRef.current = window.setTimeout(() => {
      if (isAutoPlaying) {
        setCurrentStepIndex(prev => (prev + 1) % song.steps.length);
      }
    }, step.delay);
    return () => {
      if (autoPlayTimeoutRef.current) {
        window.clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [isAutoPlaying, currentSongKey, currentStepIndex, isTimerFinished, activeEffect, backgroundPlayback, isMuted]);

  const animate = (time: number) => {
    if (isTimerFinished || document.hidden) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // 1. 雨粒の処理（filterを1回にまとめる）
    setDrops(prev => prev.filter(drop => {
      const newY = drop.y + drop.speed;
      if (!drop.hasHit && newY >= drop.targetY) {
        handleHit(drop.noteId, drop.x, drop.targetY);
        return false; // ヒットしたら即削除
      }
      drop.y = newY; // 破壊的代入でメモリ節約
      return newY < dimensions.height;
    }).map(d => ({ ...d }))); // Reactのために新しい参照だけ作る

    // 2. 波紋の処理
    setRipples(prev => prev
      .map(r => {
        r.size += (r.size > 50 ? 1.5 : 1.2);
        r.opacity -= 0.006;
        return r;
      })
      .filter(r => r.opacity > 0)
      .map(r => ({ ...r }))
    );

    // 3. パーティクルの処理
    setParticles(prev => {
      const MAX = activeEffect === 'blizzard' ? 50 : 30; // さらに絞る
      const next = prev.slice(-MAX).map(p => {
        p.x += p.velocity.x;
        p.y += p.velocity.y + (activeEffect === 'blizzard' ? 0.05 : 0.15);
        p.opacity -= (activeEffect === 'blizzard' ? 0.006 : 0.012);
        return { ...p }; // 最後に1回だけコピー
      }).filter(p => p.opacity > 0);

      if (activeEffect === 'blizzard' && Math.random() > 0.97 && next.length < MAX) {
        next.push({
          id: `b-${time}-${Math.random()}`, // 高速なID生成
          x: -20,
          y: Math.random() * dimensions.height,
          rotation: 0,
          opacity: 1,
          velocity: { x: 2.5, y: 0 },
          color: currentTheme.particleColor,
          size: 8
        });
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }
  }, [hasStarted, dimensions, activeEffect]);

  useEffect(() => {
    if (!hasStarted || isTimerFinished || rainDensity === 0 || isAutoPlaying) return;
    const intervalTime = Math.max(250, 2200 - (rainDensity * 1800));
    const timer = setInterval(() => {
      if (document.hidden) {
        if (backgroundPlayback && !isMuted) {
          const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
          audioEngine.playTone(randomNote.frequency, currentSoundTypeRef.current);
        }
        return;
      }
      const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
      spawnDrop(randomNote.id);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [hasStarted, isTimerFinished, rainDensity, isAutoPlaying, activeEffect, backgroundPlayback, isMuted]);

  const closePopups = () => {
    setShowMixer(false);
    setShowThemes(false);
    setShowTimer(false);
    setShowInstruments(false);
    setShowEisho(false);
    setShowSettings(false);
    setShowPremiumModal(false);
  };

  const resetExperience = () => {
    // まずフェードアウトを開始
    setIsTimerFinishedFading(true);
    // 1秒後（CSSトランジション完了後）に画面を実際にリセット
    setTimeout(() => {
      setIsTimerFinished(false);
      setIsTimerFinishedFading(false);
      setTimerRemaining(null);
      setTimerTotal(null);
      setIsAutoPlaying(false);
      setActiveEffect('none');
      audioEngine.setMasterVolume(masterVolume);
      setDrops([]);
      setParticles([]);
      setRipples([]);
    }, 1000);
  };

  const resetSoundSettings = () => {
    const defaultAmbience = {
      rain: { active: true, volume: 0.3 },
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      smallBirds: { active: false, volume: 0.3 },
      river: { active: false, volume: 0.4 },
      crickets: { active: false, volume: 0.2 },
      windChime: { active: false, volume: 0.2, isPremium: true },
      honeybee: { active: false, volume: 0.4, isPremium: true },
      thunder: { active: false, volume: 0.3, isPremium: true },
      suikinkutsu: { active: false, volume: 0.4, isPremium: true },
    };

    setMasterVolume(0.7);
    setDistantRainVol(0.5);
    setEavesRainVol(0.5);
    setLandscapeVol(0.5);
    setRainDensity(0.15);
    setAmbience(defaultAmbience);
    setActiveEffect('none');

    // 即座にオーディオエンジンに反映
    audioEngine.setMasterVolume(0.7);
    audioEngine.setLayerVolume('distantRain', 0.5);
    audioEngine.setLayerVolume('eavesRain', 0.5);
    audioEngine.setLayerVolume('landscape', 0.5);
    (Object.keys(defaultAmbience) as AmbienceType[]).forEach((type) => {
      audioEngine.setAmbience(type, defaultAmbience[type].active, defaultAmbience[type].volume);
    });

    triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, currentTheme.accentColor, 100);
  };

  const cancelTimer = () => {
    setTimerTotal(null);
    setTimerRemaining(null);
    setIsTimerFinished(false);
    setIsShishiodoshiTilting(false);
    // マスターフェードアウト中かもしれないので、現在のマスターボリュームに戻す
    audioEngine.setMasterVolume(masterVolume);
    triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, '#fff', 50);
  };

  if (!hasStarted) {
    return (
      <div
        className="fixed inset-0 h-[100svh] w-full overflow-hidden cursor-pointer bg-[#1c1917] flex flex-col items-center justify-center"
        onClick={startExperience}
      >
        {/* 背景レイヤー */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="bg-start.webp"
            srcSet="bg-start.webp 1x, bg-start@2x.webp 2x"
            sizes="100vw"
            alt="Spring garden background"
            fetchpriority="high"
            decoding="sync"
            loading="eager"
            className="
    absolute inset-0
    w-full h-[100svh]
    object-cover
    sm:blur-[2px]
  "
          />

          <div className="absolute inset-0 z-10 bg-black/20" />
        </div>

        {/* UIレイヤー */}
        <div className="relative z-10 h-full w-full flex items-center justify-center text-sakura-100">
          <div className="text-center space-y-8 p-12 max-w-lg bg-stone-950/50 sm:backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] animate-ripple-in">
            <h1 className="text-8xl sm:text-7xl font-serif tracking-[0.4em] text-white mb-2">
              桜雨
            </h1>
            <h2 className="text-xl tracking-[0.3em] text-sakura-100/90 uppercase">
              Sakura Ame
            </h2>
            <div className="w-24 h-[1.5px] bg-white/40 mx-auto my-6" />
            <p className="text-sm italic tracking-widest">
              Gentle Rain Instrument
            </p>
            <div className="mt-8 px-14 py-4 border border-white/30 bg-white/5 rounded-full text-xs font-bold tracking-[0.4em] uppercase">
              Start Experience
            </div>
          </div>
        </div>
      </div>
    );
  }



  const isMobile = dimensions.width < 640;
  const drumSize = isMobile ? Math.min(dimensions.width * 0.35, dimensions.height * 0.25) : Math.min(dimensions.width * 0.4, dimensions.height * 0.35);

  return (
    <div className={`relative h-[100svh] w-full bg-stone-950 overflow-hidden font-serif select-none transition-colors duration-1000 grain ${activeEffect === 'storm' ? 'animate-pulse-slow' : ''}`} onMouseDown={() => audioEngine.resume()} onTouchStart={() => audioEngine.resume()}>
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {THEMES.map((theme) => (
          <div key={theme.id} className={`absolute inset-0 transition-opacity duration-[1500ms] pointer-events-none ${currentTheme.id === theme.id ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src={theme.bgImage}
              srcSet={`${theme.bgImage} 1200w, ${theme.bgImage2x} 2400w`}
              sizes="100vw"
              // 明示的なサイズ指定（CLS対策）
              width="1200"
              height="800"
              // CSSでアスペクト比を維持
              style={{ aspectRatio: '3 / 2' }} // 1200:800 = 3:2
              className="w-full h-full object-cover scale-[1.02]"
              alt=""
              decoding="async"
              loading={currentTheme.id === theme.id ? "eager" : "lazy"}
              fetchpriority={currentTheme.id === theme.id ? "high" : "low"}
            />

            <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-20`}></div>
            <div className="absolute inset-0" style={{ backgroundColor: theme.overlayColor }}></div>
          </div>
        ))}
      </div>
      <SakuraVisualizer
        drops={drops}
        ripples={ripples}
        particles={particles}
        width={dimensions.width}
        height={dimensions.height}
        theme={currentTheme}
        activeEffect={activeEffect}
      />

      <SakuraTree streak={loginStreak} justReset={justResetStreak} />


      {isTimerFinished && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-1000"
          style={{
            opacity: isTimerFinishedFading ? 0 : 1,
            transition: 'opacity 1s ease-in-out',
            pointerEvents: isTimerFinishedFading ? 'none' : 'auto',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out"></div>
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-700"></div>
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-1000"></div>
          </div>
          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-6xl text-white font-serif tracking-[0.6em] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse">静寂</h2>
            <p className="text-stone-400 tracking-widest text-xs uppercase">Silence dwells within the ripple.</p>
            <button onClick={resetExperience} className="mt-12 px-12 py-4 border border-white/20 rounded-full text-white hover:text-white hover:border-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md shadow-3xl">Return to Garden</button>
          </div>
        </div>
      )}

      {!isPremium && (
        <div className="absolute top-8 left-8 z-40 flex flex-col gap-4">
          <button onClick={() => setShowPremiumModal(true)} className="flex items-center gap-2 px-6 py-2 bg-sakura-500/20 hover:bg-sakura-500/40 text-sakura-100 border border-sakura-400/30 rounded-full transition-all duration-700 ease-wa-ease  /* 👈 ここで統一感のある動きを適用 */backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.1)] animate-pulse-slow">
            <Flower size={14} className="text-sakura-200" /><span>Unlock Full Garden</span>
          </button>

          {currentQuote && (
            <div className="px-2 animate-fade-in">
              <p className="text-[10px] sm:text-xs font-serif text-white/80 tracking-[0.2em] leading-relaxed italic">
                {currentQuote}
              </p>
            </div>
          )}
        </div>
      )}

      {isPremium && currentQuote && (
        <div className="absolute top-8 left-8 z-40 px-2 animate-fade-in">
          <p className="text-[10px] sm:text-xs font-serif text-white/80 tracking-[0.2em] leading-relaxed italic">
            {currentQuote}
          </p>
        </div>
      )}

      <div className="absolute top-8 right-8 z-40 flex flex-col gap-4">
        <div className="bg-black/5 backdrop-blur-3xl p-2 rounded-full border border-white/10 flex flex-col items-center gap-3 transition-all hover:bg-black/15 shadow-2xl">
          <button onClick={toggleMute} className={`p-3 rounded-full transition-all ${isMuted ? 'text-red-400' : 'text-white hover:scale-110'}`}>{isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <button onClick={() => { closePopups(); setShowTimer(!showTimer); }} className={`p-3 rounded-full transition-all ${timerRemaining !== null ? 'text-sakura-300 scale-110' : 'text-white hover:scale-110'}`}><Hourglass size={22} /></button>
        </div>
      </div>

      <div className="absolute bottom-12 left-8 z-40 flex flex-col gap-5">
        <button onClick={() => { closePopups(); setShowThemes(!showThemes); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showThemes ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Layers size={24} /></button>
        <button onClick={() => { closePopups(); setShowMixer(!showMixer); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showMixer ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Sliders size={24} /></button>
        <button onClick={() => { closePopups(); setShowInstruments(!showInstruments); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showInstruments ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Music size={24} /></button>
      </div>

      <div className="absolute bottom-20 right-8 z-40 flex flex-col items-end gap-3">
        {showEisho && (
          <div className="mb-2 bg-stone-950/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-56 animate-in slide-in-from-right-4 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-white font-serif text-[10px] tracking-[0.3em] uppercase font-bold">詠唱選択</h3>
              <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-1">
              {Object.entries(SONGS).map(([key, song]) => (
                <button key={key} onClick={() => { selectSong(key); setShowEisho(false); }} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase transition-all ${currentSongKey === key && isAutoPlaying ? 'bg-sakura-500/40 text-sakura-100 border border-sakura-300/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                  <span className="flex items-center gap-2">{song.name}{song.isPremium && !isPremium && <Lock size={12} className={`text-amber-400${lockShakeTarget === `song-${key}` ? ' lock-shake' : ''}`} />}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {showSettings && (
          <div className="mb-2 bg-stone-950/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-56 animate-in slide-in-from-right-4 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-white font-serif text-[10px] tracking-[0.3em] uppercase font-bold">設定</h3>
              <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[10px] uppercase tracking-widest text-stone-300">バックグラウンド再生</span>
                <button
                  onClick={() => {
                    const next = !backgroundPlayback;
                    setBackgroundPlayback(next);
                    // ONにしたら通知権限をリクエスト
                    if (next && 'Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission();
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full border transition-all ${backgroundPlayback ? 'bg-sakura-500/50 border-sakura-400' : 'bg-black/40 border-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${backgroundPlayback ? 'left-7' : 'left-1'}`} />
                </button>
              </label>
              <a
                href="https://madobeno.github.io/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase text-white/70 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              >
                プライバシーポリシー
              </a>
              <a
                href="https://madobeno.github.io/madowaku.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase text-white/70 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              >
                madowaku
              </a>
              {!isPremium && (
                <button
                  onClick={async () => {
                    try {
                      const hasPurchased = await billingService.checkPurchaseHistory();
                      if (hasPurchased) {
                        setIsPremium(true);
                        localStorage.setItem('sakura_ame_premium', 'true');
                        setPurchaseStatus('success');
                      } else {
                        setPurchaseStatus('failed');
                      }
                    } catch {
                      setPurchaseStatus('failed');
                    }
                    setTimeout(() => setPurchaseStatus(null), 3000);
                  }}
                  className="block w-full px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase text-white/70 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 text-left"
                >
                  購入の復元
                </button>
              )}
            </div>
          </div>
        )}
        <button onClick={() => { if (isAutoPlaying) setIsAutoPlaying(false); else { closePopups(); setShowEisho(!showEisho); } }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${isAutoPlaying ? 'bg-sakura-500/30 border-sakura-400 text-sakura-100 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}>{isAutoPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
        <button onClick={() => { closePopups(); setShowSettings(!showSettings); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showSettings ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Settings size={24} /></button>
      </div>

      {showMixer && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-80 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4 overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">庭園の調べ</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">基本調整</h4>
              <LayerSlider label="雨の密度" icon={<CloudRain size={12} />} value={rainDensity} accent="accent-sakura-400" onChange={(v) => setRainDensity(v)} />
              <LayerSlider label="全体の響き" icon={<Volume2 size={12} />} value={masterVolume} accent="accent-white" onChange={(v) => { setMasterVolume(v); audioEngine.setMasterVolume(v); }} />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">音響レイヤー</h4>
              <LayerSlider label="背景の雨" icon={<CloudRain size={12} />} value={distantRainVol} accent="accent-sakura-300" onChange={(v) => { setDistantRainVol(v); audioEngine.setLayerVolume('distantRain', v); }} />
              <LayerSlider label="軒先の雨" icon={<Droplets size={12} />} value={eavesRainVol} accent="accent-indigo-300" onChange={(v) => { setEavesRainVol(v); audioEngine.setLayerVolume('eavesRain', v); }} />
              <LayerSlider label="自然の気配" icon={<Bird size={12} />} value={landscapeVol} accent="accent-emerald-300" onChange={(v) => { setLandscapeVol(v); audioEngine.setLayerVolume('landscape', v); }} />
            </div>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>
            <div className="space-y-3">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">情景プリセット</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SOUND_PRESETS).map(([key, preset]) => (
                  <button key={key} onClick={() => applySoundPreset(key)} className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-[10px] transition-all uppercase tracking-widest font-bold ${activeEffect === preset.effect && preset.effect !== 'none' ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/30 border-white/5 text-stone-200 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2 truncate">
                      {preset.icon} <span className="truncate">{preset.name}</span>
                    </div>
                    {preset.isPremium && !isPremium && <Lock size={12} className={`text-amber-400 shrink-0${lockShakeTarget === `preset-${key}` ? ' lock-shake' : ''}`} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>
            <button
              onClick={resetSoundSettings}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 uppercase tracking-[.25em] transition-all"
            >
              <RotateCcw size={14} /> デフォルトに戻す
            </button>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">自然の気配 構成</h4>
              <div className="grid grid-cols-2 gap-2">
                <AmbienceToggle label="鶯" type="birds" icon={<Bird size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="小鳥" type="smallBirds" icon={<Bird size={14} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="春風" type="wind" icon={<Wind size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="せせらぎ" type="river" icon={<Waves size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="鈴虫" type="crickets" icon={<Bug size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="風鈴" type="windChime" icon={<Bell size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} shakeId="ambience-windChime" lockShakeTarget={lockShakeTarget} />
                <AmbienceToggle label="寺鐘" type="thunder" icon={<Bell size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} shakeId="ambience-thunder" lockShakeTarget={lockShakeTarget} />
                <AmbienceToggle label="水琴窟" type="suikinkutsu" icon={<Droplets size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} shakeId="ambience-suikinkutsu" lockShakeTarget={lockShakeTarget} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Drum UI */}
      <div
        className="absolute w-full h-full z-30 animate-wa-float"
        style={{ pointerEvents: 'auto', touchAction: 'none' }}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={handleSwipeStart}
        onMouseMove={handleSwipeMove}
        onMouseUp={handleSwipeEnd}
        onMouseLeave={handleSwipeEnd}
      >
        <div ref={leftDrumRef} className="absolute" style={{ left: '32%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
          <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
          {NOTES.filter(n => n.drumIndex === 0).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
        </div>
        <div ref={rightDrumRef} className="absolute" style={{ left: '68%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
          <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
          {NOTES.filter(n => n.drumIndex === 1).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
        </div>
      </div>

      {showTimer && (
        <div className="absolute top-24 right-4 sm:right-24 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">Zen Meditation</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-3">
            {SHISHIODOSHI_PRESETS.map((preset) => (
              <button key={preset.label}
                onClick={() => {
                  if (preset.minutes > 15 && !isPremium) {
                    triggerPremiumLock(`timer-${preset.minutes}`);
                    return;
                  }
                  setTimerTotal(preset.minutes * 60);
                  setTimerRemaining(preset.minutes * 60);
                  setIsTimerFinished(false);
                  closePopups();
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 hover:bg-black/60 transition-all shadow-xl">
                <span className="text-sm font-serif text-stone-100 flex items-center gap-2">
                  {preset.label}
                  {preset.isPremium && !isPremium && <Lock size={12} className={`text-amber-400${lockShakeTarget === `timer-${preset.minutes}` ? ' lock-shake' : ''}`} />}
                </span>
                <span className="text-2xl opacity-60">{preset.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showThemes && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">背景切替</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-2 mt-4">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => selectTheme(t)} className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-serif transition-all flex items-center justify-between ${currentTheme.id === t.id ? 'bg-sakura-900/50 text-sakura-100' : 'text-stone-100 hover:bg-white/10'}`}>
                <span>{t.name}</span>{t.isPremium && !isPremium && <Lock size={12} className={`text-yellow-400${lockShakeTarget === `theme-${t.id}` ? ' lock-shake' : ''}`} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstruments && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4 shadow-3xl">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">音色選択</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(['Suikin', 'Bamboo', 'Crystal', 'MusicBox', 'Ether', 'Deep'] as SoundType[]).map(type => {
              const premiumInstruments: string[] = ['Crystal', 'Ether', 'Deep'];
              const isLocked = premiumInstruments.includes(type) && !isPremium;
              return (
                <button key={type} onClick={() => { if (!isLocked) { selectInstrument(type); } else { triggerPremiumLock(`instrument-${type}`); } }} className={`flex justify-between items-center px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase transition-all border ${currentSoundType === type ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-400 hover:text-white'}`}>
                  <span className="flex items-center gap-2">
                    {SOUND_LABELS[type]}
                    {isLocked && <Lock size={12} className={`text-amber-400${lockShakeTarget === `instrument-${type}` ? ' lock-shake' : ''}`} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 有料機能ロックトースト */}
      <div
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[250] transition-all duration-300 pointer-events-none"
        style={{
          opacity: premiumToastVisible ? 1 : 0,
          transform: `translateX(-50%) translateY(${premiumToastVisible ? '0px' : '12px'})`,
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
          style={{ background: 'rgba(15,10,20,0.88)', border: '1px solid rgba(236,72,153,0.25)', backdropFilter: 'blur(16px)', pointerEvents: premiumToastVisible ? 'auto' : 'none' }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-white/90 text-[11px] leading-snug tracking-wide">この機能は有料版でご利用いただけます。</span>
            <span className="text-white/60 text-[11px] leading-snug tracking-wide">すべての機能が解放されます。</span>
          </div>
          <button
            onClick={() => { setPremiumToastVisible(false); setShowPremiumModal(true); }}
            className="ml-1 text-sakura-300 text-[11px] tracking-widest whitespace-nowrap hover:text-sakura-100 transition-colors"
            style={{ pointerEvents: 'auto' }}
          >
            詳細
          </button>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-stone-900 border border-sakura-500/30 rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center space-y-6">

            <h3 className="text-2xl font-serif text-white tracking-widest">
              静寂を深める
            </h3>
            <p className="text-stone-400 text-[10px] tracking-[0.3em]">
              One gentle expansion, forever.
            </p>
            <button
              onClick={handlePurchase}
              disabled={!isBillingReady || purchaseStatus === 'processing'}
              className="w-full py-4 bg-gradient-to-r from-sakura-600 to-sakura-500 rounded-xl text-white text-xs uppercase tracking-widest disabled:opacity-40"
            >
              {purchaseStatus === 'processing'
                ? "Processing..."
                : isBillingReady
                  ? "UNLOCK FULL GARDEN"
                  : "Preparing..."}
            </button>

            <button
              onClick={() => setShowPremiumModal(false)}
              className="text-stone-500 text-xs uppercase tracking-widest"
            >
              STAY HERE FOR NOW
            </button>

          </div>
        </div>
      )}


      {purchaseStatus === 'success' && (
        <div
          onClick={() => setPurchaseStatus(null)}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <div className="text-center space-y-4 pointer-events-none">
            <p className="text-white text-xl tracking-[0.3em]">
              The garden quietly deepens.
            </p>
            <p className="text-stone-400 text-sm tracking-[0.4em]">
              庭は、静かに深まりました。
            </p>
          </div>
        </div>
      )}


      {purchaseStatus === 'failed' && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300]
    bg-black/70 px-6 py-3 rounded-2xl text-white text-sm">
          風が、ひとときを乱しました。
        </div>
      )}

      {purchaseStatus === 'canceled' && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300]
    bg-black/70 px-6 py-3 rounded-2xl text-white text-sm">
          庭は、そのままの姿で在ります。
        </div>
      )}


      {timerRemaining !== null && !isTimerFinished && (
        <div className="absolute top-2 sm:top-12 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-2 sm:gap-4 scale-[0.75] sm:scale-110 origin-top transition-transform">
          <div className="relative">
            <div className={`relative w-14 h-40 transition-transform duration-[1500ms] ease-in-out origin-center ${isShishiodoshiTilting ? 'rotate-[110deg]' : 'rotate-0'}`}>
              <div className="absolute inset-0 rounded-full border-r border-white/10 border-b border-black/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden bg-gradient-to-r from-emerald-900/40 via-emerald-700/40 to-emerald-950/40 backdrop-blur-2xl">
                <div className="absolute bottom-0 left-0 w-full bg-sky-400/20 transition-all duration-1000 ease-linear" style={{ height: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}></div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-2 bg-stone-800 rounded-full -z-10"></div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4 gap-4">
            <span className="text-4xl font-serif text-white tracking-[0.3em] bg-emerald-950/30 border border-white/10 px-16 py-5 rounded-full shadow-3xl backdrop-blur-3xl">{Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}</span>
            <button
              onClick={cancelTimer}
              className="flex items-center gap-3 px-10 py-4 bg-black/40 hover:bg-black/60 text-white/60 hover:text-white border border-white/10 rounded-full text-[14px] uppercase tracking-widest transition-all"
            >
              <Ban size={18} /> キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AmbienceToggle: React.FC<{ label: string, type: AmbienceType, icon: React.ReactNode, ambience: any, toggle: (t: AmbienceType) => void, isLocked?: boolean, shakeId?: string, lockShakeTarget?: string | null }> = ({ label, type, icon, ambience, toggle, isLocked, shakeId, lockShakeTarget }) => (
  <button onClick={() => toggle(type)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${ambience[type].active ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-500'}`}>
    <div className="flex items-center gap-3">{icon}<span className="text-[10px] uppercase tracking-widest font-bold">{label}</span></div>
    {isLocked && ambience[type].isPremium && <Lock size={10} className={`text-amber-400${shakeId && lockShakeTarget === shakeId ? ' lock-shake' : ''}`} />}
  </button>
);

const LayerSlider: React.FC<{ label: string, icon: React.ReactNode, value: number, accent: string, onChange: (v: number) => void }> = ({ label, icon, value, accent, onChange }) => (
  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex justify-between text-[10px] text-stone-300 font-bold uppercase tracking-widest">
      <span className="flex items-center gap-2">{icon} {label}</span>
      <span className={`px-2 rounded ${accent.replace('accent', 'bg')}/20 ${accent.replace('accent', 'text')}`}>{Math.round(value * 100)}%</span>
    </div>
    <input type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-black/60 rounded-full appearance-none ${accent}`} />
  </div>
);

const DrumButton: React.FC<{ note: Note, activeNote: string | null, spawnDrop: (id: string) => void }> = ({ note, activeNote, spawnDrop }) => {
  const isActive = activeNote === note.id;
  const petalPath = "M25 50 C 5 35, 0 10, 25 0 C 50 10, 45 35, 25 50";
  const angle = Math.atan2(note.top - 50, note.left - 50) + Math.PI / 2;
  return (
    <div className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${note.left}%`, top: `${note.top}%` }}>
      <div className="w-16 h-16 md:w-20 md:h-20 transition-all duration-1000" style={{ transform: `rotate(${angle}rad)` }}>
        <div className={`w-full h-full ${isActive ? 'animate-bloom' : 'hover:scale-105 transition-transform duration-300'}`}>
          <svg viewBox="0 0 50 50" className="w-full h-full overflow-visible"><path d={petalPath} fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'} stroke={isActive ? '#fbcfe8' : 'rgba(255, 255, 255, 0.45)'} strokeWidth="1.0" /></svg>
        </div>
      </div>
    </div>
  );
};

export default App;
