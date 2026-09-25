function renderMarkdown(source) {
  if (!window.marked) {
    return escapeHtml(source).replace(/\n/g, '<br>');
  }
  let html;
  try {
    html = window.marked.parse(String(source || ''), {
      gfm: true,
      breaks: true
    });
  } catch (error) {
    html = escapeHtml(source).replace(/\n/g, '<br>');
  }
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['style']
    });
  }
  return escapeHtml(source).replace(/\n/g, '<br>');
}

function refreshIcons(root = document) {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 }, root });
  }
}

function renderMessages(scrollToEnd = false) {
  elements.messages.innerHTML = appState.messages.map(renderMessage).join('');
  refreshIcons(elements.messages);
  if (scrollToEnd) {
    window.requestAnimationFrame(() => {
      elements.messages.scrollTo({ top: elements.messages.scrollHeight, behavior: 'smooth' });
    });
  }
}

function renderMessage(message) {
  if (message.type === 'loading') {
    return `
      <div class="message-enter mb-5 flex items-start gap-3" data-message-id="${escapeHtml(message.id)}">
        ${renderAssistantAvatar()}
        <div class="min-w-0 max-w-3xl flex-1 rounded-3xl rounded-tl-md border surface bg-telegram-surface p-4 shadow-sm">
          <div class="flex items-center gap-2 text-xs font-bold text-telegram-hint">
            <span class="spinner text-telegram-button"></span>
            <span id="loadingStatus">Аналізую ваш запит…</span>
          </div>
          <div class="mt-4 space-y-2.5">
            <div class="skeleton h-3 w-11/12 rounded-full"></div>
            <div class="skeleton h-3 w-full rounded-full"></div>
            <div class="skeleton h-3 w-4/5 rounded-full"></div>
          </div>
        </div>
      </div>
    `;
  }

  if (message.type === 'error') {
    return `
      <div class="message-enter mb-5 flex items-start gap-3" data-message-id="${escapeHtml(message.id)}">
        ${renderAssistantAvatar()}
        <div class="min-w-0 max-w-3xl flex-1 rounded-3xl rounded-tl-md border border-red-500/20 bg-red-500/5 p-4">
          <div class="flex items-center gap-2 text-sm font-extrabold text-red-500">
            <i data-lucide="circle-alert" class="h-4 w-4" aria-hidden="true"></i>
            Не вдалося отримати відповідь
          </div>
          <p class="mt-2 text-sm text-telegram-hint">${escapeHtml(message.content)}</p>
          <button class="mt-3 flex items-center gap-2 rounded-xl bg-telegram-link/10 px-3 py-2 text-xs font-bold text-telegram-button" type="button" data-action="retry-chat">
            <i data-lucide="rotate-cw" class="h-3.5 w-3.5" aria-hidden="true"></i>
            Спробувати ще
          </button>
        </div>
      </div>
    `;
  }

  if (message.role === 'user') {
    return `
      <div class="message-enter mb-5 flex justify-end pl-8 sm:pl-20" data-message-id="${escapeHtml(message.id)}">
        <div class="max-w-3xl rounded-3xl rounded-br-md px-4 py-3 text-telegram-button-text shadow-sm" style="background: var(--app-button);">
          ${message.attachment ? `<div class="mb-2 flex items-center gap-2 rounded-xl bg-black/10 px-2.5 py-2 text-xs font-semibold"><i data-lucide="paperclip" class="h-3.5 w-3.5" aria-hidden="true"></i><span class="truncate">${escapeHtml(message.attachment.name)}</span></div>` : ''}
          <div class="whitespace-pre-wrap text-sm leading-6">${escapeHtml(message.content)}</div>
          <time class="mt-1.5 block text-right text-[10px] opacity-70">${formatRelativeDate(message.createdAt)}</time>
        </div>
      </div>
    `;
  }

  const cardMarkup = message.type === 'cards' ? renderCards(message) : '';
  return `
    <div class="message-enter mb-5 flex items-start gap-3" data-message-id="${escapeHtml(message.id)}">
      ${renderAssistantAvatar()}
      <div class="min-w-0 max-w-3xl flex-1">
        <div class="mb-1.5 flex items-center gap-2">
          <span class="text-xs font-extrabold">Anki Gemini</span>
          <span class="rounded-full bg-telegram-link/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-telegram-button">AI</span>
        </div>
        <div class="rounded-3xl rounded-tl-md border surface bg-telegram-surface p-4 shadow-sm">
          <div class="markdown">${renderMarkdown(message.content)}</div>
          ${cardMarkup}
        </div>
        <p class="mt-1.5 px-1 text-[10px] text-telegram-hint">${formatRelativeDate(message.createdAt)}</p>
      </div>
    </div>
  `;
}

function renderAssistantAvatar() {
  return `
    <div class="ai-gradient mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-violet-500/15">
      <i data-lucide="sparkles" class="h-4 w-4" aria-hidden="true"></i>
    </div>
  `;
}

