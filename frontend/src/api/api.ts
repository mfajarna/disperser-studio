import localforage from 'localforage';
import { supabase } from './supabase';

const BASE_URL = 'http://localhost:5001';

// Using Supabase for audioQueue now.
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
    try {
      const { data, error } = await supabase
        .from('audio_library')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase fetch error:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        createdAt: item.created_at,
        assetId: item.asset_id,
        operationPath: item.operation_path,
        errorMessage: item.error_message,
      }));
    } catch (e) {
      console.error('Failed to fetch from Supabase. Is the URL correct?', e);
      return [];
    }
  },

  async addToQueue(name: string, description: string, buffer: Uint8Array) {
    const id = crypto.randomUUID();
    const filePath = `audio_${id}.wav`;
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(filePath, buffer, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw uploadError;
    }

    // Insert metadata to Supabase DB
    const item = { 
      id, 
      name, 
      description, 
      status: 'pending', 
      file_path: filePath 
    };
    
    const { error: dbError } = await supabase
      .from('audio_library')
      .insert([item]);
      
    if (dbError) {
      console.error('Supabase DB insert error:', dbError);
      throw dbError;
    }
    
    return { ...item, createdAt: Date.now() }; // approximate createdAt for immediate UI usage
  },

  async updateItem(id: string, data: any) {
    const updatePayload: any = { ...data };
    if (data.assetId !== undefined) updatePayload.asset_id = data.assetId;
    if (data.operationPath !== undefined) updatePayload.operation_path = data.operationPath;
    if (data.errorMessage !== undefined) updatePayload.error_message = data.errorMessage;
    
    delete updatePayload.assetId;
    delete updatePayload.operationPath;
    delete updatePayload.errorMessage;
    delete updatePayload.createdAt;

    const { error } = await supabase
      .from('audio_library')
      .update(updatePayload)
      .eq('id', id);
      
    if (error) console.error('Supabase DB update error:', error);
  },

  async deleteItem(id: string) {
    // 1. Get file_path
    const { data: item } = await supabase
      .from('audio_library')
      .select('file_path')
      .eq('id', id)
      .single();
      
    // 2. Delete from storage if exists
    if (item?.file_path) {
      await supabase.storage.from('audios').remove([item.file_path]);
    }
    
    // 3. Delete from DB
    await supabase.from('audio_library').delete().eq('id', id);
  },

  async getItemBuffer(id: string) {
    const { data: item } = await supabase
      .from('audio_library')
      .select('file_path')
      .eq('id', id)
      .single();
      
    if (!item?.file_path) return null;
    
    const { data, error } = await supabase.storage
      .from('audios')
      .download(item.file_path);
      
    if (error || !data) {
      console.error('Supabase storage download error:', error);
      return null;
    }
    
    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
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
