import { db } from '@/lib/db';

/**
 * 清除YouTube搜索缓存
 * @param query 搜索关键词（可选，如果不提供则清除所有YouTube缓存）
 */
export async function clearYouTubeSearchCache(query?: string): Promise<void> {
  try {
    // 通过storage访问底层存储来获取所有键
    const storage: any = (db as any).storage;
    let allKeys: string[] = [];
    
    // 根据不同的存储类型获取所有键
    if (storage && typeof storage.client?.keys === 'function') {
      // Redis存储
      allKeys = await storage.client.keys('*');
    } else if (typeof storage?.getAllKeys === 'function') {
      // 如果storage有getAllKeys方法
      allKeys = await storage.getAllKeys();
    } else {
      // 其他情况，无法获取所有键，直接返回
      console.warn('无法获取所有缓存键，跳过清除操作');
      return;
    }
    
    // 过滤出YouTube搜索相关的缓存键
    const youtubeCacheKeys = allKeys.filter(key => 
      key.startsWith('youtube-search-')
    );
    
    // 如果提供了查询词，进一步过滤
    let keysToClear = youtubeCacheKeys;
    if (query) {
      keysToClear = youtubeCacheKeys.filter(key => 
        key.includes(encodeURIComponent(query))
      );
    }
    
    // 删除匹配的缓存项
    for (const key of keysToClear) {
      await db.deleteCache(key);
    }
    
    console.log(`✅ 已清除 ${keysToClear.length} 个YouTube搜索缓存项`);
  } catch (error) {
    console.error('清除YouTube搜索缓存失败:', error);
  }
}

/**
 * 清除所有YouTube相关缓存
 */
export async function clearAllYouTubeCache(): Promise<void> {
  try {
    // 通过storage访问底层存储来获取所有键
    const storage: any = (db as any).storage;
    let allKeys: string[] = [];
    
    // 根据不同的存储类型获取所有键
    if (storage && typeof storage.client?.keys === 'function') {
      // Redis存储
      allKeys = await storage.client.keys('*');
    } else if (typeof storage?.getAllKeys === 'function') {
      // 如果storage有getAllKeys方法
      allKeys = await storage.getAllKeys();
    } else {
      // 其他情况，无法获取所有键，直接返回
      console.warn('无法获取所有缓存键，跳过清除操作');
      return;
    }
    
    // 过滤出所有YouTube相关的缓存键
    const youtubeKeys = allKeys.filter(key => 
      key.startsWith('youtube-')
    );
    
    // 删除所有YouTube缓存项
    for (const key of youtubeKeys) {
      await db.deleteCache(key);
    }
    
    console.log(`✅ 已清除 ${youtubeKeys.length} 个YouTube相关缓存项`);
  } catch (error) {
    console.error('清除YouTube缓存失败:', error);
  }
}