(() => {
  const STORAGE_KEY = 'todo.tasks.v1';
  const PREFS_KEY = 'todo.prefs.v1';
  const THEME_KEY = 'todo.theme.v1';

  /** @typedef {{
   *  id: string,
   *  title: string,
   *  notes: string,
   *  completed: boolean,
   *  createdAt: number,
   *  updatedAt: number
   * }} Task
   */

  /** @type {Task[]} */
  let tasks = loadTasks();

  const prefs = loadPrefs();

  const elements = {
    themeToggle: document.getElementById('themeToggle'),
    addForm: document.getElementById('addForm'),
    newTitle: document.getElementById('newTitle'),
    newNotes: document.getElementById('newNotes'),
    list: document.getElementById('list'),
    count: document.getElementById('count'),
    search: document.getElementById('search'),
    sort: document.getElementById('sort'),
    filterButtons: Array.from(document.querySelectorAll('.filters .filter')),
    toggleAll: document.getElementById('toggleAll'),
    clearCompleted: document.getElementById('clearCompleted'),
  };

  // Initialize UI state
  applyTheme(prefs.theme);
  setFilterActive(prefs.filter);
  elements.search.value = prefs.search;
  elements.sort.value = prefs.sort;

  // Attach listeners
  elements.addForm.addEventListener('submit', onAddSubmit);
  elements.list.addEventListener('click', onListClick);
  elements.list.addEventListener('change', onListChange);
  elements.search.addEventListener('input', onSearch);
  elements.sort.addEventListener('change', onSortChange);
  elements.filterButtons.forEach(btn => btn.addEventListener('click', onFilterClick));
  elements.toggleAll.addEventListener('click', onToggleAll);
  elements.clearCompleted.addEventListener('click', onClearCompleted);
  elements.themeToggle.addEventListener('click', onThemeToggle);

  render();

  function onAddSubmit(event) {
    event.preventDefault();
    const title = elements.newTitle.value.trim();
    const notes = elements.newNotes.value.trim();
    if (!title) return;
    const now = Date.now();
    const task = {
      id: generateId(),
      title,
      notes,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(task);
    saveTasks();
    elements.addForm.reset();
    render();
  }

  function onListClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const item = target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete')) {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
      return;
    }

    if (target.classList.contains('edit')) {
      enterEditMode(id);
      return;
    }

    if (target.classList.contains('save')) {
      const titleInput = item.querySelector('.edit-title');
      const notesInput = item.querySelector('.edit-notes');
      const title = (titleInput?.value || '').trim();
      const notes = (notesInput?.value || '').trim();
      if (!title) {
        alert('タイトルは必須です');
        return;
      }
      const t = tasks.find(t => t.id === id);
      if (!t) return;
      t.title = title;
      t.notes = notes;
      t.updatedAt = Date.now();
      saveTasks();
      render();
      return;
    }

    if (target.classList.contains('cancel')) {
      render();
      return;
    }
  }

  function onListChange(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const item = target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    if (target.classList.contains('toggle')) {
      const t = tasks.find(t => t.id === id);
      if (!t) return;
      t.completed = !t.completed;
      t.updatedAt = Date.now();
      saveTasks();
      render();
    }
  }

  function onSearch() {
    prefs.search = elements.search.value;
    savePrefs();
    render();
  }

  function onSortChange() {
    prefs.sort = elements.sort.value;
    savePrefs();
    render();
  }

  function onFilterClick(event) {
    const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
    prefs.filter = button.dataset.filter || 'all';
    savePrefs();
    setFilterActive(prefs.filter);
    render();
  }

  function onToggleAll() {
    const hasActive = tasks.some(t => !t.completed);
    const now = Date.now();
    tasks = tasks.map(t => ({ ...t, completed: hasActive ? true : false, updatedAt: now }));
    saveTasks();
    render();
  }

  function onClearCompleted() {
    const before = tasks.length;
    tasks = tasks.filter(t => !t.completed);
    if (tasks.length !== before) {
      saveTasks();
      render();
    }
  }

  function enterEditMode(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const li = elements.list.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    li.innerHTML = '';
    const editor = document.createElement('div');
    editor.className = 'editor';
    editor.innerHTML = `
      <div class="row">
        <input class="text edit-title" value="${escapeHtml(t.title)}" placeholder="タイトル" />
      </div>
      <div class="row">
        <textarea class="text edit-notes" placeholder="メモ（任意）">${escapeHtml(t.notes)}</textarea>
      </div>
      <div class="buttons">
        <button class="primary save">保存</button>
        <button class="secondary cancel">キャンセル</button>
      </div>
    `;
    li.appendChild(editor);

    const titleInput = li.querySelector('.edit-title');
    titleInput?.focus();
    titleInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        const saveBtn = li.querySelector('.save');
        saveBtn && saveBtn.click();
      }
      if (e.key === 'Escape') {
        const cancelBtn = li.querySelector('.cancel');
        cancelBtn && cancelBtn.click();
      }
    });
  }

  function render() {
    const query = prefs.search.trim().toLowerCase();
    const filtered = tasks.filter(t => {
      if (prefs.filter === 'active' && t.completed) return false;
      if (prefs.filter === 'completed' && !t.completed) return false;
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        (t.notes || '').toLowerCase().includes(query)
      );
    });

    const sorted = sortTasks(filtered, prefs.sort);

    elements.list.innerHTML = '';
    for (const t of sorted) {
      const li = document.createElement('li');
      li.className = `todo-item${t.completed ? ' completed' : ''}`;
      li.dataset.id = t.id;
      li.innerHTML = `
        <input type="checkbox" class="toggle" ${t.completed ? 'checked' : ''} aria-label="完了" />
        <div class="view">
          <div class="title">${escapeHtml(t.title)}</div>
          ${t.notes ? `<div class="notes">${escapeHtml(t.notes)}</div>` : ''}
        </div>
        <div class="actions">
          <button class="secondary edit">編集</button>
          <button class="secondary delete">削除</button>
        </div>
      `;
      elements.list.appendChild(li);
    }

    const remaining = tasks.filter(t => !t.completed).length;
    elements.count.textContent = `${remaining} 件の未完了 / 全 ${tasks.length}`;
  }

  function sortTasks(list, key) {
    const arr = [...list];
    switch (key) {
      case 'created_asc':
        return arr.sort((a, b) => a.createdAt - b.createdAt);
      case 'created_desc':
        return arr.sort((a, b) => b.createdAt - a.createdAt);
      case 'title_asc':
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      case 'completed_first':
        return arr.sort((a, b) => Number(b.completed) - Number(a.completed));
      case 'updated_desc':
      default:
        return arr.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }

  function onThemeToggle() {
    const next = cycleTheme(prefs.theme);
    prefs.theme = next;
    savePrefs();
    applyTheme(next);
  }

  function cycleTheme(current) {
    if (current === 'system') return 'dark';
    if (current === 'dark') return 'light';
    return 'system';
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    updateThemeToggleIcon(mode);
  }

  function updateThemeToggleIcon(mode) {
    elements.themeToggle.textContent = mode === 'dark' ? '🌙' : mode === 'light' ? '🌞' : '🌓';
    elements.themeToggle.title = `テーマ: ${mode === 'dark' ? 'ダーク' : mode === 'light' ? 'ライト' : 'システム'}`;
  }

  function setFilterActive(filter) {
    elements.filterButtons.forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(Boolean).map(normalizeTask);
    } catch {
      return [];
    }
  }

  function normalizeTask(obj) {
    return {
      id: String(obj.id || generateId()),
      title: String(obj.title || ''),
      notes: String(obj.notes || ''),
      completed: Boolean(obj.completed),
      createdAt: Number(obj.createdAt || Date.now()),
      updatedAt: Number(obj.updatedAt || Date.now()),
    };
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      const defaults = { filter: 'all', search: '', sort: 'updated_desc', theme: loadThemePref() };
      if (!raw) return defaults;
      const data = JSON.parse(raw) || {};
      return { ...defaults, ...data };
    } catch {
      return { filter: 'all', search: '', sort: 'updated_desc', theme: loadThemePref() };
    }
  }

  function savePrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function loadThemePref() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();

