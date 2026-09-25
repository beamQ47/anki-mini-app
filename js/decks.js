const defaultDecks = [
  {
    id: 'history-ukraine',
    title: 'Історія України',
    modelCss: '.card {\n  font-family: system-ui, sans-serif;\n  font-size: 20px;\n  text-align: center;\n  color: #243044;\n}\n\n#extra {\n  font-size: 15px;\n  color: #64748b;\n}',
    cards: [
      { id: 'history-1', front: 'Коли проголосила незалежність Українська Народна Республіка?', back: '14 грудня 1917 року', extra: 'Це дата входження УНР у фазу формування державності.', createdAt: Date.now() - 86400000 },
      { id: 'history-2', front: 'Яка конституція діяла в УНР у 1918 році?', back: 'Конституція Української Народної Республіки, ухвалена 29 квітня 1918 року Священним Собором Української Православної Церкви.', extra: 'Її часто називають Конституцією Собору Святих.', createdAt: Date.now() - 72000000 },
      { id: 'history-3', front: 'Хто був першим секретарем Центральної Ради?', back: 'Михайло Грушевський', extra: 'Він також очолював першу демократичну Уряд у складі Центральної Ради.', createdAt: Date.now() - 3600000 }
    ],
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'cpp-basic',
    title: 'C++ Basic',
    modelCss: '.card {\n  font-family: ui-monospace, monospace;\n  font-size: 18px;\n  text-align: left;\n  color: #1e293b;\n}\n\n#back {\n  color: #2563eb;\n}',
    cards: [
      { id: 'cpp-1', front: 'Що робить оператор new?', back: 'Виділяє пам’ять для об’єкта та повертає покажчик на цю пам’ять.', extra: 'Після використання пам’ять потрібно звільнити оператором delete.', createdAt: Date.now() - 18000000 },
      { id: 'cpp-2', front: 'Яка різниця між vector та array?', back: 'vector має динамічний розмір і зручні методи, а array має фіксований розмір, відомий під час компіляції.', extra: 'Після створення розмір array змінити не можна.', createdAt: Date.now() - 9000000 },
      { id: 'cpp-3', front: 'Що повертає оператор sizeof?', back: 'Розмір об’єкта або виразу у байтах як std::size_t.', extra: 'Результат sizeof(char) зазвичай дорівнює 1.', createdAt: Date.now() - 3600000 }
    ],
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'osi-model',
    title: 'OSI Model',
    modelCss: '.card {\n  font-family: system-ui, sans-serif;\n  font-size: 20px;\n  text-align: center;\n  color: #172554;\n}\n\n#extra {\n  font-size: 14px;\n}',
    cards: [
      { id: 'osi-1', front: 'Скільки рівнів містить OSI?', back: 'Сім рівнів: прикладний, представлення, сесійний, транспортний, мережевий, канальний і фізичний.', extra: 'OSI — референсна модель міжнародного стандарту ISO 7498.', createdAt: Date.now() - 5400000 },
      { id: 'osi-2', front: 'Який рівень відповідає за маршрутизацію IP-пакетів?', back: 'Мережевий рівень, третій рівень OSI.', extra: 'На ньому працюють протоколи IP, ICMP та маршрутизатори.', createdAt: Date.now() - 1800000 },
      { id: 'osi-3', front: 'Що забезпечує транспортний рівень?', back: 'Надійну або ненадійну доставку даних між процесами, порти та multiplexing.', extra: 'Приклади протоколів: TCP та UDP.', createdAt: Date.now() - 600000 }
    ],
    updatedAt: Date.now() - 600000
  }
];

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultDecks));
}

function isValidDeck(deck) {
  return deck && typeof deck === 'object' && typeof deck.id === 'string' && typeof deck.title === 'string' && Array.isArray(deck.cards);
}

function loadDecks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneDefaults();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return cloneDefaults();
    return parsed.filter(isValidDeck).map(deck => ({
      ...deck,
      modelCss: typeof deck.modelCss === 'string' ? deck.modelCss : '',
      cards: deck.cards.filter(card => card && typeof card === 'object').map(card => ({
        id: typeof card.id === 'string' ? card.id : createId('card'),
        front: String(card.front || ''),
        back: String(card.back || ''),
        extra: String(card.extra || ''),
        createdAt: Number(card.createdAt) || Date.now()
      })),
      updatedAt: Number(deck.updatedAt) || Date.now()
    }));
  } catch (error) {
    return cloneDefaults();
  }
}

