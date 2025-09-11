import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 检查网盘资源是否与查询关键词相关
 * @param resource 网盘资源
 * @param query 查询关键词
 * @returns 是否相关
 */
function isResourceRelevant(resource: any, query: string): boolean {
  if (!query) return true;
  
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return true;
  
  // 检查标题是否包含关键词
  if (resource.title && resource.title.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  // 检查文件名是否包含关键词
  if (resource.filename && resource.filename.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  // 检查描述是否包含关键词
  if (resource.desc && resource.desc.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  return false;
}

/**
 * 过滤网盘搜索结果
 * @param data 原始搜索数据
 * @param query 查询关键词
 * @returns 过滤后的数据
 */
function filterNetDiskResults(data: any, query: string): any {
  if (!query || !data || !data.merged_by_type) {
    return data;
  }
  
  const filteredData: any = {
    ...data,
    merged_by_type: {}
  };
  
  // 遍历每种网盘类型的结果
  for (const [type, resources] of Object.entries(data.merged_by_type)) {
    if (Array.isArray(resources)) {
      // 过滤与查询关键词相关的结果
      const filteredResources = (resources as any[]).filter(resource => 
        isResourceRelevant(resource, query)
      );
      
      // 只有当过滤后还有结果时才保留该类型
      if (filteredResources.length > 0) {
        filteredData.merged_by_type[type] = filteredResources;
      }
    } else {
      // 如果不是数组，直接保留
      filteredData.merged_by_type[type] = resources;
    }
  }
  
  // 更新总数
  let total = 0;
  for (const resources of Object.values(filteredData.merged_by_type)) {
    if (Array.isArray(resources)) {
      total += resources.length;
    }
  }
  filteredData.total = total;
  
  return filteredData;
}

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '搜索关键词不能为空' }, { status: 400 });
  }

  const config = await getConfig();
  const netDiskConfig = config.NetDiskConfig;

  // 检查是否启用网盘搜索 - 必须在缓存检查之前
  if (!netDiskConfig?.enabled) {
    return NextResponse.json({ error: '网盘搜索功能未启用' }, { status: 400 });
  }

  if (!netDiskConfig?.pansouUrl) {
    return NextResponse.json({ error: 'PanSou服务地址未配置' }, { status: 400 });
  }

  // 网盘搜索缓存：30分钟
  const NETDISK_CACHE_TIME = 30 * 60; // 30分钟（秒）
  const enabledCloudTypesStr = (netDiskConfig.enabledCloudTypes || []).sort().join(',');
  // 缓存key包含功能状态，确保功能开启/关闭时缓存隔离
  const cacheKey = `netdisk-search-enabled-${query}-${enabledCloudTypesStr}`;
  
  console.log(`🔍 检查网盘搜索缓存: ${cacheKey}`);
  
  // 服务端直接调用数据库（不用ClientCache，避免HTTP循环调用）
  try {
    const cached = await db.getCache(cacheKey);
    if (cached) {
      console.log(`✅ 网盘搜索缓存命中(数据库): "${query}" (${enabledCloudTypesStr})`);
      return NextResponse.json({
        ...cached,
        fromCache: true,
        cacheSource: 'database',
        cacheTimestamp: new Date().toISOString()
      });
    }
    
    console.log(`❌ 网盘搜索缓存未命中: "${query}" (${enabledCloudTypesStr})`);
  } catch (cacheError) {
    console.warn('网盘搜索缓存读取失败:', cacheError);
    // 缓存失败不影响主流程，继续执行
  }

  try {
    // 调用PanSou服务
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), (netDiskConfig.timeout || 30) * 1000);

    const pansouResponse = await fetch(`${netDiskConfig.pansouUrl}/api/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'LunaTV/1.0'
      },
      signal: controller.signal,
      body: JSON.stringify({
        kw: query,
        res: 'merge',
        cloud_types: netDiskConfig.enabledCloudTypes || ['baidu', 'aliyun', 'quark', 'tianyi', 'uc']
      })
    });

    clearTimeout(timeout);

    if (!pansouResponse.ok) {
      throw new Error(`PanSou服务响应错误: ${pansouResponse.status} ${pansouResponse.statusText}`);
    }

    const result = await pansouResponse.json();
    
    // 过滤与查询关键词不相关的结果
    const filteredData = filterNetDiskResults(result.data, query);
    
    // 统一返回格式
    const responseData = {
      success: true,
      data: {
        ...filteredData,
        source: 'pansou',
        query: query,
        timestamp: new Date().toISOString()
      }
    };

    // 服务端直接保存到数据库（不用ClientCache，避免HTTP循环调用）
    try {
      await db.setCache(cacheKey, responseData, NETDISK_CACHE_TIME);
      console.log(`💾 网盘搜索结果已缓存(数据库): "${query}" - ${responseData.data.total} 个结果, TTL: ${NETDISK_CACHE_TIME}s`);
    } catch (cacheError) {
      console.warn('网盘搜索缓存保存失败:', cacheError);
    }

    console.log(`✅ 网盘搜索完成: "${query}" - ${responseData.data.total} 个结果`);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('网盘搜索失败:', error);
    
    let errorMessage = '网盘搜索失败';
    if (error.name === 'AbortError') {
      errorMessage = '网盘搜索请求超时';
    } else if (error.message) {
      errorMessage = `网盘搜索失败: ${error.message}`;
    }

    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      suggestion: '请检查PanSou服务是否正常运行或联系管理员'
    }, { status: 500 });
  }
}