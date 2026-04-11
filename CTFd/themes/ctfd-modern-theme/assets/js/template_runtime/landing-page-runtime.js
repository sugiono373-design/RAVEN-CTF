(function() {
    var configNode = document.getElementById("landing-config");
    if (!configNode) return;
    var config = JSON.parse(configNode.textContent || "{}");
    var CTF_START = config.start ?? null;
    var CTF_END = config.end ?? null;
    var CTF_NAME = config.ctfName || "";
    var SUBTITLE_TEXT = config.subtitle || "";

    var TYPED_KEY = 'ctf_landing_typed';
    var hasTypedBefore = localStorage.getItem(TYPED_KEY) === '1';

    document.body.classList.add('landing-mode');

    var badge = document.getElementById('hero-badge');
    var typeWelcome = document.getElementById('type-welcome');
    var typeCtfName = document.getElementById('type-ctfname');
    var cursor = document.getElementById('typing-cursor');
    var subtitleEl = document.getElementById('hero-subtitle');
    var countdownArea = document.getElementById('countdown-area');
    var ctaButtons = document.getElementById('cta-buttons');

    function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

    function moveCursorTo(el) {
      el.parentNode.insertBefore(cursor, el.nextSibling);
    }

    async function typeText(el, text, speed) {
      speed = speed || 55;
      for (var i = 0; i < text.length; i++) {
        el.textContent += text[i];
        await sleep(speed + Math.random() * 30);
      }
    }

    function showElement(el) {
      el.classList.add('visible');
    }

    async function runTypingAnimation() {
      await sleep(300);
      showElement(badge);
      await sleep(600);

      cursor.classList.remove('hidden');
      moveCursorTo(typeWelcome);
      await typeText(typeWelcome, 'Welcome to', 60);
      await sleep(200);

      moveCursorTo(typeCtfName);
      await typeText(typeCtfName, CTF_NAME, 70);
      await sleep(400);

      subtitleEl.appendChild(cursor);
      await typeText(subtitleEl, SUBTITLE_TEXT, 20);
      await sleep(300);

      cursor.classList.add('hidden');

      showElement(countdownArea);
      await sleep(200);
      showElement(ctaButtons);

      localStorage.setItem(TYPED_KEY, '1');
    }

    function showInstant() {
      showElement(badge);
      typeWelcome.textContent = 'Welcome to';
      typeCtfName.textContent = CTF_NAME;
      subtitleEl.textContent = SUBTITLE_TEXT;
      cursor.classList.add('hidden');
      showElement(countdownArea);
      showElement(ctaButtons);
    }

    if (!window.CyberTerminal.hasBooted()) {
      window.CyberTerminal.open();
    }

    document.addEventListener('terminal:closed', function onClose() {
      document.body.style.overflow = '';
      document.removeEventListener('terminal:closed', onClose);
      if (!hasTypedBefore) {
        runTypingAnimation();
      }
    });

    document.addEventListener('terminal:opened', function() {
      document.body.style.overflow = 'hidden';
    });

    if (!window.CyberTerminal.isOpen()) {
      if (hasTypedBefore) {
        showInstant();
      } else {
        runTypingAnimation();
      }
    } else if (hasTypedBefore) {
      showInstant();
    }
      
    function updateCountdown() {
      var area = document.getElementById('countdown-area');
      var badgeText = document.getElementById('status-badge-text');
      if (!area) return;

      var now = Date.now() / 1000;

      if (!CTF_START && !CTF_END) {
        area.innerHTML = '<div class="status-live">\u25cf Competition Open</div>';
        if (badgeText) badgeText.textContent = 'Open';
        return;
      }

      if (CTF_START && now < CTF_START) {
        var diff = CTF_START - now;
        var d = Math.floor(diff / 86400);
        var h = Math.floor((diff % 86400) / 3600);
        var m = Math.floor((diff % 3600) / 60);
        var s = Math.floor(diff % 60);

        area.innerHTML =
          '<div class="countdown-container">' +
            '<div class="countdown-unit"><span class="countdown-value">' + String(d).padStart(2,'0') + '</span><span class="countdown-label">Days</span></div>' +
            '<div class="countdown-unit"><span class="countdown-value">' + String(h).padStart(2,'0') + '</span><span class="countdown-label">Hours</span></div>' +
            '<div class="countdown-unit"><span class="countdown-value">' + String(m).padStart(2,'0') + '</span><span class="countdown-label">Min</span></div>' +
            '<div class="countdown-unit"><span class="countdown-value">' + String(s).padStart(2,'0') + '</span><span class="countdown-label">Sec</span></div>' +
          '</div>';
        if (badgeText) badgeText.textContent = 'Starting Soon';
      } else if (CTF_END && now > CTF_END) {
        area.innerHTML = '<div class="status-ended">Competition has ended</div>';
        if (badgeText) badgeText.textContent = 'Ended';
      } else {
        var timerHtml = '<div class="status-live">\u25cf Competition is LIVE</div>';
        if (CTF_END) {
          var diff2 = CTF_END - now;
          var d2 = Math.floor(diff2 / 86400);
          var h2 = Math.floor((diff2 % 86400) / 3600);
          var m2 = Math.floor((diff2 % 3600) / 60);
          var s2 = Math.floor(diff2 % 60);
          timerHtml +=
            '<div class="countdown-container" style="margin-top: 0.5rem;">' +
              '<div class="countdown-unit"><span class="countdown-value">' + String(d2).padStart(2,'0') + '</span><span class="countdown-label">Days</span></div>' +
              '<div class="countdown-unit"><span class="countdown-value">' + String(h2).padStart(2,'0') + '</span><span class="countdown-label">Hours</span></div>' +
              '<div class="countdown-unit"><span class="countdown-value">' + String(m2).padStart(2,'0') + '</span><span class="countdown-label">Min</span></div>' +
              '<div class="countdown-unit"><span class="countdown-value">' + String(s2).padStart(2,'0') + '</span><span class="countdown-label">Sec</span></div>' +
            '</div>';
        }
        area.innerHTML = timerHtml;
        if (badgeText) badgeText.textContent = 'Live';
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  })();