function saveDecksLocally() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.decks));
    setStorageStatus('Дані збережено локально', 'success');
    return true;
  } catch (error) {
    setStorageStatus('Не вдалося зберегти локально', 'error');
    showToast('Недостатньо місця для локального збереження', 'error');
    return false;
  }
}

function setStorageStatus(text, type) {
  elements.storageStatusText.textContent = text;
  elements.storageStatusDot.className = `h-2 w-2 rounded-full ${type === 'error' ? 'bg-red-500' : type === 'remote' ? 'bg-blue-500' : 'bg-emerald-500'}`;
}

function getTotalCards() {
  return appState.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
}

function pluralizeCards(value) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'картка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'картки';
  return 'карток';
}

function pluralizeDecks(value) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'колода';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'колоди';
  return 'колод';
}

function renderDecks() {
  elements.deckList.innerHTML = appState.decks.map(deck => {
    const active = deck.id === appState.activeDeckId;
    const initial = deck.title.trim().charAt(0).toUpperCase() || 'A';
    return `
      <article class="deck-option rounded-2xl border ${active ? 'is-selected' : ''} border-telegram-hint/10 p-3.5" data-deck-id="${escapeHtml(deck.id)}">
        <button class="flex w-full items-start gap-3 text-left" type="button" data-action="select-deck" data-deck-id="${escapeHtml(deck.id)}" aria-label="Обрати колоду ${escapeHtml(deck.title)}">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-telegram-button text-telegram-button-text' : 'bg-telegram-link/10 text-telegram-button'} text-sm font-extrabold">${escapeHtml(initial)}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-extrabold">${escapeHtml(deck.title)}</span>
            <span class="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-telegram-hint">
              <i data-lucide="layers-2" class="h-3 w-3" aria-hidden="true"></i>
              ${deck.cards.length} карток · ${formatRelativeDate(deck.updatedAt)}
            </span>
          </span>
          <i data-lucide="check-circle-2" class="h-4 w-4 shrink-0 ${active ? 'text-telegram-button' : 'hidden'}" aria-hidden="true"></i>
        </button>
        <div class="mt-3 grid grid-cols-3 gap-1.5 border-t border-telegram-hint/10 pt-2.5">
          <button class="action-button flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold text-telegram-hint transition hover:bg-telegram-link/8 hover:text-telegram-button" type="button" data-action="edit-deck" data-deck-id="${escapeHtml(deck.id)}" title="Редагувати картки">
            <i data-lucide="pencil" class="h-3.5 w-3.5" aria-hidden="true"></i>
            Редагувати
          </button>
          <button class="action-button flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold text-telegram-hint transition hover:bg-blue-500/8 hover:text-blue-500" type="button" data-action="download-deck" data-deck-id="${escapeHtml(deck.id)}" title="Завантажити .apkg">
            <i data-lucide="download" class="h-3.5 w-3.5" aria-hidden="true"></i>
            .apkg
          </button>
          <button class="action-button flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold text-telegram-hint transition hover:bg-red-500/8 hover:text-red-500" type="button" data-action="delete-deck" data-deck-id="${escapeHtml(deck.id)}" title="Видалити колоду">
            <i data-lucide="trash-2" class="h-3.5 w-3.5" aria-hidden="true"></i>
            Видалити
          </button>
        </div>
      </article>
    `;
  }).join('');

  const totalCards = getTotalCards();
  elements.deckSummary.textContent = `${totalCards} ${pluralizeCards(totalCards)} у ${appState.decks.length} ${pluralizeDecks(appState.decks.length)}`;
  elements.emptyDecksState.classList.toggle('hidden', appState.decks.length > 0);
  refreshIcons(elements.deckList);
}

function showDeckList() {
  appState.editorDeckId = null;
  appState.editorCardId = null;
  elements.editorPanel.classList.add('hidden');
  elements.deckListPanel.classList.remove('hidden');
  updateBackButton();
  renderDecks();
}

