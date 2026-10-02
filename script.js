(() => {
  const reveals = [...document.querySelectorAll('.reveal')];
  const isIOSWebKit = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const photoEffects = isIOSWebKit
    ? ['left', 'right', 'up', 'scale', 'turn-left', 'turn-right', 'swing']
    : ['left', 'right', 'scale', 'turn-left', 'turn-right', 'wipe-left', 'wipe-right', 'diagonal', 'flip', 'swing', 'rise'];
  const textEffects = ['up', 'left', 'right', 'soft', 'scale'];
  const frameStyles = ['classic', 'tape', 'film', 'offset', 'line'];
  let previous = -1;

  reveals.forEach((item) => {
    const pool = item.classList.contains('photo-frame') ? photoEffects : textEffects;
    let index;
    do index = Math.floor(Math.random() * pool.length);
    while (index === previous);
    previous = index;
    item.dataset.fx = pool[index];
  });

  [...document.querySelectorAll('.gallery-section .photo-frame')].forEach((frame, index) => {
    frame.dataset.frameStyle = frameStyles[index % frameStyles.length];
  });

  const photoFrames = [...document.querySelectorAll('.photo-frame.reveal')];

  /* Empieza a descargar solamente las próximas fotos. Así la animación encuentra
     la imagen decodificada sin pedir toda la galería de una vez. */
  const imagePreloader = new IntersectionObserver((entries, io) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const image = entry.target.querySelector('img[loading="lazy"]');
      if (image) image.loading = 'eager';
      io.unobserve(entry.target);
    });
  }, { rootMargin: '850px 0px', threshold: 0 });

  photoFrames.forEach((frame) => imagePreloader.observe(frame));

  const observer = new IntersectionObserver((entries, io) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);

      let shown = false;
      const show = () => {
        if (shown) return;
        shown = true;

        /* Safari iOS puede cargar y revelar dentro del mismo ciclo de pintura.
           Dos frames garantizan que primero dibuje el estado inicial. */
        void entry.target.offsetWidth;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => entry.target.classList.add('is-visible'));
        });
      };
      const image = entry.target.matches('.photo-frame')
        ? entry.target.querySelector('img')
        : null;

      if (!image || (image.complete && image.naturalWidth > 0)) {
        show();
        return;
      }

      image.addEventListener('load', show, { once: true });
      image.addEventListener('error', show, { once: true });
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.1 });

  reveals.forEach((item) => observer.observe(item));

  const progress = document.querySelector('.progress span');
  let ticking = false;

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });

  const burst = (x, y, amount = 4) => {
    for (let i = 0; i < amount; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'tap-heart';
      heart.textContent = '♥';
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.fontSize = `${14 + Math.random() * 15}px`;
      heart.style.setProperty('--x', `${(Math.random() - .5) * 110}px`);
      heart.style.setProperty('--r', `${(Math.random() - .5) * 55}deg`);
      heart.style.animationDelay = `${i * 35}ms`;
      document.body.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }
  };

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    burst(event.clientX, event.clientY, 3);
  }, { passive: true });

  document.querySelector('.heart-button').addEventListener('click', (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
  });

  const gate = document.querySelector('#manga-gate');
  const riddleForm = document.querySelector('#riddle-form');
  const answerInput = document.querySelector('#riddle-answer');
  const feedback = document.querySelector('#riddle-feedback');
  const wrongMessages = [
    'Esa no es la palabra.',
    'Intenta una vez más.',
    'Casi… piensa un poquito más.',
    'El secreto sigue esperando.'
  ];
  let attempts = 0;

  const normalizeAnswer = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  riddleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (normalizeAnswer(answerInput.value) === 'ATUN') {
      feedback.textContent = 'La puerta está abierta ♥';
      feedback.classList.add('success');
      gate.classList.add('is-solved');
      const rect = answerInput.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top, 16);
      window.setTimeout(() => gate.classList.add('is-opening'), 3200);
      window.setTimeout(() => {
        gate.classList.add('is-gone');
        document.documentElement.classList.remove('gate-active');
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 4350);
      return;
    }

    attempts += 1;
    feedback.textContent = wrongMessages[Math.min(attempts - 1, wrongMessages.length - 1)];
    answerInput.classList.remove('is-wrong');
    void answerInput.offsetWidth;
    answerInput.classList.add('is-wrong');
    answerInput.select();
  });

  const surpriseMessages = [
    'Te elegiría otra vez.',
    'Mi lugar favorito: contigo.',
    'Qué suerte coincidir.',
    'Siempre tú.',
    'Por muchos más.',
    'Tú haces bonito todo.',
    'Mi mejor casualidad.',
    'Nos quedan mil fotos.'
  ];

  const tapMessages = [
    'Mi favorita ♥',
    'Tú + yo',
    'Qué suerte',
    'Solo nosotros',
    'Otro pedacito',
    'Más días así',
    'Siempre tú',
    'Aquí también'
  ];

  let lastSurprise = -1;
  document.querySelectorAll('[data-surprise]').forEach((card) => {
    card.addEventListener('click', () => {
      let index;
      do index = Math.floor(Math.random() * surpriseMessages.length);
      while (index === lastSurprise);
      lastSurprise = index;
      card.classList.add('is-changing');
      window.setTimeout(() => {
        card.querySelector('[data-surprise-text]').textContent = surpriseMessages[index];
        card.classList.remove('is-changing');
      }, 190);
      const rect = card.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
    });
  });

  const revealMemory = (frame) => {
    const note = frame.querySelector('.tap-note');
    const current = Number(frame.dataset.messageIndex ?? -1);
    let index;
    do index = Math.floor(Math.random() * tapMessages.length);
    while (index === current);
    frame.dataset.messageIndex = String(index);
    frame.style.setProperty('--tap-rot', `${(Math.random() - .5) * 4}deg`);
    note.textContent = tapMessages[index];
    note.classList.add('show');
    frame.classList.remove('is-tapped');
    void frame.offsetWidth;
    frame.classList.add('is-tapped');
    const rect = frame.getBoundingClientRect();
    burst(rect.left + rect.width / 2, Math.min(window.innerHeight - 40, rect.top + rect.height / 2), 6);
    window.clearTimeout(frame._noteTimer);
    frame._noteTimer = window.setTimeout(() => note.classList.remove('show'), 2400);
  };

  document.querySelectorAll('.interactive').forEach((frame) => {
    frame.addEventListener('click', () => revealMemory(frame));
    frame.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      revealMemory(frame);
    });
  });

  updateProgress();
})();
