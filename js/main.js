/* ============================================
   SKB ENTERPRISES - Main JavaScript (with API)
   ============================================ */

const API_BASE = window.location.origin + '/api';

/* ---------- API Helper ---------- */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('skb_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ---------- Show Notification ---------- */
function showNotification(message, type = 'success') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const notif = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
  notif.style.cssText = `background:${bg};color:#fff;padding:14px 24px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);font-size:0.95rem;animation:fadeInUp 0.3s ease;min-width:280px;`;
  notif.textContent = message;
  container.appendChild(notif);
  setTimeout(() => { notif.style.opacity = '0'; notif.style.transition = 'opacity 0.3s'; setTimeout(() => notif.remove(), 300); }, 4000);
}

/* ---------- Form to API Mapping ---------- */
function getFormPayload(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  const payload = {};
  inputs.forEach(input => {
    const name = input.name || input.placeholder || input.closest('.form-group')?.querySelector('label')?.textContent || '';
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (key && input.value.trim()) payload[key] = input.value.trim();
  });
  return payload;
}

function detectFormType(form) {
  const text = form.textContent.toLowerCase() + form.action;
  if (form.closest('.booking-form') || text.includes('book engineer')) return 'engineer_booking';
  if (text.includes('send request') || text.includes('request a quote')) return 'lead';
  if (text.includes('submit application') || text.includes('send your resume') || text.includes('send resume')) return 'career';
  return 'unknown';
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile Navigation (App-like Drawer) ---------- */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const mobileOverlay = document.getElementById('mobileOverlay');

  const navCta = document.querySelector('.nav-cta');

  function openMobileMenu() {
    if (navLinks) navLinks.classList.add('active', 'open');
    if (navCta) navCta.classList.add('mobile-show');
    if (mobileToggle) mobileToggle.classList.add('open');
    if (mobileOverlay) mobileOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
  }

  function closeMobileMenu() {
    if (navLinks) navLinks.classList.remove('open');
    if (navCta) navCta.classList.remove('mobile-show');
    if (mobileToggle) mobileToggle.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('show');
    const scrollY = document.body.style.top ? Math.abs(parseInt(document.body.style.top)) : 0;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks && navLinks.classList.contains('open');
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });
  }
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileMenu();
  });

  /* ---------- Sticky Header ---------- */
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  });

  /* ---------- Back to Top ---------- */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 400));
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Scroll Reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
  }, { threshold: 0.15 });
  reveals.forEach(el => revealObserver.observe(el));

  /* ---------- Animated Counters ---------- */
  const counters = document.querySelectorAll('.counter-item h3');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const count = parseInt(target.getAttribute('data-count'));
        const suffix = target.getAttribute('data-suffix') || '';
        let current = 0;
        const increment = Math.ceil(count / 80);
        const timer = setInterval(() => {
          current += increment;
          if (current >= count) { current = count; clearInterval(timer); }
          target.textContent = current.toLocaleString() + suffix;
        }, 20);
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  /* ---------- Testimonial Slider ---------- */
  const track = document.querySelector('.testimonial-track');
  const dots = document.querySelectorAll('.testimonial-nav button');
  let currentSlide = 0;
  const slides = document.querySelectorAll('.testimonial-card');
  const totalSlides = slides.length;

  function goToSlide(index) {
    if (!track) return;
    currentSlide = index;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
  if (track && totalSlides > 0) {
    setInterval(() => { currentSlide = (currentSlide + 1) % totalSlides; goToSlide(currentSlide); }, 5000);
  }

  /* ---------- Active Nav Link ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) link.classList.add('active');
  });

  /* ---------- User Account Button ---------- */
  const accountBtn = document.getElementById('navAccountBtn');
  if (accountBtn) {
    const skbUser = JSON.parse(localStorage.getItem('skb_user') || 'null');
    const skbUserInfo = JSON.parse(localStorage.getItem('skb_user_info') || 'null');
    const user = skbUser || skbUserInfo;
    if (user && user.name) {
      const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
      const dashboardUrl = user.role === 'admin' ? 'admin/dashboard' : 'user/dashboard';
      accountBtn.textContent = user.name;
      accountBtn.href = isHome ? dashboardUrl : '../' + dashboardUrl;
      accountBtn.style.background = 'var(--primary)';
      accountBtn.style.color = '#fff';
      accountBtn.style.borderColor = 'var(--primary)';
    }
  }

  /* ---------- Form Handling with API ---------- */
  const allForms = document.querySelectorAll('form');
  allForms.forEach(form => {
    // Skip admin login form (handled separately)
    if (form.id === 'loginForm') return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.id === 'careerForm') return;
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      const formType = detectFormType(form);

      try {
        let endpoint = '';
        let payload = {};

        if (formType === 'lead') {
          endpoint = '/leads';
          const inputs = form.querySelectorAll('input, select, textarea');
          payload = {
            name: inputs[0]?.value || '',
            phone: inputs[1]?.value || '',
            email: inputs[2]?.value || '',
            company: inputs[3]?.value || '',
            service: inputs[4]?.value || '',
            city: inputs[5]?.value || '',
            message: inputs[6]?.value || ''
          };
        } else if (formType === 'engineer_booking') {
          endpoint = '/service-requests';
          const inputs = form.querySelectorAll('input, select, textarea');
          payload = {
            type: 'booking',
            name: inputs[0]?.value || '',
            phone: inputs[1]?.value || '',
            preferred_date: inputs[2]?.value || '',
            time_slot: inputs[3]?.value || '',
            service: inputs[4]?.value || '',
            address: inputs[5]?.value || ''
          };
        } else if (formType === 'career') {
          endpoint = '/careers';
          const inputs = form.querySelectorAll('input, select, textarea');
          payload = {
            name: inputs[0]?.value || '',
            email: inputs[1]?.value || '',
            position: inputs[2]?.value || '',
            phone: inputs[3]?.value || '',
            resume_link: inputs[4]?.value || ''
          };
        } else {
          // Generic fallback
          endpoint = '/leads';
          const inputs = form.querySelectorAll('input, select, textarea');
          const arr = Array.from(inputs);
          payload = {
            name: arr[0]?.value || 'User',
            phone: arr[1]?.value || '',
            email: arr[2]?.value || '',
            service: arr[3]?.value || 'General',
            city: arr[4]?.value || 'Not specified',
            message: arr[5]?.value || ''
          };
        }

        await apiRequest(endpoint, 'POST', payload);

        btn.innerHTML = 'Sent Successfully!';
        btn.style.background = '#10b981';
        form.reset();
        showNotification('Your request has been submitted successfully! We will get back to you within 24 hours.', 'success');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      } catch (err) {
        btn.innerHTML = 'Error - Try Again';
        btn.style.background = '#ef4444';
        showNotification(err.message || 'Something went wrong. Please try again.', 'error');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }
    });
  });

  /* ---------- Engineer Booking Calendar ---------- */
  const bookingForm = document.querySelector('.booking-form');
  if (bookingForm) {
    const dateInput = bookingForm.querySelector('input[type="date"]');
    if (dateInput) dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Service Locations Interactive Map ---------- */
  const cityCoords = {
    'delhi-ncr':    { cx: 162, cy: 108, state: 'Delhi',        city: 'Delhi NCR' },
    'mumbai':       { cx: 100, cy: 240, state: 'Maharashtra',  city: 'Mumbai' },
    'pune':         { cx: 108, cy: 252, state: 'Maharashtra',  city: 'Pune' },
    'bengaluru':    { cx: 138, cy: 330, state: 'Karnataka',    city: 'Bengaluru' },
    'hyderabad':    { cx: 152, cy: 278, state: 'Telangana',    city: 'Hyderabad' },
    'chennai':      { cx: 168, cy: 338, state: 'Tamil Nadu',   city: 'Chennai' },
    'kolkata':      { cx: 268, cy: 230, state: 'West Bengal',  city: 'Kolkata' },
    'ahmedabad':    { cx: 88,  cy: 192, state: 'Gujarat',      city: 'Ahmedabad' },
    'jaipur':       { cx: 122, cy: 158, state: 'Rajasthan',    city: 'Jaipur' },
    'chandigarh':   { cx: 140, cy: 96,  state: 'Punjab',       city: 'Chandigarh' },
    'lucknow':      { cx: 208, cy: 172, state: 'Uttar Pradesh', city: 'Lucknow' },
    'patna':        { cx: 242, cy: 188, state: 'Bihar',        city: 'Patna' },
    'guwahati':     { cx: 298, cy: 148, state: 'Assam',        city: 'Guwahati' },
    'bhubaneswar':  { cx: 248, cy: 270, state: 'Odisha',       city: 'Bhubaneswar' },
    'kochi':        { cx: 126, cy: 380, state: 'Kerala',       city: 'Kochi' }
  };

  const stateHighlightPaths = {
    'delhi-ncr':   'M 150,96 L 162,92 L 174,96 L 178,108 L 174,120 L 162,124 L 150,120 Z',
    'mumbai':      'M 86,228 L 100,224 L 114,228 L 118,240 L 114,252 L 100,256 L 86,252 Z',
    'pune':        'M 94,240 L 108,236 L 122,240 L 126,252 L 122,264 L 108,268 L 94,264 Z',
    'bengaluru':   'M 124,318 L 138,314 L 152,318 L 156,330 L 152,342 L 138,346 L 124,342 Z',
    'hyderabad':   'M 138,266 L 152,262 L 166,266 L 170,278 L 166,290 L 152,294 L 138,290 Z',
    'chennai':     'M 154,326 L 168,322 L 182,326 L 186,338 L 182,350 L 168,354 L 154,350 Z',
    'kolkata':     'M 254,218 L 268,214 L 282,218 L 286,230 L 282,242 L 268,246 L 254,242 Z',
    'ahmedabad':   'M 74,180 L 88,176 L 102,180 L 106,192 L 102,204 L 88,208 L 74,204 Z',
    'jaipur':      'M 108,146 L 122,142 L 136,146 L 140,158 L 136,170 L 122,174 L 108,170 Z',
    'chandigarh':  'M 126,84 L 140,80 L 154,84 L 158,96 L 154,108 L 140,112 L 126,108 Z',
    'lucknow':     'M 194,160 L 208,156 L 222,160 L 226,172 L 222,184 L 208,188 L 194,184 Z',
    'patna':       'M 228,176 L 242,172 L 256,176 L 260,188 L 256,200 L 242,204 L 228,200 Z',
    'guwahati':    'M 284,136 L 298,132 L 312,136 L 316,148 L 312,160 L 298,164 L 284,160 Z',
    'bhubaneswar': 'M 234,258 L 248,254 L 262,258 L 266,270 L 262,282 L 248,286 L 234,282 Z',
    'kochi':       'M 112,368 L 126,364 L 140,368 L 144,380 L 140,392 L 126,396 L 112,392 Z'
  };

  const cityCards = document.querySelectorAll('.city-card');
  const cityDots = document.querySelectorAll('.city-dot');
  const stateHighlight = document.getElementById('state-highlight');
  const pulseRing1 = document.getElementById('pulse-ring-1');
  const pulseRing2 = document.getElementById('pulse-ring-2');
  const mapStateTag = document.getElementById('map-state-tag');
  const mapCityName = document.getElementById('map-city-name');
  const mapServicesTag = document.querySelector('.map-services-tag');

  function activateCity(cityKey) {
    const data = cityCoords[cityKey];
    if (!data) return;

    cityCards.forEach(c => c.classList.remove('active'));
    cityDots.forEach(d => d.classList.remove('active'));
    const activeCard = document.querySelector(`.city-card[data-city="${cityKey}"]`);
    const activeDot = document.querySelector(`.city-dot[data-city="${cityKey}"]`);
    if (activeCard) activeCard.classList.add('active');
    if (activeDot) activeDot.classList.add('active');

    stateHighlight.setAttribute('d', stateHighlightPaths[cityKey] || '');
    stateHighlight.style.opacity = '0';
    requestAnimationFrame(() => {
      stateHighlight.style.opacity = '1';
    });

    [pulseRing1, pulseRing2].forEach(ring => {
      ring.setAttribute('cx', data.cx);
      ring.setAttribute('cy', data.cy);
      ring.style.animation = 'none';
      void ring.offsetHeight;
      ring.style.animation = '';
    });
    pulseRing1.style.animation = 'svgPulse1 2s ease-out infinite';
    pulseRing2.style.animation = 'svgPulse2 2s ease-out 0.5s infinite';

    mapStateTag.textContent = data.state;
    mapCityName.textContent = data.city;
    mapStateTag.classList.remove('show');
    mapCityName.classList.remove('show');
    mapServicesTag.classList.remove('show');
    requestAnimationFrame(() => {
      mapStateTag.classList.add('show');
      mapCityName.classList.add('show');
      mapServicesTag.classList.add('show');
    });
  }

  cityCards.forEach(card => {
    card.addEventListener('click', () => activateCity(card.getAttribute('data-city')));
  });
  cityDots.forEach(dot => {
    dot.addEventListener('click', () => activateCity(dot.getAttribute('data-city')));
  });

  activateCity('delhi-ncr');

  /* ---------- Brand Carousel Duplicate ---------- */
  const brandTrack = document.querySelector('.brands-track');
  if (brandTrack) brandTrack.innerHTML += brandTrack.innerHTML;

  /* ---------- Security: Disable Right Click ---------- */
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  /* ---------- Security: Block Inspect Shortcuts ---------- */
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's')) ||
      (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) ||
      (e.metaKey && e.altKey && (e.key === 'U' || e.key === 'u'))
    ) {
      e.preventDefault();
      return false;
    }
  });

  /* ---------- Security: Disable View Source ---------- */
  document.addEventListener('keyup', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
  });

  /* ---------- Security: Disable Drag on Contact Elements ---------- */
  const protectedElements = document.querySelectorAll('.contact-item, .contact-info, .footer-contact, .top-bar, .footer-bottom');
  protectedElements.forEach(el => {
    el.setAttribute('draggable', 'false');
    el.addEventListener('dragstart', (e) => { e.preventDefault(); return false; });
  });

  /* ---------- Security: Warn on DevTools Open ---------- */
  (function() {
    let devtoolsOpen = false;
    const threshold = 160;
    setInterval(() => {
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a2463;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:20px;"><div><h1 style="font-size:2rem;margin-bottom:15px;">Access Restricted</h1><p style="font-size:1.1rem;opacity:0.8;">This website is protected. DevTools access is not allowed.</p></div></div>';
        }
      } else {
        devtoolsOpen = false;
      }
    }, 1000);
  })();
});
