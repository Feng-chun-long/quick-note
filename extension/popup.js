// popup.js — 快捷笔记核心逻辑

const STORAGE_KEY = 'quick_notes_v1';
const $ = (sel) => document.querySelector(sel);

// ---------- 1. 获取当前标签页信息 ----------
let currentTabTitle = '';
let currentTabUrl = '';

async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentTabTitle = tab.title || '';
      currentTabUrl = tab.url || '';
      const host = currentTabUrl.replace(/^https?:\/\//, '').split('/')[0];
      $('#meta').textContent = `📌 ${currentTabTitle || host}${currentTabUrl ? ' · ' + host : ''}`;
      $('#meta').title = currentTabUrl;
    } else {
      $('#meta').textContent = '（未检测到页面）';
    }
  } catch {
    $('#meta').textContent = '（未检测到页面）';
  }
}

// ---------- 2. 存储读写 ----------
async function getAllNotes() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function saveAllNotes(notes) {
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

async function addNote(text) {
  if (!text.trim()) return;
  const notes = await getAllNotes();
  notes.unshift({
    id: Date.now().toString(),
    text: text.trim(),
    title: currentTabTitle,
    url: currentTabUrl,
    time: new Date().toISOString()
  });
  await saveAllNotes(notes);
  render();
}

async function deleteNote(id) {
  const notes = await getAllNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveAllNotes(filtered);
  render();
}

// ---------- 3. 渲染列表 ----------
function formatTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render() {
  const list = $('#list');
  const empty = $('#empty');
  list.innerHTML = '';

  getAllNotes().then(notes => {
    $('#count').textContent = `${notes.length} 条`;

    if (notes.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    notes.forEach(n => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <div class="text"></div>
        <div class="foot">
          <span class="source" title="${n.url || ''}">
            ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener">${n.title || n.url}</a>` : '（无页面）'}
          </span>
          <span style="display:flex;gap:4px;align-items:center">
            <span>${formatTime(n.time)}</span>
            <button class="del" data-id="${n.id}">删除</button>
          </span>
        </div>
      `;
      card.querySelector('.text').textContent = n.text;
      list.appendChild(card);
    });

    // 绑定删除
    list.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('确定删除这条笔记吗？')) deleteNote(id);
      });
    });
  });
}

// ---------- 4. 事件绑定 ----------
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentTab();
  render();

  const input = $('#noteInput');

  // Ctrl/⌘ + Enter 快速保存
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  });

  $('#saveBtn').addEventListener('click', handleSave);
  $('#clearInput').addEventListener('click', () => { input.value = ''; input.focus(); });
});

function handleSave() {
  const input = $('#noteInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  addNote(text);
  input.value = '';
  input.focus();
}
