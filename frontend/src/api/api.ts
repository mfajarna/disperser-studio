import localforage from 'localforage';

const BASE_URL = 'http://localhost:5001';

const db = localforage.createInstance({
  name: 'DisperserDB',
  storeName: 'audioQueue'
});

const historyDb = localforage.createInstance({
  name: 'DisperserDB',
  storeName: 'youtubeHistory'
});

export const api = {
  // History Store
  async getHistory() {
    const list: any[] = [];
    await historyDb.iterate((val) => { list.push(val); });
    // Keep only the 10 most recent
    const sorted = list.sort((a, b) => b.createdAt - a.createdAt);
    if (sorted.length > 10) {
      const toRemove = sorted.slice(10);
      for (const item of toRemove) {
        await historyDb.removeItem(item.id);
      }
      return sorted.slice(0, 10);
    }
    return sorted;
  },

  async addToHistory(title: string, ytUrl: string, buffer: Uint8Array) {
    const id = Math.random().toString(36).substring(7);
    const item = { id, title, ytUrl, buffer, createdAt: Date.now() };
    await historyDb.setItem(id, item);
    return item;
  },

  async clearHistory() {
    await historyDb.clear();
  },

  // Queue Store
  async getQueue() {
    const list: any[] = [];
    await db.iterate((val) => { list.push(val); });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addToQueue(name: string, description: string, buffer: Uint8Array) {
    const id = Math.random().toString(36).substring(7);
    const item = { id, name, description, buffer, status: 'pending', createdAt: Date.now() };
    await db.setItem(id, item);
    return item;
  },

  async updateItem(id: string, data: any) {
    const item: any = await db.getItem(id);
    if (item) await db.setItem(id, { ...item, ...data });
  },

  async deleteItem(id: string) {
    await db.removeItem(id);
  },

  async getItemBuffer(id: string) {
    const item: any = await db.getItem(id);
    return item?.buffer;
  },

  // Remote Services
  async ytDownload(url: string) {
    const res = await fetch(`${BASE_URL}/api/youtube/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Download failed');
    }
    const title = decodeURIComponent(res.headers.get('X-Audio-Title') || 'audio');
    const buffer = await res.arrayBuffer();
    return { title, buffer: new Uint8Array(buffer) };
  },

  async robloxUpload(name: string, desc: string, buffer: Uint8Array) {
    const key = localStorage.getItem('disperser_key');
    const userId = localStorage.getItem('disperser_user_id');
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const form = new FormData();
    form.append('apiKey', key || '');
    form.append('userId', userId || '');
    form.append('name', name);
    form.append('description', desc);
    form.append('file', blob, 'audio.wav');

    const res = await fetch(`${BASE_URL}/api/roblox/upload`, {
      method: 'POST',
      body: form
    });
    return await res.json();
  },

  async checkOperation(opId: string) {
    const key = localStorage.getItem('disperser_key');
    const res = await fetch(`${BASE_URL}/api/roblox/operation/${opId}?apiKey=${key}`);
    return await res.json();
  },

  async getAssetMeta(assetId: string) {
    const key = localStorage.getItem('disperser_key');
    const res = await fetch(`${BASE_URL}/api/roblox/asset/${assetId}?apiKey=${key}`);
    return await res.json();
  }
};
