const API_BASE_URL = window.ANKI_API_BASE_URL || '';
const STORAGE_KEY = 'anki-gemini-decks-v1';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const desktopQuery = window.matchMedia('(min-width: 768px)');

const elements = {
  sidebar: document.getElementById('sidebar'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  openSidebarButton: document.getElementById('openSidebarButton'),
  closeSidebarButton: document.getElementById('closeSidebarButton'),
  myDecksButton: document.getElementById('myDecksButton'),
  deckListPanel: document.getElementById('deckListPanel'),
  deckList: document.getElementById('deckList'),
  deckSummary: document.getElementById('deckSummary'),
  emptyDecksState: document.getElementById('emptyDecksState'),
  editorPanel: document.getElementById('editorPanel'),
  editorBackButton: document.getElementById('editorBackButton'),
  editorDeckTitle: document.getElementById('editorDeckTitle'),
  editorCardSelect: document.getElementById('editorCardSelect'),
  previousCardButton: document.getElementById('previousCardButton'),
  nextCardButton: document.getElementById('nextCardButton'),
  editorCardPosition: document.getElementById('editorCardPosition'),
  editorFront: document.getElementById('editorFront'),
  editorBack: document.getElementById('editorBack'),
  editorExtra: document.getElementById('editorExtra'),
  editorModelCss: document.getElementById('editorModelCss'),
  saveCardButton: document.getElementById('saveCardButton'),
  addCardButton: document.getElementById('addCardButton'),
  deleteCardButton: document.getElementById('deleteCardButton'),
  messages: document.getElementById('messages'),
  chatForm: document.getElementById('chatForm'),
  messageInput: document.getElementById('messageInput'),
  sendButton: document.getElementById('sendButton'),
  fileInput: document.getElementById('fileInput'),
  attachButton: document.getElementById('attachButton'),
  attachmentPreview: document.getElementById('attachmentPreview'),
  attachmentName: document.getElementById('attachmentName'),
  attachmentSize: document.getElementById('attachmentSize'),
  removeAttachmentButton: document.getElementById('removeAttachmentButton'),
  deckModal: document.getElementById('deckModal'),
  closeDeckModalButton: document.getElementById('closeDeckModalButton'),
  cancelDeckModalButton: document.getElementById('cancelDeckModalButton'),
  confirmDeckModalButton: document.getElementById('confirmDeckModalButton'),
  confirmDeckModalText: document.getElementById('confirmDeckModalText'),
  deckModalTitle: document.getElementById('deckModalTitle'),
  deckModalDescription: document.getElementById('deckModalDescription'),
  saveDeckOptionsWrap: document.getElementById('saveDeckOptionsWrap'),
  saveDeckOptions: document.getElementById('saveDeckOptions'),
  newDeckFieldWrap: document.getElementById('newDeckFieldWrap'),
  newDeckName: document.getElementById('newDeckName'),
  confirmModal: document.getElementById('confirmModal'),
  confirmModalTitle: document.getElementById('confirmModalTitle'),
  confirmModalText: document.getElementById('confirmModalText'),
  cancelConfirmButton: document.getElementById('cancelConfirmButton'),
  acceptConfirmButton: document.getElementById('acceptConfirmButton'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText'),
  toastIcon: document.getElementById('toastIcon'),
  storageStatusText: document.getElementById('storageStatusText'),
  storageStatusDot: document.getElementById('storageStatusDot')
};

const appState = {
  decks: loadDecks(),
  activeDeckId: 'cpp-basic',
  editorDeckId: null,
  editorCardId: null,
  selectedFile: null,
  drawerOpen: false,
  modalMode: 'create',
  pendingCards: [],
  selectedModalDeckId: null,
  pendingConfirm: null,
  toastTimer: null,
  messages: [
    {
      id: 'welcome-message',
      role: 'assistant',
      type: 'text',
      content: '## Привіт! 👋\nЯ допоможу перетворити ваші нотатки на **якісні картки Anki**.\n\nМожна надіслати текст, прикріпити `.txt`, `.pdf` або `.docx`, а також попросити скласти короткий Markdown-конспект.',
      createdAt: Date.now()
    },
    {
      id: 'example-cards-message',
      role: 'assistant',
      type: 'cards',
      content: '### Приклад карток\nНатисніть на картку, щоб побачити відповідь, або збережіть їх у власну колоду.',
      createdAt: Date.now(),
      cards: [
        { front: 'Що таке компілятор?', back: 'Програма, яка перетворює вихідний код мови програмування на машинний код або проміжкове представлення.', extra: 'Приклади: GCC, Clang, MSVC.' },
        { front: 'Де проходить компіляція C++?', back: 'У компіляторі та компіляторі GCC, після чого готовий виконуваний файл запускається процесором.', extra: 'Для онлайн-редагування часто використовують сучасний стандарт C++.' }
      ]
    }
  ]
};

function createId(prefix) {
  const value = window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function showToast(text, type = 'success') {
  window.clearTimeout(appState.toastTimer);
  elements.toastText.textContent = text;
  elements.toastIcon.setAttribute('data-lucide', type === 'error' ? 'circle-x' : type === 'warning' ? 'triangle-alert' : 'check-circle-2');
  elements.toastIcon.className = `h-4 w-4 shrink-0 ${type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`;
  refreshIcons(elements.toast);
  elements.toast.classList.add('is-visible');
  appState.toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2800);
}

function formatRelativeDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= dayStart) {
    return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  if (date.getTime() >= dayStart - 604800000) {
    return new Intl.DateTimeFormat('uk-UA', { weekday: 'short' }).format(date);
  }
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short' }).format(date);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function openDrawer() {
  if (desktopQuery.matches) return;
  appState.drawerOpen = true;
  elements.sidebar.classList.add('drawer-open');
  elements.drawerBackdrop.classList.remove('hidden');
  elements.drawerBackdrop.classList.add('fade-enter');
  updateBackButton();
}

function closeDrawer() {
  appState.drawerOpen = false;
  elements.sidebar.classList.remove('drawer-open');
  elements.drawerBackdrop.classList.add('hidden');
  updateBackButton();
}

function handleBack() {
  if (appState.editorDeckId) {
    showDeckList();
    if (!desktopQuery.matches) openDrawer();
  } else if (appState.drawerOpen) {
    closeDrawer();
  }
}

function updateBackButton() {
  if (!tg.BackButton) return;
  if (appState.drawerOpen || Boolean(appState.editorDeckId)) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }
}

