import { useState, useEffect, type FormEvent } from 'react';

const TELEGRAM_LINK = 'https://t.me/KamranAlievkrasnoyarsk';
const PHONE_DISPLAY = '+7 906 911 88 80';
const PHONE_LINK = 'tel:+79069118880';
const NEWS_SOURCE_URL = 'https://rss.stopgame.ru/rss_news.xml';
const NEWS_PROXY_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(NEWS_SOURCE_URL)}&count=8`;

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  color: string;
  url: string;
  source: string;
};

type RssItem = {
  guid?: string;
  link?: string;
  title?: string;
  description?: string;
  content?: string;
  pubDate?: string;
  categories?: string[];
};

const NEWS_COLORS = [
  'from-orange-500 to-red-600',
  'from-yellow-500 to-orange-600',
  'from-green-500 to-emerald-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

function cleanNewsText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNewsDate(value?: string) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Сейчас';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Mock data for live stats
const liveStats = {
  fps: 320,
  ping: 8,
  temp: 62,
  usage: 42,
};

const fallbackNewsItems: NewsItem[] = [
  {
    id: 'fallback-1',
    title: 'CS2: Крупное обновление префаера',
    excerpt: 'Valve выпустила масштабный патч с улучшением производительности на 25%',
    date: 'Сегодня',
    category: 'CS2',
    color: 'from-orange-500 to-red-600',
    url: 'https://stopgame.ru/news',
    source: 'StopGame',
  },
  {
    id: 'fallback-2',
    title: 'CS2: Новые карты в Competitive',
    excerpt: 'Anubis официально добавлен в соревновательный режим',
    date: 'Вчера',
    category: 'CS2',
    color: 'from-yellow-500 to-orange-600',
    url: 'https://www.cybersport.ru/',
    source: 'Cybersport',
  },
  {
    id: 'fallback-3',
    title: 'PUBG: Обновление 27.1',
    excerpt: 'Новые оружия и улучшения графики в последнем патче',
    date: '2 дня назад',
    category: 'PUBG',
    color: 'from-green-500 to-emerald-600',
    url: 'https://stopgame.ru/news',
    source: 'StopGame',
  },
  {
    id: 'fallback-4',
    title: 'Windows 11: Игровой режим',
    excerpt: 'Microsoft улучшает игровой режим для максимальной производительности',
    date: '3 дня назад',
    category: 'ПК',
    color: 'from-blue-500 to-cyan-600',
    url: 'https://www.ixbt.com/live/blog/games/',
    source: 'iXBT',
  },
];

const testimonials = [
  {
    id: 1,
    name: 'S1mple_Fan_RU',
    game: 'CS2',
    before: '90 FPS',
    after: '320 FPS',
    text: 'Ребята творят чудеса! Раньше лагало даже на низких, теперь играю на ультрах!',
    avatar: '🎯',
  },
  {
    id: 2,
    name: 'CS_Go_Pro',
    game: 'CS2',
    before: '144 FPS нестаб.',
    after: '288 FPS стаб.',
    text: 'Input lag полностью исчез. Раньше 2-3мс, теперь 0.5мс. Разница колоссальная!',
    avatar: '🔥',
  },
  {
    id: 3,
    name: 'PUBG_Winner',
    game: 'PUBG',
    before: '70-100 FPS',
    after: '200 FPS',
    text: 'В замесах больше нет фризов. Стало плавнее в 2 раза. Рекомендую!',
    avatar: '🏆',
  },
];

const faqItems = [
  {
    question: 'Сколько времени занимает оптимизация?',
    answer: 'Полная оптимизация занимает от 1 до 3 часов. Всё зависит от конфигурации вашего ПК и текущего состояния системы.',
  },
  {
    question: 'Нужно ли мне присутствовать во время настройки?',
    answer: 'Да, желательно оставаться на связи. Мы используем TeamViewer или AnyDesk для удалённого подключения.',
  },
  {
    question: 'Что входит в оптимизацию CS2?',
    answer: 'Настройка Windows для игр, оптимизация драйверов видеокарты, настройка конфигурации CS2, отключение фоновых процессов, настройка NVIDIA/AMD панели, оптимизация сети для минимального пинга.',
  },
  {
    question: 'Есть ли гарантия на работу?',
    answer: 'Да, мы даём гарантию 30 дней на все выполненные работы. Если что-то ухудшится — переделаем бесплатно.',
  },
  {
    question: 'Можно ли вернуть настройки обратно?',
    answer: 'Перед началом работы мы создаём точку восстановления системы. При желании можно вернуться к исходному состоянию.',
  },
];

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
}

// Live indicator component
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span className="text-green-400 text-sm font-bold">LIVE</span>
    </div>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentFps, setCurrentFps] = useState(liveStats.fps);
  const [activeTab, setActiveTab] = useState<'news' | 'stats'>('news');
  const [liveNews, setLiveNews] = useState<NewsItem[]>(fallbackNewsItems);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState('загружается');
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Simulate live FPS updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFps(prev => {
        const change = Math.floor(Math.random() * 30) - 15;
        return Math.max(280, Math.min(380, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLiveNews = async () => {
      try {
        if (isMounted) {
          setIsNewsLoading(true);
        }

        const response = await fetch(NEWS_PROXY_URL);

        if (!response.ok) {
          throw new Error('News feed request failed');
        }

        const data = await response.json() as { items?: RssItem[] };
        const items = (data.items ?? [])
          .filter((item) => item.title && item.link)
          .slice(0, 8)
          .map((item, index) => ({
            id: item.guid || item.link || `live-${index}`,
            title: cleanNewsText(item.title).slice(0, 110),
            excerpt: cleanNewsText(item.description || item.content || '').slice(0, 150) || 'Свежая новость игровой индустрии.',
            date: formatNewsDate(item.pubDate),
            category: item.categories?.[0] || 'Игры',
            color: NEWS_COLORS[index % NEWS_COLORS.length],
            url: item.link || 'https://stopgame.ru/news',
            source: 'StopGame',
          }));

        if (isMounted && items.length > 0) {
          setLiveNews(items);
          setNewsError(false);
          setNewsUpdatedAt(new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date()));
        }
      } catch {
        if (isMounted) {
          setLiveNews(fallbackNewsItems);
          setNewsError(true);
          setNewsUpdatedAt('резервная лента');
        }
      } finally {
        if (isMounted) {
          setIsNewsLoading(false);
        }
      }
    };

    loadLiveNews();
    const interval = window.setInterval(loadLiveNews, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewStatus('sending');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = new URLSearchParams();

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        body.append(key, value);
      }
    });

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error('Review form submit failed');
      }

      form.reset();
      setReviewStatus('success');
    } catch {
      setReviewStatus('error');
    }
  };

  const services = [
    { 
      name: 'CS2 MAX FPS', 
      price: '900 ₽', 
      icon: '🎯', 
      color: 'from-orange-500 via-red-500 to-pink-600',
      popular: true,
      features: ['Оптимизация под CS2', 'Настройка конфигурации', 'Устранение фризов', 'Минимальный input lag']
    },
    { 
      name: 'Полная настройка ПК', 
      price: '1500 ₽', 
      icon: '🚀', 
      color: 'from-cyan-400 via-blue-500 to-purple-600',
      popular: false,
      features: ['Все игры + CS2', 'Полная диагностика', 'Настройка Windows', 'Оптимизация драйверов']
    },
    { 
      name: 'PUBG Performance', 
      price: '800 ₽', 
      icon: '🏆', 
      color: 'from-green-500 via-emerald-500 to-teal-600',
      popular: false,
      features: ['Оптимизация PUBG', 'Стабильный FPS', 'Настройка графики', 'Снижение пинга']
    },
    { 
      name: 'Базовая оптимизация', 
      price: '500 ₽', 
      icon: '⚡', 
      color: 'from-yellow-400 via-orange-500 to-red-500',
      popular: false,
      features: ['Базовая настройка', 'Отключение лишнего', 'Настройка драйверов', 'Проверка системы']
    },
    { 
      name: 'Диагностика', 
      price: 'Бесплатно', 
      icon: '🔍', 
      color: 'from-pink-500 via-rose-500 to-red-600',
      popular: false,
      features: ['Полный анализ ПК', 'Рекомендации', 'Отчёт о проблемах', 'План оптимизации']
    },
    { 
      name: 'Абон. обслуживание', 
      price: '2500 ₽/мес', 
      icon: '📞', 
      color: 'from-violet-500 via-purple-500 to-indigo-600',
      popular: false,
      features: ['Поддержка 24/7', 'Регулярная оптимизация', 'Приоритетная очередь', 'Скидка 20%']
    },
  ];

  const optimizationSteps = [
    { step: '01', title: 'Диагностика', desc: 'Полный анализ системы и выявление проблем', icon: '🔍' },
    { step: '02', title: 'Настройка Windows', desc: 'Оптимизация системы для игр', icon: '⚙️' },
    { step: '03', title: 'Драйверы', desc: 'Настройка видеокарты NVIDIA/AMD', icon: '🎮' },
    { step: '04', title: 'Игра', desc: 'Оптимизация конфигурации CS2/PUBG', icon: '🎯' },
    { step: '05', title: 'Тестирование', desc: 'Проверка стабильности FPS', icon: '✅' },
    { step: '06', title: 'Готово!', desc: 'Наслаждайтесь плавной игрой', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-4xl">🎯</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-black"></span>
              </div>
              <div>
                <span className="font-black text-2xl bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                  BOOST PRO
                </span>
                <p className="text-xs text-orange-400 font-bold">CS2 OPTIMIZATION</p>
              </div>
            </div>

            {/* Live Stats Bar */}
            <div className="hidden lg:flex items-center gap-6 px-6 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-black text-2xl">{currentFps}</span>
                <span className="text-orange-300 text-sm font-bold">FPS</span>
              </div>
              <div className="w-px h-6 bg-orange-500/50"></div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-black">{liveStats.ping}</span>
                <span className="text-green-300 text-sm font-bold">ms</span>
              </div>
              <div className="w-px h-6 bg-orange-500/50"></div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-black">{liveStats.temp}°</span>
                <span className="text-cyan-300 text-sm font-bold">CPU</span>
              </div>
              <LiveIndicator />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-white hover:text-orange-400 transition-colors font-bold">ГЛАВНАЯ</a>
              <a href="#news" className="text-slate-300 hover:text-orange-400 transition-colors font-bold">НОВОСТИ</a>
              <a href="#services" className="text-slate-300 hover:text-orange-400 transition-colors font-bold">УСЛУГИ</a>
              <a href="#process" className="text-slate-300 hover:text-orange-400 transition-colors font-bold">ПРОЦЕСС</a>
              <a href="#reviews" className="text-slate-300 hover:text-orange-400 transition-colors font-bold">ОТЗЫВЫ</a>
              <a 
                href="#contact"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-black hover:from-orange-400 hover:to-red-500 transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
              >
                ЗАКАЗАТЬ
              </a>
            </div>

            <button 
              className="md:hidden p-2 text-orange-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-orange-500/30">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" className="block py-3 text-white font-bold border-b border-slate-800">ГЛАВНАЯ</a>
              <a href="#news" className="block py-3 text-slate-300 font-bold border-b border-slate-800">НОВОСТИ</a>
              <a href="#services" className="block py-3 text-slate-300 font-bold border-b border-slate-800">УСЛУГИ</a>
              <a href="#process" className="block py-3 text-slate-300 font-bold border-b border-slate-800">ПРОЦЕСС</a>
              <a href="#reviews" className="block py-3 text-slate-300 font-bold border-b border-slate-800">ОТЗЫВЫ</a>
              <a href="#contact" className="block py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-center font-black">
                ЗАКАЗАТЬ
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-full text-orange-400 text-sm mb-6 animate-pulse">
                <LiveIndicator />
                <span className="font-bold">УДАЛЁННАЯ ОПТИМИЗАЦИЯ ПО ВСЕЙ РОССИИ</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                  CS2 ЛАГАЕТ?
                </span>
                <br />
                <span className="text-white">УБЁРЁМ ВСЕ</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  ФРИЗЫ И ЛАГИ!
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Профессиональная <span className="text-orange-400 font-black">оптимизация ПК под CS2</span>. 
                Увеличим FPS до <span className="text-cyan-400 font-black">300+</span> и уберём все микрофризы!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a 
                  href="#contact"
                  className="group px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl font-black text-xl hover:from-orange-400 hover:to-red-500 transition-all shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    🚀 ЗАКАЗАТЬ ОПТИМИЗАЦИЮ
                    <span className="group-hover:translate-x-2 transition-transform text-2xl">→</span>
                  </span>
                </a>
                <a 
                  href="#services"
                  className="px-10 py-5 bg-slate-800/50 border-2 border-orange-500/50 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all hover:border-orange-400"
                >
                  ВЫБРАТЬ ТАРИФ
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 rounded-2xl">
                  <div className="text-3xl font-black text-orange-400"><AnimatedCounter value={800} />+</div>
                  <div className="text-slate-400 text-sm font-bold">КЛИЕНТОВ</div>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 rounded-2xl">
                  <div className="text-3xl font-black text-cyan-400">99%</div>
                  <div className="text-slate-400 text-sm font-bold">УСПЕХ</div>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-2xl">
                  <div className="text-3xl font-black text-purple-400">10+</div>
                  <div className="text-slate-400 text-sm font-bold">ЛЕТ ОПЫТА</div>
                </div>
              </div>
            </div>

            {/* Hero Visual - CS2 Style */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-900 to-black border-2 border-orange-500/50 rounded-3xl p-8 shadow-2xl shadow-orange-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xl text-orange-400">🎯 CS2 MONITORING</h3>
                    <LiveIndicator />
                  </div>

                  {/* FPS Counter - Big */}
                  <div className="mb-6 p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 rounded-2xl text-center">
                    <div className="text-slate-400 text-sm mb-2 font-bold">СТАБИЛЬНЫЙ FPS</div>
                    <div className="text-7xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                      {currentFps}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-bold">
                        ✓ СТАБИЛЬНО
                      </span>
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-bold">
                        +45% ↑
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 border-2 border-green-500/30 rounded-xl">
                      <div className="text-slate-400 text-xs mb-1 font-bold">PING</div>
                      <div className="text-3xl font-black text-green-400">{liveStats.ping}<span className="text-sm">ms</span></div>
                    </div>
                    <div className="p-4 bg-slate-800/50 border-2 border-cyan-500/30 rounded-xl">
                      <div className="text-slate-400 text-xs mb-1 font-bold">CPU TEMP</div>
                      <div className="text-3xl font-black text-cyan-400">{liveStats.temp}°</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 border-2 border-purple-500/30 rounded-xl">
                      <div className="text-slate-400 text-xs mb-1 font-bold">GPU USAGE</div>
                      <div className="text-3xl font-black text-purple-400">{liveStats.usage}%</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 border-2 border-yellow-500/30 rounded-xl">
                      <div className="text-slate-400 text-xs mb-1 font-bold">RAM</div>
                      <div className="text-3xl font-black text-yellow-400">12<span className="text-sm">GB</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl animate-bounce">
                <span className="text-3xl">🔥</span>
              </div>
              <div className="absolute -bottom-6 -left-6 p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="absolute top-1/2 -right-12 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-xl">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-orange-400 mb-4">ОПТИМИЗИРУЕМ ДЛЯ</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/30">
              <span className="text-4xl mr-3">🎯</span>
              <span className="text-2xl font-black">CS2</span>
            </div>
            <div className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl shadow-lg shadow-yellow-500/30">
              <span className="text-4xl mr-3">🏆</span>
              <span className="text-2xl font-black">PUBG</span>
            </div>
            <div className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30">
              <span className="text-4xl mr-3">⚔️</span>
              <span className="text-2xl font-black">DOTA 2</span>
            </div>
            <div className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30">
              <span className="text-4xl mr-3">💥</span>
              <span className="text-2xl font-black">WARZONE</span>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black mb-2">
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                  НОВОСТИ CS2
                </span>
              </h2>
              <p className="text-slate-400">
                Live-лента игровых новостей · {isNewsLoading ? 'обновляем' : newsError ? newsUpdatedAt : `обновлено ${newsUpdatedAt}`}
              </p>
            </div>
            <div className="hidden sm:flex gap-2">
              <button 
                onClick={() => setActiveTab('news')}
                className={`px-6 py-3 rounded-xl font-black transition-all ${
                  activeTab === 'news' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                НОВОСТИ
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 rounded-xl font-black transition-all ${
                  activeTab === 'stats' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                СТАТИСТИКА
              </button>
            </div>
          </div>

          {activeTab === 'news' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {liveNews.map((news) => (
                <a
                  key={news.id}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2"
                >
                  <div className={`p-4 bg-gradient-to-r ${news.color} border-b border-white/20`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl">📰</span>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-black truncate">
                        {news.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-lg mb-2 group-hover:text-orange-400 transition-colors line-clamp-3">
                      {news.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">{news.excerpt}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 text-xs font-bold">{news.source} · {news.date}</span>
                      <span className="text-orange-400 text-sm font-black group-hover:translate-x-2 transition-transform">
                        ЧИТАТЬ →
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="p-6 bg-slate-900/50 border-2 border-orange-500/30 rounded-2xl">
                <div className="text-slate-400 text-sm font-bold mb-2">СРЕДНИЙ FPS</div>
                <div className="text-4xl font-black text-orange-400">{currentFps}</div>
              </div>
              <div className="p-6 bg-slate-900/50 border-2 border-green-500/30 rounded-2xl">
                <div className="text-slate-400 text-sm font-bold mb-2">PING</div>
                <div className="text-4xl font-black text-green-400">{liveStats.ping} ms</div>
              </div>
              <div className="p-6 bg-slate-900/50 border-2 border-cyan-500/30 rounded-2xl">
                <div className="text-slate-400 text-sm font-bold mb-2">CPU TEMP</div>
                <div className="text-4xl font-black text-cyan-400">{liveStats.temp}°</div>
              </div>
              <div className="p-6 bg-slate-900/50 border-2 border-purple-500/30 rounded-2xl">
                <div className="text-slate-400 text-sm font-bold mb-2">GPU USAGE</div>
                <div className="text-4xl font-black text-purple-400">{liveStats.usage}%</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                ВЫБЕРИ ТАРИФ
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Профессиональная оптимизация под любые задачи!
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className={`group relative bg-slate-900/50 border-2 border-slate-700/50 rounded-3xl p-6 hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-3 ${
                  service.popular ? 'ring-4 ring-orange-500/30 scale-105' : ''
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full font-black text-sm shadow-lg shadow-orange-500/50">
                    🔥 ПОПУЛЯРНЫЙ
                  </div>
                )}
                
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`}></div>
                
                <div className="relative">
                  <div className="text-6xl mb-4">{service.icon}</div>
                  <h3 className="font-black text-2xl mb-3">{service.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                      {service.price}
                    </span>
                  </div>
                  <ul className="space-y-3 text-slate-300 text-sm mb-8">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-400 text-lg">✓</span>
                        <span className="font-bold">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href="#contact"
                    className={`block w-full py-4 rounded-xl font-black text-center transition-all ${
                      service.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-lg shadow-orange-500/50' 
                        : 'bg-slate-800 border-2 border-orange-500/50 hover:bg-slate-700 hover:border-orange-400'
                    }`}
                  >
                    ЗАКАЗАТЬ
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                КАК МЫ РАБОТАЕМ
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Простой процесс за 6 шагов
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {optimizationSteps.map((item, index) => (
              <div 
                key={index}
                className="relative bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/20 group"
              >
                <div className="absolute top-4 right-4 text-6xl font-black text-slate-800 group-hover:text-cyan-500/20 transition-colors">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="font-black text-xl mb-2 text-cyan-400">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                ОТЗЫВЫ КЛИЕНТОВ
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Что говорят наши клиенты после оптимизации
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((review) => (
              <div 
                key={review.id}
                className="bg-slate-900/50 border-2 border-slate-700/50 rounded-3xl p-6 hover:border-green-500/50 transition-all hover:shadow-2xl hover:shadow-green-500/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{review.avatar}</div>
                  <div>
                    <div className="font-black text-lg">{review.name}</div>
                    <div className="text-orange-400 font-bold">{review.game}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-red-500/20 border-2 border-red-500/30 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-bold mb-1">ДО</div>
                    <div className="font-black text-2xl text-red-400">{review.before}</div>
                  </div>
                  <div className="p-4 bg-green-500/20 border-2 border-green-500/30 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-bold mb-1">ПОСЛЕ</div>
                    <div className="font-black text-2xl text-green-400">{review.after}</div>
                  </div>
                </div>
                
                <p className="text-slate-300 italic text-sm">"{review.text}"</p>
                
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-slate-900/60 border-2 border-green-500/30 rounded-3xl p-6 sm:p-8">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
              <div>
                <h3 className="text-3xl font-black mb-4">
                  <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    ОСТАВЬ ОТЗЫВ
                  </span>
                </h3>
                <p className="text-slate-400 font-bold mb-6">
                  Напиши, что изменилось после настройки. Мы проверим отзыв и добавим его на сайт.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <div className="text-3xl font-black text-green-400">5★</div>
                    <div className="text-slate-400 text-sm font-bold">оценка</div>
                  </div>
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
                    <div className="text-3xl font-black text-orange-400">24/7</div>
                    <div className="text-slate-400 text-sm font-bold">приём заявок</div>
                  </div>
                </div>
              </div>

              <form
                name="boost-pro-review"
                method="POST"
                onSubmit={handleReviewSubmit}
                className="grid sm:grid-cols-2 gap-4"
              >
                <input type="hidden" name="form-name" value="boost-pro-review" />
                <p className="hidden">
                  <label>
                    Не заполняйте это поле: <input name="bot-field" />
                  </label>
                </p>
                <input
                  name="name"
                  required
                  placeholder="Ваше имя"
                  className="w-full px-4 py-4 bg-black/40 border-2 border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
                <input
                  name="phone"
                  required
                  placeholder="Телефон"
                  className="w-full px-4 py-4 bg-black/40 border-2 border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
                <select
                  name="game"
                  className="w-full px-4 py-4 bg-black/40 border-2 border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-green-500"
                >
                  <option>CS2</option>
                  <option>PUBG</option>
                  <option>DOTA 2</option>
                  <option>WARZONE</option>
                  <option>Другое</option>
                </select>
                <input
                  name="fps"
                  placeholder="FPS до/после"
                  className="w-full px-4 py-4 bg-black/40 border-2 border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
                <textarea
                  name="text"
                  required
                  minLength={20}
                  placeholder="Ваш отзыв"
                  className="sm:col-span-2 min-h-32 w-full px-4 py-4 bg-black/40 border-2 border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-green-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={reviewStatus === 'sending'}
                  className="sm:col-span-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-black hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-60"
                >
                  {reviewStatus === 'sending' ? 'ОТПРАВЛЯЕМ...' : 'ОТПРАВИТЬ ОТЗЫВ'}
                </button>
                {reviewStatus === 'success' && (
                  <p className="sm:col-span-2 text-green-400 font-bold text-center">
                    Спасибо! Отзыв отправлен.
                  </p>
                )}
                {reviewStatus === 'error' && (
                  <p className="sm:col-span-2 text-red-400 font-bold text-center">
                    Не получилось отправить. Напишите нам в Telegram.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent">
                ПОЧЕМУ МЫ?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚀', title: 'Быстро', desc: 'Оптимизация за 1-3 часа' },
              { icon: '🛡️', title: 'Гарантия', desc: '30 дней на все работы' },
              { icon: '💰', title: 'Честно', desc: 'Без скрытых платежей' },
              { icon: '🌍', title: 'Вся Россия', desc: 'Удалённая работа' },
              { icon: '📄', title: 'Договор', desc: 'Все документы' },
              { icon: '🔍', title: 'Бесплатно', desc: 'Диагностика' },
              { icon: '⚡', title: 'Срочно', desc: 'Выезд сегодня' },
              { icon: '👨‍💻', title: 'Опыт', desc: '10+ лет практики' },
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl text-center hover:border-purple-500/50 transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/20"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-black text-xl mb-2 text-purple-400">{feature.title}</h3>
                <p className="text-slate-400 text-sm font-bold">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                ВОПРОСЫ И ОТВЕТЫ
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-black text-lg">{item.question}</span>
                  <span className={`text-3xl transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-slate-400">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-black border-2 border-orange-500/50 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl shadow-orange-500/30">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-4xl sm:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                    НАЧНИ СЕЙЧАС!
                  </span>
                </h2>
                <p className="text-slate-400 text-lg">
                  Получи <span className="text-green-400 font-black">бесплатную диагностику</span> своей системы
                </p>
              </div>

              <div className="bg-slate-800/50 border-2 border-orange-500/30 rounded-2xl p-6 mb-8">
                <p className="text-center text-slate-300 mb-4 font-black">НАПИШИ НАМ:</p>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl p-5 text-center">
                  <code className="text-orange-400 text-2xl font-mono font-black">
                    «FPS» + игра + характеристики ПК
                  </code>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <a 
                  href={PHONE_LINK}
                  className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500/50 rounded-2xl text-center hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/30 transition-all group"
                >
                  <div className="text-6xl mb-4">📞</div>
                  <p className="text-slate-400 text-sm mb-2 font-bold">ПОЗВОНИТЬ</p>
                  <p className="font-black text-2xl group-hover:text-orange-400 transition-colors">{PHONE_DISPLAY}</p>
                </a>
                <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-2xl text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-slate-400 text-sm mb-2 font-bold">АДРЕС</p>
                  <p className="font-black text-lg">Красноярск, пр-т Мира, 110</p>
                  <p className="text-cyan-400 text-sm mt-2 font-bold">Работаем удалённо по РФ</p>
                </div>
              </div>

              <div className="text-center">
                <a 
                  href={TELEGRAM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-2xl font-black text-2xl hover:from-orange-400 hover:via-red-400 hover:to-pink-500 transition-all shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105"
                >
                  <span className="text-4xl">🚀</span>
                  <span>ВЫЗВАТЬ МАСТЕРА</span>
                </a>
                <p className="text-slate-400 text-sm mt-6 font-bold">
                  ⏰ Работаем ежедневно с 9:00 до 22:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-orange-500/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">🎯</span>
                <div>
                  <span className="font-black text-3xl bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
                    BOOST PRO
                  </span>
                  <p className="text-xs text-orange-400 font-bold">CS2 OPTIMIZATION SERVICE</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Профессиональная оптимизация игровых ПК для стабильного FPS. 
                Увеличим производительность вашего компьютера в 2-3 раза!
              </p>
            </div>
            <div>
              <h4 className="font-black mb-4 text-orange-400">УСЛУГИ</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors font-bold">Оптимизация CS2</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-bold">Оптимизация PUBG</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-bold">Полная настройка ПК</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-bold">Диагностика бесплатно</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-4 text-cyan-400">КОНТАКТЫ</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-2xl">📞</span>
                  <a href={PHONE_LINK} className="hover:text-cyan-400 transition-colors font-bold">{PHONE_DISPLAY}</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  <span className="font-bold">Красноярск, пр-т Мира, 110</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <span className="font-bold">Удалённо по РФ</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t-2 border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm text-center sm:text-left font-bold">
              © 2024 BOOST PRO. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 text-sm font-bold">Поддерживаем:</span>
              <span className="text-3xl">🎯</span>
              <span className="text-3xl">🏆</span>
              <span className="text-3xl">⚔️</span>
              <span className="text-3xl">💥</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