function renderCards(message) {
  const cards = Array.isArray(message.cards) ? message.cards : [];
  return `
    <div class="mt-4">
      <div class="grid gap-4 ${cards.length > 1 ? 'md:grid-cols-2' : ''}">
        ${cards.map((card, index) => `
          <div class="flip-card" data-card-index="${index}" data-message-id="${escapeHtml(message.id)}">
            <div class="flip-card-inner">
              <div class="flip-face front">
                <div class="relative z-[1] flex items-center justify-between gap-2">
                  <span class="rounded-full bg-telegram-link/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-telegram-button">Front · ${index + 1}</span>
                  <i data-lucide="layers-3" class="h-4 w-4 text-telegram-hint" aria-hidden="true"></i>
                </div>
                <div class="card-content text-base font-extrabold leading-6">${escapeHtml(card.front)}</div>
                <div class="relative z-[1] flex items-center justify-between gap-3 text-[10px] font-semibold text-telegram-hint">
                  <span>Натисніть, щоб перевернути</span>
                  <i data-lucide="rotate-3d" class="h-4 w-4" aria-hidden="true"></i>
                </div>
              </div>
              <div class="flip-face back">
                <div class="relative z-[1] flex items-center justify-between gap-2">
                  <span class="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Back</span>
                  <i data-lucide="check-circle-2" class="h-4 w-4 text-emerald-500" aria-hidden="true"></i>
                </div>
                <div class="card-content text-sm font-bold leading-6">${escapeHtml(card.back)}</div>
                ${card.extra ? `<div class="card-extra relative z-[1]">${escapeHtml(card.extra)}</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="primary-button mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold shadow-sm transition hover:brightness-95" type="button" data-action="save-message-cards" data-message-id="${escapeHtml(message.id)}">
        <i data-lucide="bookmark-plus" class="h-4 w-4" aria-hidden="true"></i>
        Зберегти в мої колоди · ${cards.length}
      </button>
    </div>
  `;
}

function updateMessageInput() {
  elements.messageInput.style.height = 'auto';
  const nextHeight = Math.min(elements.messageInput.scrollHeight, 160);
  elements.messageInput.style.height = `${nextHeight}px`;
  elements.sendButton.disabled = !elements.messageInput.value.trim() && !appState.selectedFile;
}

async function getAssistantReply(text, file) {
  if (API_BASE_URL) {
    const form = new FormData();
    form.append('message', text);
    form.append('history', JSON.stringify(appState.messages.slice(-10).map(message => ({
      role: message.role,
      content: message.type === 'text' || message.type === 'cards' ? message.content : ''
    }))));
    if (file) form.append('document', file);
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getTelegramHeaders(),
      body: form
    });
    if (!response.ok) throw new Error('Chat request failed');
    const payload = await response.json();
    const cards = normalizeCards(payload.cards || (payload.message ? extractCardsFromText(payload.message) : []));
    return {
      content: String(payload.reply || payload.message || 'Готово.'),
      cards
    };
  }
  await new Promise(resolve => window.setTimeout(resolve, 1100));
  return createDemoReply(text);
}

function extractCardsFromText(text) {
  if (!text) return [];
  const candidates = [];
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  const trimmed = String(text).trim();
  candidates.push(trimmed);
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate.trim());
      const cards = Array.isArray(parsed) ? parsed : parsed.cards;
      const normalized = normalizeCards(cards);
      if (normalized.length) return normalized;
    } catch (error) {
      continue;
    }
  }
  return [];
}

