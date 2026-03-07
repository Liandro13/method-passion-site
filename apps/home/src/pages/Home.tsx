import { useState, useEffect } from 'react';
import Header from '../components/Header';
import AccommodationCard from '../components/AccommodationCard';
import AccommodationModal from '../components/AccommodationModal';
import { translations } from '../lib/i18n';
import { getAccommodations } from '@method-passion/shared';
import type { Language, Accommodation } from '@method-passion/shared';
import { useScrollAnimation, useParallax } from '../hooks/useScrollAnimation';

// Animated counter hook
function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

// Hero text data per language
const heroContent = {
  pt: {
    title: 'Descubra o seu',
    titleHighlight: 'refúgio perfeito',
    subtitle: 'Alojamentos únicos em Portugal, onde a natureza encontra o conforto e cada momento se transforma numa memória inesquecível.',
    cta: 'Explorar Alojamentos',
    scrollHint: 'Descubra mais',
  },
  en: {
    title: 'Discover your',
    titleHighlight: 'perfect retreat',
    subtitle: 'Unique accommodations in Portugal, where nature meets comfort and every moment becomes an unforgettable memory.',
    cta: 'Explore Accommodations',
    scrollHint: 'Discover more',
  },
  fr: {
    title: 'Découvrez votre',
    titleHighlight: 'refuge parfait',
    subtitle: 'Hébergements uniques au Portugal, où la nature rencontre le confort et chaque instant devient un souvenir inoubliable.',
    cta: 'Explorer les hébergements',
    scrollHint: 'Découvrir plus',
  },
  de: {
    title: 'Entdecken Sie Ihr',
    titleHighlight: 'perfektes Refugium',
    subtitle: 'Einzigartige Unterkünfte in Portugal, wo Natur auf Komfort trifft und jeder Moment unvergesslich wird.',
    cta: 'Unterkünfte entdecken',
    scrollHint: 'Mehr entdecken',
  },
  es: {
    title: 'Descubra su',
    titleHighlight: 'refugio perfecto',
    subtitle: 'Alojamientos únicos en Portugal, donde la naturaleza se encuentra con el confort y cada momento se convierte en un recuerdo inolvidable.',
    cta: 'Explorar Alojamientos',
    scrollHint: 'Descubrir más',
  },
};

const whyChooseUsContent = {
  pt: {
    sectionTitle: 'Porquê escolher-nos',
    items: [
      { icon: '🏡', title: 'Alojamentos Únicos', desc: 'Cada propriedade é cuidadosamente selecionada para oferecer uma experiência autêntica e memorável.' },
      { icon: '🌿', title: 'Natureza & Conforto', desc: 'Desfrute do melhor da natureza portuguesa sem abdicar do conforto moderno.' },
      { icon: '💬', title: 'Atendimento Pessoal', desc: 'Comunicação direta e personalizada para garantir que a sua estadia é perfeita.' },
      { icon: '📍', title: 'Localizações Premium', desc: 'Do Douro ao Gerês, os melhores destinos de Portugal ao seu alcance.' },
    ],
  },
  en: {
    sectionTitle: 'Why choose us',
    items: [
      { icon: '🏡', title: 'Unique Accommodations', desc: 'Each property is carefully selected to offer an authentic and memorable experience.' },
      { icon: '🌿', title: 'Nature & Comfort', desc: 'Enjoy the best of Portuguese nature without compromising on modern comfort.' },
      { icon: '💬', title: 'Personal Service', desc: 'Direct and personalized communication to ensure your stay is perfect.' },
      { icon: '📍', title: 'Premium Locations', desc: 'From Douro to Gerês, the best destinations in Portugal at your fingertips.' },
    ],
  },
  fr: {
    sectionTitle: 'Pourquoi nous choisir',
    items: [
      { icon: '🏡', title: 'Hébergements Uniques', desc: 'Chaque propriété est soigneusement sélectionnée pour offrir une expérience authentique.' },
      { icon: '🌿', title: 'Nature & Confort', desc: 'Profitez du meilleur de la nature portugaise sans compromis sur le confort.' },
      { icon: '💬', title: 'Service Personnel', desc: 'Communication directe et personnalisée pour un séjour parfait.' },
      { icon: '📍', title: 'Emplacements Premium', desc: 'Du Douro au Gerês, les meilleures destinations du Portugal.' },
    ],
  },
  de: {
    sectionTitle: 'Warum uns wählen',
    items: [
      { icon: '🏡', title: 'Einzigartige Unterkünfte', desc: 'Jede Unterkunft ist sorgfältig ausgewählt für ein authentisches Erlebnis.' },
      { icon: '🌿', title: 'Natur & Komfort', desc: 'Genießen Sie Portugals Natur ohne Kompromisse beim Komfort.' },
      { icon: '💬', title: 'Persönlicher Service', desc: 'Direkte und individuelle Kommunikation für Ihren perfekten Aufenthalt.' },
      { icon: '📍', title: 'Premium-Standorte', desc: 'Vom Douro bis Gerês – die besten Reiseziele Portugals.' },
    ],
  },
  es: {
    sectionTitle: 'Por qué elegirnos',
    items: [
      { icon: '🏡', title: 'Alojamientos Únicos', desc: 'Cada propiedad está cuidadosamente seleccionada para una experiencia auténtica.' },
      { icon: '🌿', title: 'Naturaleza & Confort', desc: 'Disfrute de la naturaleza portuguesa sin renunciar al confort moderno.' },
      { icon: '💬', title: 'Atención Personal', desc: 'Comunicación directa y personalizada para una estancia perfecta.' },
      { icon: '📍', title: 'Ubicaciones Premium', desc: 'Del Douro al Gerês, los mejores destinos de Portugal.' },
    ],
  },
};