function openConfirmModal(title, text, action) {
  appState.pendingConfirm = action;
  elements.confirmModalTitle.textContent = title;
  elements.confirmModalText.textContent = text;
  elements.confirmModal.classList.remove('hidden');
  elements.confirmModal.classList.add('flex');
  window.setTimeout(() => elements.cancelConfirmButton.focus(), 80);
}

function closeConfirmModal() {
  elements.confirmModal.classList.add('hidden');
  elements.confirmModal.classList.remove('flex');
  appState.pendingConfirm = null;
}

async function sendToBackend(type, payload) {
  const envelope = {
    type,
    payload,
    sentAt: new Date().toISOString()
  };
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/api/telegram/webapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTelegramHeaders()
      },
      body: JSON.stringify(envelope)
    });
    if (!response.ok) throw new Error('Backend request failed');
    const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
    return { transport: 'remote', data: result };
  }
  const serialized = JSON.stringify(envelope);
  if (tg.initData && new Blob([serialized]).size <= 4096) {
    tg.sendData(serialized);
    return { transport: 'telegram' };
  }
  return { transport: 'local' };
}

elements.openSidebarButton.addEventListener('click', openDrawer);
elements.closeSidebarButton.addEventListener('click', closeDrawer);
elements.drawerBackdrop.addEventListener('click', closeDrawer);
elements.myDecksButton.addEventListener('click', () => {
  showDeckList();
  if (!desktopQuery.matches) openDrawer();
});

elements.deckList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const deckId = button.dataset.deckId;
  if (button.dataset.action === 'select-deck') {
    appState.activeDeckId = deckId;
    renderDecks();
    showToast(`Обрано: ${appState.decks.find(deck => deck.id === deckId)?.title || 'колоду'}`);
    haptic();
  } else if (button.dataset.action === 'edit-deck') {
    openEditor(deckId);
  } else if (button.dataset.action === 'download-deck') {
    downloadDeck(deckId);
  } else if (button.dataset.action === 'delete-deck') {
    requestDeleteDeck(deckId);
  }
});

