const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

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
  try {
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('bg_color');
  } catch (error) {
    return;
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

function registerTelegramEvents() {
  if (tg.BackButton) {
    tg.BackButton.onClick(handleBack);
  }

  tg.onEvent('themeChanged', () => {
    refreshIcons();
  });

  tg.onEvent('viewportChanged', () => {
    updateMessageInput();
  });
}