function openEditor(deckId) {
  const deck = appState.decks.find(item => item.id === deckId);
  if (!deck) return;
  appState.activeDeckId = deck.id;
  appState.editorDeckId = deck.id;
  appState.editorCardId = deck.cards[0]?.id || null;
  elements.deckListPanel.classList.add('hidden');
  elements.editorPanel.classList.remove('hidden');
  renderEditor();
  renderDecks();
  if (!desktopQuery.matches) openDrawer();
  updateBackButton();
}

function renderEditor() {
  const deck = appState.decks.find(item => item.id === appState.editorDeckId);
  if (!deck) {
    showDeckList();
    return;
  }
  if (!deck.cards.length) {
    appState.editorCardId = null;
    elements.editorDeckTitle.textContent = deck.title;
    elements.editorCardSelect.innerHTML = '<option value="">Немає карток</option>';
    elements.editorCardPosition.textContent = 'Карток 0 з 0';
    elements.editorFront.value = '';
    elements.editorBack.value = '';
    elements.editorExtra.value = '';
    elements.editorModelCss.value = deck.modelCss || '';
    elements.previousCardButton.disabled = true;
    elements.nextCardButton.disabled = true;
    elements.deleteCardButton.disabled = true;
    elements.editorFront.disabled = true;
    elements.editorBack.disabled = true;
    elements.editorExtra.disabled = true;
    elements.saveCardButton.disabled = true;
    return;
  }

  let cardIndex = deck.cards.findIndex(card => card.id === appState.editorCardId);
  if (cardIndex < 0) cardIndex = 0;
  const card = deck.cards[cardIndex];
  appState.editorCardId = card.id;
  elements.editorDeckTitle.textContent = deck.title;
  elements.editorCardSelect.innerHTML = deck.cards.map((item, index) => `<option value="${escapeHtml(item.id)}" ${item.id === card.id ? 'selected' : ''}>Картка ${index + 1} · ${escapeHtml((item.front || 'Без назви').slice(0, 38))}</option>`).join('');
  elements.editorCardPosition.textContent = `Картка ${cardIndex + 1} з ${deck.cards.length}`;
  elements.editorFront.value = card.front || '';
  elements.editorBack.value = card.back || '';
  elements.editorExtra.value = card.extra || '';
  elements.editorModelCss.value = deck.modelCss || '';
  elements.previousCardButton.disabled = cardIndex === 0;
  elements.nextCardButton.disabled = cardIndex === deck.cards.length - 1;
  elements.deleteCardButton.disabled = false;
  elements.editorFront.disabled = false;
  elements.editorBack.disabled = false;
  elements.editorExtra.disabled = false;
  elements.saveCardButton.disabled = false;
}

function navigateEditorCard(direction) {
  const deck = appState.decks.find(item => item.id === appState.editorDeckId);
  if (!deck) return;
  const currentIndex = deck.cards.findIndex(card => card.id === appState.editorCardId);
  const nextIndex = Math.max(0, Math.min(deck.cards.length - 1, currentIndex + direction));
  if (deck.cards[nextIndex]) {
    appState.editorCardId = deck.cards[nextIndex].id;
    renderEditor();
  }
}

async function saveEditorCard() {
  const deck = appState.decks.find(item => item.id === appState.editorDeckId);
  const card = deck?.cards.find(item => item.id === appState.editorCardId);
  if (!deck || !card) return;
  card.front = elements.editorFront.value.trim();
  card.back = elements.editorBack.value.trim();
  card.extra = elements.editorExtra.value.trim();
  deck.modelCss = elements.editorModelCss.value;
  deck.updatedAt = Date.now();
  saveDecksLocally();
  renderDecks();
  renderEditor();
  haptic('success');
  showToast('Картку збережено');
  try {
    const result = await sendToBackend('update_card', {
      deckId: deck.id,
      deckTitle: deck.title,
      card,
      modelCss: deck.modelCss
    });
    if (result.transport === 'remote') setStorageStatus('Синхронізовано з Python API', 'remote');
  } catch (error) {
    showToast('Збережено локально, але API недоступний', 'warning');
  }
}

function addEditorCard() {
  const deck = appState.decks.find(item => item.id === appState.editorDeckId);
  if (!deck) return;
  const card = {
    id: createId('card'),
    front: 'Нове запитання',
    back: 'Нова відповідь',
    extra: '',
    createdAt: Date.now()
  };
  deck.cards.push(card);
  deck.updatedAt = Date.now();
  appState.editorCardId = card.id;
  saveDecksLocally();
  renderEditor();
  renderDecks();
  elements.editorFront.focus();
  elements.editorFront.select();
  haptic();
}

