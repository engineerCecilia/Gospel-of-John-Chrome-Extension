document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('chapter-dropdown');
  const bibleText = document.getElementById('bible-text');
  const prevBtn = document.getElementById('prev-chap');
  const nextBtn = document.getElementById('next-chap');
  const incBtn = document.getElementById('font-inc');
  const decBtn = document.getElementById('font-dec');
  const themeSelect = document.getElementById('theme-select');

  const THEMES = {
    'default': { label: 'Default', text: '#2c2416', background: '#faf8f3' },
    'eye-comfort-green': { label: 'Eye Comfort Green', text: '#2F4F4F', background: '#C7EDCC' },
    'almond-yellow': { label: 'Almond Yellow', text: '#333333', background: '#FAF9DE' },
    'paper-white': { label: 'Paper White', text: '#3A3A3A', background: '#F7F3E8' },
    'soft-blue-gray': { label: 'Soft Blue Gray', text: '#2C3E50', background: '#E8F1F5' },
    'grass-green': { label: 'Grass Green', text: '#2E3A2F', background: '#E3EDCD' },
    'solarized-light': { label: 'Solarized Light', text: '#586E75', background: '#FDF6E3' },
    'dark-forest': { label: 'Dark Forest', text: '#C9D1C5', background: '#1E2420' },
    'solarized-dark': { label: 'Solarized Dark', text: '#93A1A1', background: '#002B36' },
    'night-blue': { label: 'Night Blue', text: '#D6E4F0', background: '#1B2430' },
    'dark-amber': { label: 'Dark Amber', text: '#E8D8B0', background: '#2B2418' }
  };

  // load settings.json (developer-provided defaults)
  let defaultSettings = {};
  const settingsPromise = fetch('settings.json')
    .then(r => r.ok ? r.json() : {})
    .then(s => { defaultSettings = s || {}; })
    .catch(() => { defaultSettings = {}; });

  function applyTheme(key) {
    const t = THEMES[key] || THEMES['default'];
    try {
      document.documentElement.style.setProperty('--bg-color', t.background);
      document.documentElement.style.setProperty('--text-color', t.text);
    } catch (e) {}
  }

  function populateThemeSelect() {
    if (!themeSelect) return;
    Object.keys(THEMES).forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = THEMES[k].label;
      themeSelect.appendChild(opt);
    });
    const saved = localStorage.getItem('john_theme') || defaultSettings.theme || 'eye-comfort-green';
    themeSelect.value = (saved in THEMES) ? saved : 'eye-comfort-green';
    applyTheme(themeSelect.value);
    themeSelect.addEventListener('change', (e) => {
      const v = e.target.value;
      localStorage.setItem('john_theme', v);
      applyTheme(v);
    });
  }
  let bookData = null;
  let currentIndex = 0;
  let fontSize = 32;

  // load both book and settings, then initialize UI
  Promise.all([
    fetch('John.json').then(r => r.ok ? r.json() : Promise.reject('no book')),
    settingsPromise
  ]).then(([data]) => {
    bookData = data;
    try { window.bookDataForSearch = bookData; } catch(e) {}
    if (dropdown) populateChapters();

    // apply theme and defaults (populateThemeSelect reads defaultSettings)
    populateThemeSelect();

    // font size: prefer saved, then settings file, then current variable
    const savedFont = localStorage.getItem('john_fontSize');
    if (savedFont !== null) {
      fontSize = Math.max(8, Number(savedFont));
    } else if (defaultSettings.fontSize) {
      fontSize = Number(defaultSettings.fontSize) || fontSize;
    }

    // If popup opened with chapter param, use it; else prefer saved, then settings, then chapter 1
    const params = new URLSearchParams(location.search);
    const chapterParam = params.get('chapter');
    if (chapterParam !== null) {
      const idx = Math.min(Number(chapterParam), bookData.chapters.length - 1);
      renderChapter(idx);
    } else {
      const last = localStorage.getItem('john_current');
      if (last !== null) {
        const idx = Math.min(Number(last), bookData.chapters.length - 1);
        renderChapter(idx);
      } else if (typeof defaultSettings.currentChapter !== 'undefined') {
        const idx = Math.min(Number(defaultSettings.currentChapter), bookData.chapters.length - 1);
        renderChapter(idx);
      } else {
        renderChapter(0);
      }
    }
  }).catch(() => {
    bibleText.innerHTML = '<p class="placeholder">Failed to load the text.</p>';
  });

  function populateChapters() {
    bookData.chapters.forEach((ch, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Chapter ${ch.chapter}`;
      dropdown.appendChild(opt);
    });
  }

  function renderChapter(idx) {
    if (!bookData) return;
    currentIndex = idx;
    const chap = bookData.chapters[idx];
    bibleText.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = `Chapter ${chap.chapter}`;
    title.style.textAlign = 'center';
    bibleText.appendChild(title);

    chap.verses.forEach(v => {
      const p = document.createElement('p');
      const num = document.createElement('span');
      num.className = 'verse-number';
      num.textContent = v.verse;
      p.appendChild(num);
      const txt = document.createElement('span');
      txt.textContent = ' ' + v.text;
      p.appendChild(txt);
      bibleText.appendChild(p);
    });

    bibleText.style.fontSize = fontSize + 'px';
    updateNav();
    localStorage.setItem('john_current', String(currentIndex));
  }

  function updateNav() {
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn && bookData) nextBtn.disabled = currentIndex >= (bookData.chapters.length - 1);
    if (dropdown) dropdown.value = currentIndex;
  }

  if (dropdown) {
    dropdown.addEventListener('change', (e) => {
      renderChapter(Number(e.target.value));
    });
  }


  // Open TOC in separate tab
  const openToc = document.getElementById('open-toc');
  if (openToc) {
    openToc.addEventListener('click', () => {
      const url = chrome && chrome.runtime ? chrome.runtime.getURL('toc.html') : 'toc.html';
      window.open(url, '_blank');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) renderChapter(currentIndex - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!bookData) return;
      if (currentIndex < bookData.chapters.length - 1) renderChapter(currentIndex + 1);
    });
  }

  if (incBtn) {
    incBtn.addEventListener('click', () => {
      fontSize += 1;
      if (bibleText) bibleText.style.fontSize = fontSize + 'px';
      localStorage.setItem('john_fontSize', String(fontSize));
    });
  }
  if (decBtn) {
    decBtn.addEventListener('click', () => {
      fontSize = Math.max(12, fontSize - 1);
      if (bibleText) bibleText.style.fontSize = fontSize + 'px';
      localStorage.setItem('john_fontSize', String(fontSize));
    });
  }

  

  // Open full reader in a new tab
  const openFull = document.getElementById('open-full');
  if (openFull) {
    openFull.addEventListener('click', () => {
      const url = chrome && chrome.runtime ? chrome.runtime.getURL('reader.html') : 'reader.html';
      window.open(url, '_blank');
    });
  }
});
