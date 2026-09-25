const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();
tg.setHeaderColor('secondary_bg_color');
tg.setBackgroundColor('bg_color');

function setTelegramUser() {
  const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (!user) return;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const displayName = fullName || user.username || 'Telegram-користувач';
  const username = user.username ? `@${user.username}` : 'Telegram Mini App';
  ['sidebarUserName', 'headerUserName'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = displayName;
  });
  elements.sidebarUsername.textContent = username;
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'TG';
  ['sidebarAvatarFallback', 'headerAvatarFallback'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = initials;
  });
  if (user.photo_url) {
    [['sidebarAvatar', 'sidebarAvatarFallback'], ['headerAvatar', 'headerAvatarFallback']].forEach(([imageId, fallbackId]) => {
      const image = document.getElementById(imageId);
      const fallback = document.getElementById(fallbackId);
      image.onload = () => {
        image.classList.remove('hidden');
        fallback.classList.add('hidden');
      };
      image.onerror = () => {
        image.classList.add('hidden');
        fallback.classList.remove('hidden');
      };
      image.src = user.photo_url;
    });
  }
}

function haptic(type = 'light') {
  if (!tg.HapticFeedback) return;
  if (type === 'success' || type === 'error' || type === 'warning') {
    tg.HapticFeedback.notificationOccurred(type);
  } else {
    tg.HapticFeedback.impactOccurred(type);
  }
}

function syncViewport() {
  const candidates = [
    Number(tg.viewportHeight),
    Number(window.visualViewport?.height),
    Number(window.innerHeight)
  ].filter(value => Number.isFinite(value) && value > 0);
  const viewportHeight = Math.round(Math.min(...candidates));
  if (viewportHeight > 0) {
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
  }
  updateMessageInput();
  window.requestAnimationFrame(() => {
    if (!elements.messages) return;
    elements.messages.scrollTo({ top: elements.messages.scrollHeight, behavior: 'auto' });
  });
}

function registerTelegramEvents() {
  if (tg.BackButton) {
    tg.BackButton.onClick(handleBack);
  }

  tg.onEvent('themeChanged', () => {
    refreshIcons();
  });

  tg.onEvent('viewportChanged', syncViewport);

  const visualViewport = window.visualViewport;
  if (visualViewport) {
    visualViewport.addEventListener('resize', syncViewport);
    visualViewport.addEventListener('scroll', syncViewport);
  }
  window.addEventListener('resize', syncViewport);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(syncViewport, 100);
  });
  window.addEventListener('focusin', event => {
    if (event.target === elements.messageInput) {
      syncViewport();
      window.setTimeout(syncViewport, 250);
    }
  });

  syncViewport();
}