function requestDeleteCard() {
  const deck = appState.decks.find(item => item.id === appState.editorDeckId);
  const card = deck?.cards.find(item => item.id === appState.editorCardId);
  if (!deck || !card) return;
  openConfirmModal('Видалити картку?', `Картку “${(card.front || 'Без назви').slice(0, 80)}” буде видалено з колоди “${deck.title}”.`, async () => {
    const index = deck.cards.findIndex(item => item.id === card.id);
    deck.cards.splice(index, 1);
    appState.editorCardId = deck.cards[Math.max(0, index - 1)]?.id || null;
    deck.updatedAt = Date.now();
    saveDecksLocally();
    renderEditor();
    renderDecks();
    showToast('Картку видалено');
    haptic('success');
    await sendToBackend('delete_card', { deckId: deck.id, cardId: card.id });
  });
}

function createDeck(title) {
  const deck = {
    id: createId('deck'),
    title: title.trim(),
    modelCss: '.card {\n  font-family: system-ui, sans-serif;\n  font-size: 20px;\n  text-align: center;\n}',
    cards: [],
    updatedAt: Date.now()
  };
  appState.decks.unshift(deck);
  appState.activeDeckId = deck.id;
  return deck;
}

function openDeckModal(mode, cards = []) {
  appState.modalMode = mode;
  appState.pendingCards = normalizeCards(cards);
  elements.newDeckName.value = '';
  if (mode === 'create') {
    elements.deckModalTitle.textContent = 'Створити нову колоду';
    elements.deckModalDescription.textContent = 'Додайте назву для нової колоди.';
    elements.saveDeckOptionsWrap.classList.add('hidden');
    elements.newDeckFieldWrap.classList.remove('hidden');
    elements.confirmDeckModalText.textContent = 'Створити';
  } else {
    elements.deckModalTitle.textContent = 'Зберегти картки';
    elements.deckModalDescription.textContent = `Готово до збереження: ${appState.pendingCards.length} ${pluralizeCards(appState.pendingCards.length)}.`;
    elements.saveDeckOptionsWrap.classList.remove('hidden');
    elements.newDeckFieldWrap.classList.remove('hidden');
    elements.confirmDeckModalText.textContent = 'Збережити';
    renderDeckOptions();
  }
  elements.deckModal.classList.remove('hidden');
  elements.deckModal.classList.add('flex');
  window.setTimeout(() => elements.newDeckName.focus(), 80);
}

function closeDeckModal() {
  elements.deckModal.classList.add('hidden');
  elements.deckModal.classList.remove('flex');
  appState.pendingCards = [];
  appState.selectedModalDeckId = null;
}

function renderDeckOptions() {
  if (!appState.decks.length) {
    elements.saveDeckOptions.innerHTML = '<div class="rounded-xl border border-dashed border-telegram-hint/30 p-4 text-center text-xs text-telegram-hint">Наявних колод немає. Створіть нову нижче.</div>';
    appState.selectedModalDeckId = null;
    return;
  }
  if (!appState.decks.some(deck => deck.id === appState.selectedModalDeckId)) {
    appState.selectedModalDeckId = appState.activeDeckId && appState.decks.some(deck => deck.id === appState.activeDeckId)
      ? appState.activeDeckId
      : appState.decks[0].id;
  }
  elements.saveDeckOptions.innerHTML = appState.decks.map(deck => `
    <label class="deck-option flex cursor-pointer items-center gap-3 rounded-xl border border-telegram-hint/10 p-3 ${deck.id === appState.selectedModalDeckId ? 'is-selected' : ''}">
      <input class="sr-only" type="radio" name="targetDeck" value="${escapeHtml(deck.id)}" ${deck.id === appState.selectedModalDeckId ? 'checked' : ''}>
      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-telegram-link/10 text-telegram-button">
        <i data-lucide="layers-3" class="h-4 w-4" aria-hidden="true"></i>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-bold">${escapeHtml(deck.title)}</span>
        <span class="text-[11px] text-telegram-hint">${deck.cards.length} ${pluralizeCards(deck.cards.length)}</span>
      </span>
      <i data-lucide="check-circle-2" class="h-4 w-4 text-telegram-button ${deck.id === appState.selectedModalDeckId ? '' : 'hidden'}" aria-hidden="true"></i>
    </label>
  `).join('');
  refreshIcons(elements.saveDeckOptions);
}