function createDemoReply(text) {
  const parsedCards = extractCardsFromText(text);
  if (parsedCards.length) {
    return {
      content: `### Знайдено ${parsedCards.length} ${pluralizeCards(parsedCards.length)}\n\nJSON успішно перетворено на інтерактивне прев’ю. Перевірте відповіді та збережіть матеріал у колоду.`,
      cards: parsedCards
    };
  }

  const normalized = text.toLowerCase();
  const wantsCards = /карт|flash|анкі|anki|запам'ят|запам’ятати|quiz|тест/.test(normalized);
  if (wantsCards) {
    let cards;
    if (/c\+\+|cpp|компілятор|компіляц/.test(normalized)) {
      cards = [
        { front: 'Яка різниця між компілятором та інтерпретатором?', back: 'Компілятор перетворює код у машинний або проміжковий код заздалегідь, а інтерпретатор виконує інструкції під час роботи програми.', extra: 'C++ зазвичай компілюється, але може виконуватися через JIT-компілятори.' },
        { front: 'Що робить оператор new у C++?', back: 'Він виділяє пам’ять для об’єкта та повертає покажчик на цю пам’ять.', extra: 'Виділену пам’ять потрібно звільнити за допомогою delete.' },
        { front: 'Чому vector кращий за array для динамічних даних?', back: 'vector може змінювати свій розмір під час виконання, а розмір array фіксований під час компіляції.', extra: 'Використовуйте reserve(), якщо відома приблизна кількість елементів.' }
      ];
    } else if (/osi|мереж|модел/.test(normalized)) {
      cards = [
        { front: 'Скільки рівнів має модель OSI?', back: 'Сім рівнів: прикладний, представлення, сесійний, транспортний, мережевий, канальний і фізичний.', extra: 'ISO 7498-1 описує цю референсну модель.' },
        { front: 'На якому рівні OSI працює TCP?', back: 'На транспортному, четвертому рівні.', extra: 'UDP також працює на транспортному рівні, але не гарантує доставку.' }
      ];
    } else if (/істор|україн/.test(normalized)) {
      cards = [
        { front: 'Коли проголосила незалежність УНР?', back: '14 грудня 1917 року.', extra: 'Це свято Державності та Незалежності України.' },
        { front: 'Хто очолював Центральну Раду?', back: 'Михайло Грушевський — голова Центральної Ради та перший секретар УНР.', extra: 'Українська Православна Церква відіграла важливу роль у формуванні УНР.' }
      ];
    } else {
      const topic = text.replace(/^(створи|зроби|згенеруй|складай)?\s*(мені\s*)?\d*\s*(карт[аиу]|flash\s*cards?)\s*(з|для|на)?\s*/i, '').trim() || 'обрана тема';
      cards = [
        { front: `Що є ключовим поняттям теми «${topic.slice(0, 90)}»?`, back: `Визначте головну ідею теми «${topic.slice(0, 90)}» та використайте її як коротку відповідь.`, extra: 'Добрий метод: одне питання — одна думка — один конкретний приклад.' },
        { front: `Який практичний приклад теми «${topic.slice(0, 90)}»?`, back: `Опишіть короткий приклад за схемою: умова → дія → результат.`, extra: 'Додайте власний приклад, якщо в підручнику його недостатньо.' }
      ];
    }
    return {
      content: `### Готові картки\nЯ створила **${cards.length} ${pluralizeCards(cards.length)}** за вашим запитом. Натисніть на картку для перегляду відповіді або збережіть їх у колоду.`,
      cards: normalizeCards(cards)
    };
  }

  const topic = text.trim().replace(/\s+/g, ' ').slice(0, 160) || 'вашу тему';
  return {
    content: `## Короткий конспект\n\n### ${topic}\n\n1. **Розділіть тему на логічні блоки.** Спочатку визначте головну думку, потім — терміни та приклади.\n2. **Перетворіть факти на питання.** Кожна картка має перевіряти одну конкретну ідею.\n3. **Додайте контекст.** Коротке пояснення допомагає не втрачати зв’язок між фактами.\n4. **Перевірте точність.** Уникайте двозначних формулювань і надто довгих відповідей.\n\n> Порада: надішліть JSON у форматі \`[{"front":"Питання","back":"Відповідь","extra":"Нотатка"}]\`, і я покажу готове flip-прев’ю.`,
    cards: []
  };
}

async function submitChat() {
  const text = elements.messageInput.value.trim();
  const file = appState.selectedFile;
  if (!text && !file) return;
  const userMessage = {
    id: createId('message'),
    role: 'user',
    type: 'text',
    content: text || 'Проаналізуй прикріплений документ',
    attachment: file ? { name: file.name, size: file.size } : null,
    createdAt: Date.now()
  };
  const loadingMessage = {
    id: createId('loading'),
    role: 'assistant',
    type: 'loading',
    createdAt: Date.now()
  };
  appState.messages.push(userMessage, loadingMessage);
  if (appState.messages.length > 60) appState.messages.splice(0, appState.messages.length - 60);
  elements.messageInput.value = '';
  appState.selectedFile = null;
  clearAttachment();
  updateMessageInput();
  renderMessages(true);
  haptic();
  try {
    const response = await getAssistantReply(text || 'Проаналізуй прикріплений документ', file);
    const index = appState.messages.findIndex(message => message.id === loadingMessage.id);
    appState.messages.splice(index, 1, {
      id: createId('message'),
      role: 'assistant',
      type: response.cards.length ? 'cards' : 'text',
      content: response.content,
      cards: response.cards,
      createdAt: Date.now()
    });
    renderMessages(true);
    haptic('success');
  } catch (error) {
    const index = appState.messages.findIndex(message => message.id === loadingMessage.id);
    appState.messages.splice(index, 1, {
      id: createId('error'),
      role: 'assistant',
      type: 'error',
      content: 'Перевірте з’єднання з Python-бекендом і спробуйте запит ще раз.',
      createdAt: Date.now()
    });
    renderMessages(true);
    showToast('Сталася помилка генерації', 'error');
    haptic('error');
  }
}

function retryChat() {
  const lastUserMessage = [...appState.messages].reverse().find(message => message.role === 'user');
  if (!lastUserMessage) return;
  appState.messages = appState.messages.filter(message => message.type !== 'error');
  elements.messageInput.value = lastUserMessage.content;
  updateMessageInput();
  renderMessages(true);
}

function showAttachment() {
  const file = appState.selectedFile;
  if (!file) {
    elements.attachmentPreview.classList.add('hidden');
    elements.attachmentPreview.classList.remove('flex');
    return;
  }
  elements.attachmentName.textContent = file.name;
  elements.attachmentSize.textContent = formatBytes(file.size);
  elements.attachmentPreview.classList.remove('hidden');
  elements.attachmentPreview.classList.add('flex');
}

function clearAttachment() {
  elements.fileInput.value = '';
  showAttachment();
  updateMessageInput();
}
