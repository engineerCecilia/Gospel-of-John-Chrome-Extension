// Lightweight search helper for reader.html
(function(){
  function initReaderSearch(bookData) {
    const searchInput = document.getElementById('reader-search');
    const resultsContainer = document.getElementById('search-results');
    if (!searchInput || !resultsContainer || !bookData) return;

    const items = bookData.chapters.map((ch, idx) => ({
      idx,
      title: `Chapter ${ch.chapter} — ${ch.verses[0].text.slice(0,80).replace(/\s+$/,'')}...`,
      text: ch.verses.map(v => v.text).join(' ').toLowerCase()
    }));

    function renderResults(list) {
      if (!list || !list.length) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
      }
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = '';
      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      list.forEach(it => {
        const li = document.createElement('li');
        li.style.margin = '8px 0';
        const a = document.createElement('a');
        a.href = `reader.html?chapter=${it.idx}`;
        a.textContent = it.title;
        a.style.color = '#5c3e2e';
        a.style.textDecoration = 'none';
        a.style.fontWeight = '600';
        a.addEventListener('mouseover', () => a.style.textDecoration = 'underline');
        a.addEventListener('mouseout', () => a.style.textDecoration = 'none');
        li.appendChild(a);
        ul.appendChild(li);
      });
      resultsContainer.appendChild(ul);
    }

    function searchBooks(value) {
      const q = (value || '').trim().toLowerCase();
      if (!q) {
        renderResults([]);
        return [];
      }
      const filtered = items.filter(it => it.title.toLowerCase().includes(q) || it.text.includes(q));
      renderResults(filtered);
      return filtered;
    }

    searchInput.addEventListener('input', (e) => {
      searchBooks(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const matches = searchBooks(searchInput.value);
        const first = resultsContainer.querySelector('ul li a');
        if (matches.length && first) {
          first.click();
        }
      }
    });
  }

  function attachInit() {
    const bookData = window.bookDataForSearch;
    if (bookData) {
      initReaderSearch(bookData);
      return true;
    }
    return false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachInit);
  } else {
    attachInit();
  }

  // expose initializer
  window.initReaderSearch = initReaderSearch;
})();