async function confirmDeckModal() {
  if (appState.modalMode === 'create') {
    const title = elements.newDeckName.value.trim();
    if (!title) {
      elements.newDeckName.focus();
      showToast('Введіть назву колоди', 'warning');
      return;
    }
    const deck = createDeck(title);
    saveDecksLocally();
    renderDecks();
    closeDeckModal();
    showToast('Колоду створено');
    haptic('success');
    await sendToBackend('create_deck', { deckId: deck.id, title: deck.title, modelCss: deck.modelCss });
    return;
  }

  let targetDeck;
  const newTitle = elements.newDeckName.value.trim();
  if (newTitle) {
    targetDeck = createDeck(newTitle);
  } else {
    targetDeck = appState.decks.find(deck => deck.id === appState.selectedModalDeckId);
  }
  if (!targetDeck) {
    showToast('Створіть або оберіть колоду', 'warning');
    return;
  }
  const cards = appState.pendingCards.map(card => ({ ...card, id: createId('card'), createdAt: Date.now() }));
  targetDeck.cards.push(...cards);
  targetDeck.updatedAt = Date.now();
  appState.activeDeckId = targetDeck.id;
  saveDecksLocally();
  renderDecks();
  closeDeckModal();
  showToast(`Збережено ${cards.length} ${pluralizeCards(cards.length)}`);
  haptic('success');
  try {
    const result = await sendToBackend('create_cards', {
      deckId: targetDeck.id,
      deckTitle: targetDeck.title,
      cards
    });
    if (result.transport === 'remote') setStorageStatus('Синхронізовано з Python API', 'remote');
  } catch (error) {
    showToast('Картки збережено локально, API недоступний', 'warning');
  }
}

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards
    .filter(card => card && (card.front || card.back))
    .slice(0, 100)
    .map(card => ({
      front: String(card.front || '').trim(),
      back: String(card.back || '').trim(),
      extra: String(card.extra || card.additional || '').trim()
    }))
    .filter(card => card.front && card.back);
}

function requestDeleteDeck(deckId) {
  const deck = appState.decks.find(item => item.id === deckId);
  if (!deck) return;
  openConfirmModal('Видалити колоду?', `Колоду “${deck.title}” та всі ${deck.cards.length} ${pluralizeCards(deck.cards.length)} буде видалено.`, async () => {
    appState.decks = appState.decks.filter(item => item.id !== deckId);
    if (appState.activeDeckId === deckId) appState.activeDeckId = appState.decks[0]?.id || null;
    if (appState.editorDeckId === deckId) showDeckList();
    saveDecksLocally();
    renderDecks();
    showToast('Колоду видалено');
    haptic('success');
    await sendToBackend('delete_deck', { deckId: deck.id, title: deck.title });
  });
}

async function downloadDeck(deckId) {
  const deck = appState.decks.find(item => item.id === deckId);
  if (!deck) return;
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decks/${encodeURIComponent(deck.id)}/export`, {
        method: 'GET',
        headers: getTelegramHeaders()
      });
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizeFileName(deck.title)}.apkg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Файл .apkg завантажено');
      haptic('success');
    } catch (error) {
      showToast('Не вдалося завантажити .apkg', 'error');
    }
    return;
  }
  try {
    const result = await sendToBackend('download_deck', { deckId: deck.id, title: deck.title });
    if (result.transport === 'telegram') {
      haptic('success');
    } else {
      showToast('Для .apkg підключіть Python API або відкрийте Mini App у Telegram', 'warning');
    }
  } catch (error) {
    showToast('Експорт недоступний', 'error');
  }
}

function sanitizeFileName(value) {
  return String(value || 'anki-deck').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim().replace(/\s+/g, '-') || 'anki-deck';
}

function getTelegramHeaders() {
  const headers = {};
  if (tg.initData) headers['X-Telegram-Init-Data'] = tg.initData;
  return headers;
}
