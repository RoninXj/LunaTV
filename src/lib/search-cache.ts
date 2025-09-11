import { db } from '@/lib/db';

/**
 * 清除所有搜索缓存
 */
export async function clearAllSearchCache(): Promise<void> {
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
    
    // 过滤出所有搜索相关的缓存键
    const searchKeys = allKeys.filter(key => 
      key.startsWith('search-') || 
      key.startsWith('netdisk-search-') || 
      key.startsWith('youtube-search-')
    );
    
    // 删除所有搜索缓存项
    for (const key of searchKeys) {
      await db.deleteCache(key);
    }
    
    console.log(`✅ 已清除 ${searchKeys.length} 个搜索缓存项`);
  } catch (error) {
    console.error('清除搜索缓存失败:', error);
  }
}

/**
 * 清除特定查询的搜索缓存
 */
export async function clearSearchCacheByQuery(query: string): Promise<void> {
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
    
    // 过滤出与特定查询相关的缓存键
    const queryKeys = allKeys.filter(key => 
      key.includes(encodeURIComponent(query))
    );
    
    // 删除匹配的缓存项
    for (const key of queryKeys) {
      await db.deleteCache(key);
    }
    
    console.log(`✅ 已清除 ${queryKeys.length} 个与查询"${query}"相关的缓存项`);
  } catch (error) {
    console.error(`清除查询"${query}"的缓存失败:`, error);
  }
}

/**
 * 获取缓存的搜索页面结果
 * @param sourceKey 源键
 * @param query 查询
 * @param page 页码
 * @returns 缓存的结果或null
 */
export function getCachedSearchPage(
  sourceKey: string,
  query: string,
  page: number
): any | null {
  // 实现获取缓存的逻辑
  return null;
}

/**
 * 设置缓存的搜索页面结果
 * @param sourceKey 源键
 * @param query 查询
 * @param page 页码
 * @param status 状态
 * @param data 数据
 * @param pageCount 页数
 */
export function setCachedSearchPage(
  sourceKey: string,
  query: string,
  page: number,
  status: string,
  data: any,
  pageCount?: number
): void {
  // 实现设置缓存的逻辑
}