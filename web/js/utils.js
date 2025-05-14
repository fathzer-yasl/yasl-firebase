// Utility for long-press detection
export function addLongPressListener(node, callback) {
  let timer = null;
  let startX = null, startY = null;
  const threshold = 10; // px

  // Mouse events
  node.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, 600);
  });
  node.addEventListener('mousemove', (e) => {
    if (timer !== null && startX !== null && startY !== null) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > threshold) {
        clearTimeout(timer);
        timer = null;
      }
    }
  });
  node.addEventListener('mouseup', () => {
    clearTimeout(timer);
    timer = null;
    startX = null;
    startY = null;
  });
  node.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    timer = null;
    startX = null;
    startY = null;
  });

  // Touch events for mobile
  node.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      timer = setTimeout(() => {
        timer = null;
        callback();
      }, 600);
    }
  });
  node.addEventListener('touchmove', (e) => {
    if (timer !== null && startX !== null && startY !== null && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > threshold) {
        clearTimeout(timer);
        timer = null;
      }
    }
  });
  node.addEventListener('touchend', () => {
    clearTimeout(timer);
    timer = null;
    startX = null;
    startY = null;
  });
  node.addEventListener('touchcancel', () => {
    clearTimeout(timer);
    timer = null;
    startX = null;
    startY = null;
  });
}