const ctaContent = {
  pt: { title: 'Pronto para a sua próxima escapadinha?', subtitle: 'Reserve agora e viva momentos inesquecíveis em Portugal.', cta: 'Reservar Agora' },
  en: { title: 'Ready for your next getaway?', subtitle: 'Book now and live unforgettable moments in Portugal.', cta: 'Book Now' },
  fr: { title: 'Prêt pour votre prochaine escapade ?', subtitle: 'Réservez maintenant et vivez des moments inoubliables au Portugal.', cta: 'Réserver' },
  de: { title: 'Bereit für Ihren nächsten Kurzurlaub?', subtitle: 'Buchen Sie jetzt und erleben Sie unvergessliche Momente in Portugal.', cta: 'Jetzt Buchen' },
  es: { title: '¿Listo para tu próxima escapada?', subtitle: 'Reserve ahora y viva momentos inolvidables en Portugal.', cta: 'Reservar Ahora' },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];
  const hero = heroContent[language];
  const whyUs = whyChooseUsContent[language];
  const cta = ctaContent[language];

  const parallaxOffset = useParallax(0.3);

  // Scroll animation refs
  const accommodationsSection = useScrollAnimation({ threshold: 0.1 });
  const whyUsSection = useScrollAnimation({ threshold: 0.15 });
  const statsSection = useScrollAnimation({ threshold: 0.2 });
  const ctaSection = useScrollAnimation({ threshold: 0.2 });

  // Animated counters for stats
  const countGuests = useCountUp(500, 2000, statsSection.isVisible);
  const countProperties = useCountUp(3, 1500, statsSection.isVisible);
  const countStars = useCountUp(5, 1200, statsSection.isVisible);

  useEffect(() => {
    async function loadAccommodations() {
      try {
        const result = await getAccommodations();
        if (result.accommodations) setAccommodations(result.accommodations);
      } catch (error) {
        console.error('Error loading accommodations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAccommodations();
  }, []);

  const getDescription = (acc: Accommodation) => {
    const key = `description_${language}` as keyof Accommodation;
    return (acc[key] as string) || acc.description_pt || acc.description_en || '';
  };

  const getPrimaryImage = (acc: Accommodation) => {
    if (!acc.images || acc.images.length === 0) return acc.image_url || '/images/logo.jpeg';
    const primary = acc.images.find(img => img.is_primary);
    return primary?.image_url || acc.images[0]?.image_url || acc.image_url || '/images/logo.jpeg';
  };

  const getFeatures = (acc: Accommodation) => t.accommodations[acc.name as keyof typeof t.accommodations]?.features || [];

  const scrollToAccommodations = () => {
    document.getElementById('accommodations')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="flex-1">
        {/* ========== HERO SECTION ========== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div 
            className="absolute inset-0 animate-gradient"
            style={{
              background: 'linear-gradient(135deg, #1a1311 0%, #2c2420 25%, #1a1311 50%, #3d2e26 75%, #1a1311 100%)',
              backgroundSize: '400% 400%',
              transform: `translateY(${parallaxOffset * 0.5}px)`,
            }}
          />

          {/* Decorative floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gold circles */}
            <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-primary/5 animate-float blur-xl" />
            <div className="absolute top-[60%] right-[5%] w-96 h-96 rounded-full bg-primary/3 animate-float-delay-1 blur-2xl" />
            <div className="absolute bottom-[10%] left-[30%] w-48 h-48 rounded-full bg-primary/8 animate-float-delay-2 blur-lg" />
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(rgba(201,169,97,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />

            {/* Diagonal decorative lines */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.05]"
              style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 40px, var(--color-primary) 40px, var(--color-primary) 41px)',
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            {/* Small decorative label */}
            <div className="animate-fade-in-down mb-6" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white/80 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Method & Passion — Gestão de Alojamentos Locais
              </span>
            </div>

            {/* Main title with serif font */}
            <h1 
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up"
              style={{ fontFamily: 'var(--font-family-serif)', animationDelay: '0.5s', animationFillMode: 'both' }}
            >
              {hero.title}{' '}
              <span className="text-shimmer block sm:inline">{hero.titleHighlight}</span>
            </h1>

            {/* Decorative line */}
            <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
              <div className="decorative-line w-20" />
            </div>

            {/* Subtitle */}
            <p 
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.9s', animationFillMode: 'both' }}
            >
              {hero.subtitle}
            </p>

            {/* CTA Button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '1.1s', animationFillMode: 'both' }}>
              <button 
                onClick={scrollToAccommodations}
                className="btn-primary text-lg px-10 py-4 rounded-full animate-pulse-glow inline-flex items-center gap-3 group"
              >
                {hero.cta}
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 animate-bounce-gentle flex flex-col items-center gap-2">
            <span className="text-white/50 text-xs uppercase tracking-widest">{hero.scrollHint}</span>
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </section>

        {/* ========== STATS BAR ========== */}
        <section ref={statsSection.ref} className="relative -mt-1 bg-dark border-t border-primary/20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className={`grid grid-cols-3 gap-8 text-center scroll-animate ${statsSection.isVisible ? 'visible' : ''}`}>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'var(--font-family-serif)' }}>
                  {countGuests}+
                </div>
                <div className="text-white/60 text-sm">
                  {language === 'pt' ? 'Hóspedes felizes' : language === 'fr' ? 'Hôtes heureux' : language === 'de' ? 'Zufriedene Gäste' : language === 'es' ? 'Huéspedes felices' : 'Happy guests'}
                </div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'var(--font-family-serif)' }}>
                  {countProperties}
                </div>
                <div className="text-white/60 text-sm">
                  {language === 'pt' ? 'Alojamentos únicos' : language === 'fr' ? 'Hébergements uniques' : language === 'de' ? 'Einzigartige Unterkünfte' : language === 'es' ? 'Alojamientos únicos' : 'Unique properties'}
                </div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1 flex items-center justify-center gap-1" style={{ fontFamily: 'var(--font-family-serif)' }}>
                  {countStars}<span className="text-xl">★</span>
                </div>
                <div className="text-white/60 text-sm">
                  {language === 'pt' ? 'Avaliação média' : language === 'fr' ? 'Note moyenne' : language === 'de' ? 'Durchschnittliche Bewertung' : language === 'es' ? 'Valoración media' : 'Average rating'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== ACCOMMODATIONS GRID ========== */}
        <section id="accommodations" className="py-20 md:py-28">
          <div ref={accommodationsSection.ref} className="max-w-6xl mx-auto px-4">
            {/* Section header */}
            <div className={`text-center mb-14 scroll-animate ${accommodationsSection.isVisible ? 'visible' : ''}`}>
              <span className="text-primary font-medium text-sm uppercase tracking-widest mb-3 block">
                {language === 'pt' ? 'Os nossos espaços' : language === 'fr' ? 'Nos espaces' : language === 'de' ? 'Unsere Räume' : language === 'es' ? 'Nuestros espacios' : 'Our spaces'}
              </span>
              <h2 
                className="text-3xl md:text-4xl font-bold text-dark mb-4"
                style={{ fontFamily: 'var(--font-family-serif)' }}
              >
                {t.selectAccommodation}
              </h2>
              <div className="flex justify-center">
                <div className="decorative-line w-16" />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children ${accommodationsSection.isVisible ? 'visible' : ''}`}>
                {accommodations.map((acc, idx) => (
                  <AccommodationCard
                    key={acc.id}
                    accommodation={acc}
                    language={language}
                    primaryImage={getPrimaryImage(acc)}
                    description={getDescription(acc)}
                    features={getFeatures(acc)}
                    onClick={() => setSelectedAccommodation(acc)}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========== WHY CHOOSE US ========== */}
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div ref={whyUsSection.ref} className="max-w-6xl mx-auto px-4 relative z-10">
            <div className={`text-center mb-14 scroll-animate ${whyUsSection.isVisible ? 'visible' : ''}`}>
              <span className="text-primary font-medium text-sm uppercase tracking-widest mb-3 block">
                Method & Passion
              </span>
              <h2 
                className="text-3xl md:text-4xl font-bold text-dark mb-4"
                style={{ fontFamily: 'var(--font-family-serif)' }}
              >
                {whyUs.sectionTitle}
              </h2>
              <div className="flex justify-center">
                <div className="decorative-line w-16" />
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children ${whyUsSection.isVisible ? 'visible' : ''}`}>
              {whyUs.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group text-center p-6 rounded-2xl bg-background/50 hover:bg-background 
                             transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-default"
                >
                  <div className="text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-dark text-lg mb-2" style={{ fontFamily: 'var(--font-family-serif)' }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CTA SECTION ========== */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 animate-gradient" style={{
            background: 'linear-gradient(135deg, #1a1311 0%, #2c2420 30%, #1a1311 60%, #3d2e26 100%)',
            backgroundSize: '400% 400%',
          }} />

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-primary/5 animate-float blur-2xl" />
            <div className="absolute bottom-[20%] left-[15%] w-56 h-56 rounded-full bg-primary/3 animate-float-delay-1 blur-xl" />
          </div>

          <div ref={ctaSection.ref} className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <div className={`scroll-animate-scale ${ctaSection.isVisible ? 'visible' : ''}`}>
              <h2 
                className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
                style={{ fontFamily: 'var(--font-family-serif)' }}
              >
                {cta.title}
              </h2>
              <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">{cta.subtitle}</p>
              <button 
                onClick={scrollToAccommodations}
                className="btn-primary text-lg px-10 py-4 rounded-full inline-flex items-center gap-3 group animate-pulse-glow"
              >
                {cta.cta}
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========== MODAL ========== */}
      {selectedAccommodation && (
        <AccommodationModal
          accommodation={selectedAccommodation}
          language={language}
          description={getDescription(selectedAccommodation)}
          features={getFeatures(selectedAccommodation)}
          onClose={() => setSelectedAccommodation(null)}
        />
      )}

      {/* ========== FOOTER ========== */}
      <footer className="bg-dark text-white relative overflow-hidden">
        {/* Decorative top border */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30" />
                <span className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-family-serif)' }}>
                  Method & Passion
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {language === 'pt' 
                  ? 'Gestão de Alojamentos Locais de excelência em Portugal. Onde o método encontra a paixão.' 
                  : 'Excellent local accommodation in Portugal. Where method meets passion.'}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                {language === 'pt' ? 'Alojamentos' : 'Accommodations'}
              </h4>
              <ul className="space-y-2">
                {accommodations.map(acc => (
                  <li key={acc.id}>
                    <button 
                      onClick={() => setSelectedAccommodation(acc)}
                      className="text-white/50 hover:text-primary text-sm transition-colors duration-300"
                    >
                      {acc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                {language === 'pt' ? 'Contacto' : 'Contact'}
              </h4>
              <div className="space-y-2 text-white/50 text-sm">
                <p>📍 Portugal</p>
                <p>📱 WhatsApp</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">© 2026 Method & Passion. All rights reserved.</p>
            <div className="flex items-center gap-1 text-sm text-white/40">
              <span>{language === 'pt' ? 'Feito com' : 'Made with'}</span>
              <span className="text-red-400 animate-pulse">♥</span>
              <span>{language === 'pt' ? 'em Portugal' : 'in Portugal'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