elements.editorBackButton.addEventListener('click', () => {
  showDeckList();
  if (!desktopQuery.matches) openDrawer();
});
elements.editorCardSelect.addEventListener('change', event => {
  appState.editorCardId = event.target.value;
  renderEditor();
});
elements.previousCardButton.addEventListener('click', () => navigateEditorCard(-1));
elements.nextCardButton.addEventListener('click', () => navigateEditorCard(1));
elements.saveCardButton.addEventListener('click', saveEditorCard);
elements.addCardButton.addEventListener('click', addEditorCard);
elements.deleteCardButton.addEventListener('click', requestDeleteCard);

document.getElementById('addDeckButton').addEventListener('click', () => openDeckModal('create'));
elements.closeDeckModalButton.addEventListener('click', closeDeckModal);
elements.cancelDeckModalButton.addEventListener('click', closeDeckModal);
elements.confirmDeckModalButton.addEventListener('click', confirmDeckModal);
elements.newDeckName.addEventListener('input', () => {
  if (appState.modalMode === 'save' && elements.newDeckName.value.trim()) {
    appState.selectedModalDeckId = null;
    elements.saveDeckOptions.querySelectorAll('.deck-option').forEach(option => {
      option.classList.remove('is-selected');
      const icon = option.querySelector('[data-lucide="check-circle-2"]');
      if (icon) icon.classList.add('hidden');
    });
  }
});
elements.saveDeckOptions.addEventListener('click', event => {
  const option = event.target.closest('.deck-option');
  if (!option) return;
  const radio = option.querySelector('input[type="radio"]');
  if (!radio) return;
  appState.selectedModalDeckId = radio.value;
  elements.newDeckName.value = '';
  renderDeckOptions();
});

elements.cancelConfirmButton.addEventListener('click', closeConfirmModal);
elements.acceptConfirmButton.addEventListener('click', async () => {
  const action = appState.pendingConfirm;
  closeConfirmModal();
  if (action) await action();
});

elements.messages.addEventListener('click', event => {
  const card = event.target.closest('.flip-card');
  if (card) {
    card.classList.toggle('is-flipped');
    haptic('light');
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'save-message-cards') {
    const message = appState.messages.find(item => item.id === button.dataset.messageId);
    if (message?.cards?.length) openDeckModal('save', message.cards);
  } else if (button.dataset.action === 'retry-chat') {
    retryChat();
  }
});

elements.chatForm.addEventListener('submit', event => {
  event.preventDefault();
  submitChat();
});

elements.messageInput.addEventListener('input', updateMessageInput);
elements.messageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    elements.chatForm.requestSubmit();
  }
});

elements.attachButton.addEventListener('click', () => elements.fileInput.click());
elements.fileInput.addEventListener('change', () => {
  const file = elements.fileInput.files?.[0];
  if (!file) return;
  const allowedExtensions = ['txt', 'pdf', 'docx'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    showToast('Підтримуються лише .txt, .pdf і .docx', 'error');
    elements.fileInput.value = '';
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast('Файл завеликий. Максимум 10 МБ', 'error');
    elements.fileInput.value = '';
    return;
  }
  appState.selectedFile = file;
  showAttachment();
  updateMessageInput();
  haptic();
});
elements.removeAttachmentButton.addEventListener('click', clearAttachment);

elements.deckModal.addEventListener('click', event => {
  if (event.target === elements.deckModal) closeDeckModal();
});
elements.confirmModal.addEventListener('click', event => {
  if (event.target === elements.confirmModal) closeConfirmModal();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (elements.confirmModal.classList.contains('flex')) closeConfirmModal();
  else if (elements.deckModal.classList.contains('flex')) closeDeckModal();
  else if (appState.drawerOpen) closeDrawer();
});

desktopQuery.addEventListener('change', event => {
  if (event.matches) {
    closeDrawer();
  } else if (appState.editorDeckId) {
    openDrawer();
  }
});

registerTelegramEvents();

if (!appState.decks.some(deck => deck.id === appState.activeDeckId)) {
  appState.activeDeckId = appState.decks[0]?.id || null;
}

setTelegramUser();
renderDecks();
renderMessages();
updateMessageInput();
updateBackButton();
refreshIcons();
