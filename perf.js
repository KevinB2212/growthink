// ===== Performance Utilities =====

// Debounce - delay execution until user stops typing
function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Throttle - limit execution rate
function throttle(fn, ms) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// Lazy load a script only when needed
const _loadedScripts = new Set();
function lazyLoadScript(src) {
  if (_loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { _loadedScripts.add(src); resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Lazy load CSS
const _loadedCSS = new Set();
function lazyLoadCSS(href) {
  if (_loadedCSS.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  _loadedCSS.add(href);
}

// Virtual scroll helper - renders only visible items
class VirtualScroller {
  constructor(container, itemHeight, renderFn) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderFn = renderFn;
    this.items = [];
    this.scrollHandler = throttle(() => this.render(), 16);
    container.addEventListener('scroll', this.scrollHandler);
  }

  setItems(items) {
    this.items = items;
    this.container.style.position = 'relative';
    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const viewHeight = this.container.clientHeight;
    const totalHeight = this.items.length * this.itemHeight;
    
    // Calculate visible range with buffer
    const buffer = 5;
    const startIdx = Math.max(0, Math.floor(scrollTop / this.itemHeight) - buffer);
    const endIdx = Math.min(this.items.length, Math.ceil((scrollTop + viewHeight) / this.itemHeight) + buffer);
    
    // Create spacer + visible items
    let html = `<div style="height:${startIdx * this.itemHeight}px"></div>`;
    for (let i = startIdx; i < endIdx; i++) {
      html += this.renderFn(this.items[i], i);
    }
    html += `<div style="height:${(this.items.length - endIdx) * this.itemHeight}px"></div>`;
    this.container.innerHTML = html;
  }

  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
  }
}

// RequestAnimationFrame wrapper for canvas rendering
function rafDraw(drawFn) {
  return requestAnimationFrame(drawFn);
}

// Image compression utility
function compressImage(dataUrl, maxWidth, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality || 0.6));
    };
    img.src = dataUrl;
  });
}
