import { useEffect, useState } from 'react';

function Landing({ onEntrar }) {
  useEffect(() => {
    document.title = 'Forjanova Servicios Ya — Encuentra tu técnico hoy';
  }, []);

  const WHATSAPP_NUM = '51929336337';
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('Hola, quiero más información sobre Forjanova Servicios Ya')}`;

  const categorias = [
    { nombre: 'Hornos artesanales', desc: 'Instalación, reparación y mantenimiento de hornos de barro, ladrillo y metal.' },
    { nombre: 'Parrillas y cocinas', desc: 'Fabricación, arreglo y mantenimiento de parrillas y cocinas a leña o gas.' },
    { nombre: 'Soldadura', desc: 'Trabajos de soldadura estructural, reparaciones y fabricación a medida.' },
    { nombre: 'Mantenimiento industrial', desc: 'Revisión y mantenimiento preventivo de equipos y estructuras metálicas.' },
    { nombre: 'Estructuras metálicas', desc: 'Diseño y montaje de estructuras, rejas, barandas y trabajos en fierro.' },
    { nombre: 'Forja', desc: 'Trabajo artesanal en metal caliente: piezas, herramientas y detalles a medida.' },
  ];

  const faqs = [
    { q: '¿Cuánto cuesta usar Forjanova Servicios Ya?', a: 'Publicar solicitudes y cotizar es gratis. La idea es que puedas usarla sin barreras desde el día uno.' },
    { q: '¿Cómo sé que un técnico es confiable?', a: 'Cada técnico tiene su rating, número de trabajos completados y reseñas de clientes anteriores, visibles antes de que aceptes su cotización.' },
    { q: '¿Qué pasa si no quedo conforme con el trabajo?', a: 'Toda la comunicación queda en el chat de la app, así que hay registro claro de lo acordado. Tu calificación al final también ayuda a que otros clientes sepan qué esperar.' },
    { q: '¿En qué ciudades funciona?', a: 'Empezamos en Perú, con enfoque inicial en Ica y alrededores, pero cualquier técnico o cliente del país puede publicar y cotizar.' },
    { q: '¿Puedo ofrecer más de un tipo de servicio?', a: 'Sí. Tu perfil de técnico puede mostrar tu especialidad y portafolio de trabajos, y puedes cotizar en cualquier solicitud abierta que se ajuste a lo que haces.' },
    { q: '¿Puedo contactar a Forjanova directamente por dudas?', a: 'Sí, puedes escribirnos por WhatsApp al +51 929 336 337 y te ayudamos con cualquier consulta sobre la app.' },
  ];

  const [faqAbierto, setFaqAbierto] = useState(null);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .fn-heat-bar { height: 3px; background: linear-gradient(90deg, #0E0B0A 0%, #C7361B 35%, #FF5A1F 70%, #FFD9B0 100%); border-radius: 2px; }
        .fn-hero-title { font-family: 'Oswald', sans-serif; }
        .fn-glow { animation: fnPulse 3.5s ease-in-out infinite; }
        @keyframes fnPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .fn-glow { animation: none; } }
        .fn-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,90,31,0.45); }
        .fn-whatsapp:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,211,102,0.4); }
        .fn-card:hover { border-color: #FF5A1F; }
        .fn-faq-q:hover { color: #FF5A1F; }
        @media (max-width: 760px) {
          .fn-hero-grid { grid-template-columns: 1fr !important; }
          .fn-hero-title { font-size: 38px !important; }
          .fn-cards-grid { grid-template-columns: 1fr !important; }
          .fn-about-grid { grid-template-columns: 1fr !important; }
          .fn-pain-grid { grid-template-columns: 1fr !important; }
          .fn-trust-grid { grid-template-columns: 1fr !important; }
          .fn-cat-grid { grid-template-columns: 1fr !important; }
          .fn-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .fn-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navBrandOrange}>FORJANOVA</span>
          <span style={s.navBrandWhite}> SERVICIOS YA</span>
        </div>
        <button style={s.navCta} className="fn-cta" onClick={onEntrar}>Entrar a la app</button>
      </nav>

      <div className="fn-heat-bar" />

      <section style={s.hero} className="fn-hero-grid">
        <div>
          <span style={s.eyebrow}>MARKETPLACE DE SERVICIOS TÉCNICOS · PERÚ</span>
          <h1 style={s.heroTitle} className="fn-hero-title">
            Tu proyecto necesita un técnico.
            <br />
            <span style={s.heroTitleOrange}>Lo encuentras hoy.</span>
          </h1>
          <p style={s.heroSub}>
            Conectamos clientes con técnicos especializados en hornos, parrillas,
            soldadura y mantenimiento industrial. Publicas lo que necesitas,
            recibes cotizaciones, eliges y coordinas todo desde el chat.
          </p>
          <div style={s.heroBtns}>
            <button style={s.ctaPrimary} className="fn-cta" onClick={onEntrar}>Entrar a la app →</button>
          </div>
          <p style={s.heroTagline}>"El fuego no pide permiso. Nosotros tampoco."</p>
        </div>
        <div style={s.heroVisual}>
          <div style={s.heroVisualGlow} className="fn-glow" />
          <div style={s.heroVisualCard}>
            <span style={s.heroVisualIcon}>🔥</span>
            <p style={s.heroVisualLabel}>SOLICITUD ABIERTA</p>
            <p style={s.heroVisualTitle}>Reparación de horno artesanal</p>
            <div style={s.heroVisualRow}>
              <span style={s.heroVisualTag}>3 cotizaciones</span>
              <span style={s.heroVisualTag}>Ica</span>
            </div>
          </div>
        </div>
      </section>

      <section style={s.sectionAlt}>
        <span style={s.eyebrow}>NUESTRA HISTORIA</span>
        <h2 style={{ ...s.sectionTitle, marginTop: '12px' }} className="fn-hero-title">Por qué existe Forjanova</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 32px 0' }} />
        <p style={s.aboutText}>
          Forjanova nació del taller, no de una oficina. Después de años trabajando
          de cerca con hornos, parrillas y estructuras metálicas, vimos el mismo
          problema una y otra vez: conseguir un técnico de confianza para un trabajo
          especializado significa preguntar a conocidos, esperar respuestas que nunca
          llegan, o arriesgarte con alguien que no conoces. Del otro lado, técnicos
          buenos que no tienen dónde mostrar su trabajo ni cómo llegar a más clientes.
        </p>
        <p style={s.aboutText}>
          Construimos Forjanova Servicios Ya para cerrar esa brecha: un lugar donde
          publicar lo que necesitas toma dos minutos, comparar cotizaciones es
          transparente, y elegir a quién contratar depende de su trabajo real —
          no de a quién conoces.
        </p>
        <div style={s.aboutGrid} className="fn-about-grid">
          <div style={s.aboutCard} className="fn-card">
            <span style={s.cardEyebrow}>MISIÓN</span>
            <p style={s.aboutCardText}>Facilitar que cualquier persona encuentre un técnico calificado para trabajos de forja, hornos, soldadura y mantenimiento — sin vueltas, sin intermediarios informales.</p>
          </div>
          <div style={s.aboutCard} className="fn-card">
            <span style={s.cardEyebrow}>VISIÓN</span>
            <p style={s.aboutCardText}>Ser la plataforma de referencia en Perú para conectar oficios técnicos especializados con quienes los necesitan, empezando por el rubro térmico y metalmecánico.</p>
          </div>
          <div style={s.aboutCard} className="fn-card">
            <span style={s.cardEyebrow}>A QUIÉN AYUDAMOS</span>
            <p style={s.aboutCardText}>A clientes que necesitan un trabajo bien hecho, y a técnicos que buscan más oportunidades y una reputación que los respalde.</p>
          </div>
        </div>
      </section>

      <section style={s.section}>
        <span style={s.eyebrow}>LO QUE VENÍAMOS VIENDO</span>
        <h2 style={{ ...s.sectionTitle, marginTop: '12px' }} className="fn-hero-title">Problemas que ya no tienes que repetir</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 40px 0' }} />
        <div style={s.painGrid} className="fn-pain-grid">
          <div>
            <span style={s.cardEyebrow}>SI ERES CLIENTE</span>
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "Le escribí a un contacto de un contacto y nunca me respondió."</p>
                <p style={s.painAfter}>✓ Publicas tu solicitud y en horas ya tienes cotizaciones reales.</p>
              </div>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "Vino un técnico que no sabía del tema y me arruinó el trabajo."</p>
                <p style={s.painAfter}>✓ Ves su rating y trabajos anteriores antes de elegir.</p>
              </div>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "No supe cuánto me iba a costar hasta que ya era tarde para decir que no."</p>
                <p style={s.painAfter}>✓ Comparas precio y plazo de varios técnicos antes de aceptar.</p>
              </div>
            </div>
          </div>
          <div>
            <span style={s.cardEyebrow}>SI ERES TÉCNICO</span>
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "Hacía buen trabajo pero fuera de mi barrio nadie me conocía."</p>
                <p style={s.painAfter}>✓ Apareces frente a clientes de toda tu zona, no solo tus contactos.</p>
              </div>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "Cotizaba por WhatsApp y todo se perdía entre chats viejos."</p>
                <p style={s.painAfter}>✓ Tus solicitudes y cotizaciones quedan organizadas en un solo lugar.</p>
              </div>
              <div style={s.painCard} className="fn-card">
                <p style={s.painBefore}>✕ "No tenía cómo demostrar que era bueno en lo mío."</p>
                <p style={s.painAfter}>✓ Tu rating y trabajos completados hablan por ti desde el primer mensaje.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={s.sectionAlt}>
        <span style={s.eyebrow}>CÓMO CUIDAMOS LA CONFIANZA</span>
        <h2 style={{ ...s.sectionTitle, marginTop: '12px' }} className="fn-hero-title">No dejamos la confianza al azar</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 40px 0' }} />
        <div style={s.trustGrid} className="fn-trust-grid">
          <div style={s.trustCard} className="fn-card">
            <span style={s.trustIcon}>⭐</span>
            <p style={s.trustTitle}>Reputación real</p>
            <p style={s.trustText}>Cada trabajo completado suma al rating del técnico. Nada de perfiles vacíos.</p>
          </div>
          <div style={s.trustCard} className="fn-card">
            <span style={s.trustIcon}>💬</span>
            <p style={s.trustTitle}>Todo queda por escrito</p>
            <p style={s.trustText}>Chat directo dentro de la app: precio, plazo y detalles acordados, con registro.</p>
          </div>
          <div style={s.trustCard} className="fn-card">
            <span style={s.trustIcon}>📸</span>
            <p style={s.trustTitle}>Portafolio verificable</p>
            <p style={s.trustText}>Los técnicos muestran fotos de trabajos anteriores en su perfil, no solo promesas.</p>
          </div>
          <div style={s.trustCard} className="fn-card">
            <span style={s.trustIcon}>🛡️</span>
            <p style={s.trustTitle}>Sin favoritismos</p>
            <p style={s.trustText}>Las solicitudes están abiertas a todos los técnicos calificados, no a un círculo cerrado.</p>
          </div>
        </div>
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle} className="fn-hero-title">Cómo funciona</h2>
        <div className="fn-heat-bar" style={{ width: '60px', marginBottom: '40px' }} />
        <div style={s.cardsGrid} className="fn-cards-grid">
          <div style={s.card} className="fn-card">
            <span style={s.cardEyebrow}>PARA CLIENTES</span>
            <ol style={s.stepsList}>
              <li style={s.step}><b>Publica</b> tu solicitud con lo que necesitas</li>
              <li style={s.step}><b>Recibe</b> cotizaciones de técnicos disponibles</li>
              <li style={s.step}><b>Elige, chatea y coordina</b> el trabajo</li>
              <li style={s.step}><b>Califica</b> al técnico al terminar</li>
            </ol>
          </div>
          <div style={s.card} className="fn-card">
            <span style={s.cardEyebrow}>PARA TÉCNICOS</span>
            <ol style={s.stepsList}>
              <li style={s.step}><b>Revisa</b> solicitudes abiertas cerca de ti</li>
              <li style={s.step}><b>Cotiza</b> el trabajo con precio y plazo</li>
              <li style={s.step}><b>Cierra el trato</b> por chat directo</li>
              <li style={s.step}><b>Suma rating</b> y crece tu reputación</li>
            </ol>
          </div>
        </div>
      </section>

      <section style={s.sectionAlt}>
        <h2 style={s.sectionTitle} className="fn-hero-title">Categorías</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 32px 0' }} />
        <div style={s.catGrid} className="fn-cat-grid">
          {categorias.map((c) => (
            <div key={c.nombre} style={s.catCard} className="fn-card">
              <p style={s.catNombre}>{c.nombre}</p>
              <p style={s.catDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle} className="fn-hero-title">Preguntas frecuentes</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 32px 0' }} />
        <div style={s.faqList}>
          {faqs.map((item, i) => (
            <div key={i} style={s.faqItem}>
              <div style={s.faqQ} className="fn-faq-q" onClick={() => setFaqAbierto(faqAbierto === i ? null : i)}>
                <span>{item.q}</span>
                <span style={s.faqToggle}>{faqAbierto === i ? '−' : '+'}</span>
              </div>
              {faqAbierto === i && <p style={s.faqA}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={s.sectionAlt}>
        <span style={s.eyebrow}>HABLEMOS</span>
        <h2 style={{ ...s.sectionTitle, marginTop: '12px' }} className="fn-hero-title">¿Tienes dudas antes de empezar?</h2>
        <div className="fn-heat-bar" style={{ width: '60px', margin: '20px 0 32px 0' }} />
        <div style={s.contactGrid} className="fn-contact-grid">
          <p style={s.contactText}>Escríbenos directo y te ayudamos a publicar tu primera solicitud o a armar tu perfil de técnico.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={s.whatsappBtn} className="fn-whatsapp">
            💬 Escribir por WhatsApp — +51 929 336 337
          </a>
        </div>
      </section>

      <section style={s.finalCta}>
        <h2 style={s.finalCtaTitle} className="fn-hero-title">Deja de buscar. Empieza a coordinar.</h2>
        <button style={s.ctaPrimary} className="fn-cta" onClick={onEntrar}>Entrar a la app →</button>
      </section>

      <footer style={s.footerFull}>
        <div style={s.footerGrid} className="fn-footer-grid">
          <div>
            <div style={s.navBrand}>
              <span style={s.navBrandOrange}>FORJANOVA</span>
              <span style={s.navBrandWhite}> SERVICIOS YA</span>
            </div>
            <p style={s.footerTagline}>"El fuego no pide permiso. Nosotros tampoco."</p>
          </div>
          <div>
            <p style={s.footerColTitle}>Categorías</p>
            <p style={s.footerText}>Hornos artesanales</p>
            <p style={s.footerText}>Parrillas y cocinas</p>
            <p style={s.footerText}>Soldadura</p>
            <p style={s.footerText}>Forja</p>
          </div>
          <div>
            <p style={s.footerColTitle}>Contacto</p>
            <p style={s.footerText}>Santa Cruz, Ica — Perú</p>
            <p style={s.footerText}>+51 929 336 337</p>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={s.footerLink}>WhatsApp directo</a>
            <a href="https://www.tiktok.com/@hornosyfogatas" target="_blank" rel="noopener noreferrer" style={s.footerLink}>TikTok @hornosyfogatas</a>
          </div>
        </div>
        <div className="fn-heat-bar" style={{ margin: '32px 0 20px 0' }} />
        <span style={s.footerCopy}>© {new Date().getFullYear()} Forjanova Servicios Ya. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}

const ORANGE = '#FF5A1F';
const EMBER = '#C7361B';
const CARBON = '#0E0B0A';
const ASH = '#1C1815';
const OFFWHITE = '#F5F1EA';
const STEEL = '#8A8580';

const s = {
  page: { background: CARBON, color: OFFWHITE, fontFamily: "'Inter', sans-serif", minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px' },
  navBrand: { fontFamily: "'Oswald', sans-serif", fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px' },
  navBrandOrange: { color: ORANGE },
  navBrandWhite: { color: OFFWHITE },
  navCta: { background: 'transparent', border: `1px solid ${ORANGE}`, color: ORANGE, padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s ease' },
  hero: { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center', padding: '64px 32px', maxWidth: '1200px', margin: '0 auto' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: ORANGE, letterSpacing: '1.5px', fontWeight: 500 },
  heroTitle: { fontSize: '52px', lineHeight: 1.1, fontWeight: 600, margin: '16px 0 20px 0', color: OFFWHITE },
  heroTitleOrange: { color: ORANGE },
  heroSub: { fontSize: '16px', color: STEEL, lineHeight: 1.6, maxWidth: '460px', margin: '0 0 28px 0' },
  heroBtns: { display: 'flex', gap: '14px', marginBottom: '20px' },
  ctaPrimary: { background: ORANGE, color: CARBON, border: 'none', padding: '15px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s ease' },
  heroTagline: { fontSize: '13px', color: STEEL, fontStyle: 'italic', margin: 0 },
  heroVisual: { position: 'relative', display: 'flex', justifyContent: 'center' },
  heroVisualGlow: { position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', background: `radial-gradient(circle, ${ORANGE}33 0%, transparent 70%)` },
  heroVisualCard: { position: 'relative', background: ASH, border: `1px solid #2a231f`, borderRadius: '16px', padding: '28px', width: '260px' },
  heroVisualIcon: { fontSize: '28px' },
  heroVisualLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: ORANGE, letterSpacing: '1px', margin: '12px 0 6px 0' },
  heroVisualTitle: { fontSize: '15px', fontWeight: 600, color: OFFWHITE, margin: '0 0 16px 0' },
  heroVisualRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  heroVisualTag: { fontSize: '11px', color: STEEL, background: '#141110', padding: '4px 10px', borderRadius: '6px', border: '1px solid #2a231f' },
  section: { padding: '64px 32px', maxWidth: '1200px', margin: '0 auto' },
  sectionAlt: { padding: '64px 32px', maxWidth: '1200px', margin: '0 auto', background: '#0a0807' },
  sectionTitle: { fontSize: '32px', fontWeight: 600, color: OFFWHITE, margin: 0 },
  aboutText: { fontSize: '15px', color: STEEL, lineHeight: 1.8, maxWidth: '760px', margin: '0 0 18px 0' },
  aboutGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '36px' },
  aboutCard: { background: ASH, border: '1px solid #2a231f', borderRadius: '14px', padding: '24px', transition: 'border-color 0.2s ease' },
  aboutCardText: { fontSize: '13px', color: STEEL, lineHeight: 1.7, margin: '12px 0 0 0' },
  painGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  painCard: { background: ASH, border: '1px solid #2a231f', borderRadius: '14px', padding: '20px', transition: 'border-color 0.2s ease' },
  painBefore: { fontSize: '13.5px', color: STEEL, lineHeight: 1.6, margin: '0 0 10px 0', fontStyle: 'italic' },
  painAfter: { fontSize: '13.5px', color: OFFWHITE, lineHeight: 1.6, margin: 0, fontWeight: 500 },
  trustGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' },
  trustCard: { background: ASH, border: '1px solid #2a231f', borderRadius: '14px', padding: '24px', transition: 'border-color 0.2s ease' },
  trustIcon: { fontSize: '24px' },
  trustTitle: { fontSize: '14px', fontWeight: 600, color: OFFWHITE, margin: '12px 0 8px 0' },
  trustText: { fontSize: '12.5px', color: STEEL, lineHeight: 1.6, margin: 0 },
  cardsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { background: ASH, border: '1px solid #2a231f', borderRadius: '16px', padding: '32px', transition: 'border-color 0.2s ease' },
  cardEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: ORANGE, letterSpacing: '1.5px', fontWeight: 500 },
  stepsList: { margin: '20px 0 0 0', padding: '0 0 0 18px', color: STEEL, fontSize: '14px', lineHeight: 2 },
  step: { color: OFFWHITE },
  catGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  catCard: { background: ASH, border: '1px solid #2a231f', borderRadius: '14px', padding: '22px', transition: 'border-color 0.2s ease' },
  catNombre: { fontSize: '15px', fontWeight: 600, color: ORANGE, margin: '0 0 8px 0' },
  catDesc: { fontSize: '12.5px', color: STEEL, lineHeight: 1.6, margin: 0 },
  faqList: { maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '2px' },
  faqItem: { borderBottom: '1px solid #2a231f' },
  faqQ: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 4px', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, color: OFFWHITE, transition: 'color 0.2s ease' },
  faqToggle: { color: ORANGE, fontSize: '18px', fontWeight: 400 },
  faqA: { fontSize: '13.5px', color: STEEL, lineHeight: 1.7, padding: '0 4px 18px 4px', margin: 0 },
  contactGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'center' },
  contactText: { fontSize: '15px', color: STEEL, lineHeight: 1.7, margin: 0 },
  whatsappBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: '#0E0B0A', textDecoration: 'none', padding: '16px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s ease' },
  finalCta: { textAlign: 'center', padding: '80px 32px' },
  finalCtaTitle: { fontSize: '30px', color: OFFWHITE, margin: '0 0 28px 0' },
  footerFull: { padding: '56px 32px 32px 32px', maxWidth: '1200px', margin: '0 auto' },
  footerGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '40px' },
  footerTagline: { fontSize: '13px', color: STEEL, fontStyle: 'italic', margin: '14px 0 0 0' },
  footerColTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: ORANGE, letterSpacing: '1.5px', fontWeight: 500, margin: '0 0 14px 0' },
  footerText: { fontSize: '13px', color: STEEL, margin: '0 0 8px 0' },
  footerLink: { fontSize: '13px', color: OFFWHITE, textDecoration: 'none', display: 'block', marginBottom: '8px' },
  footerCopy: { fontSize: '11.5px', color: '#555' },
};

export default Landing;