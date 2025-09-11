/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getAvailableApiSites, getCacheTime, getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import { yellowWords } from '@/lib/yellow';

export const runtime = 'nodejs';

/**
 * 检查搜索结果是否与查询关键词相关
 * @param result 搜索结果
 * @param query 查询关键词
 * @returns 是否相关
 */
function isResultRelevant(result: any, query: string): boolean {
  if (!query) return true;
  
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return true;
  
  // 检查标题是否包含关键词
  if (result.title && result.title.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  // 检查类型名称是否包含关键词
  if (result.type_name && result.type_name.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  // 检查分类是否包含关键词
  if (result.class && result.class.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  // 检查年份是否匹配（如果是4位数字）
  if (trimmedQuery.match(/^\d{4}$/) && result.year === trimmedQuery) {
    return true;
  }
  
  // 检查描述是否包含关键词
  if (result.desc && result.desc.toLowerCase().includes(trimmedQuery)) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    const cacheTime = await getCacheTime();
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  }

  const config = await getConfig();
  const apiSites = await getAvailableApiSites(authInfo.username);

  // 添加超时控制和错误处理，避免慢接口拖累整体响应
  const searchPromises = apiSites.map((site) =>
    Promise.race([
      searchFromApi(site, query),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${site.name} timeout`)), 20000)
      ),
    ]).catch((err) => {
      console.warn(`搜索失败 ${site.name}:`, err.message);
      return []; // 返回空数组而不是抛出错误
    })
  );

  try {
    const results = await Promise.allSettled(searchPromises);
    const successResults = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);
    let flattenedResults = successResults.flat();
    
    // 过滤与查询关键词不相关的结果
    if (query) {
      flattenedResults = flattenedResults.filter(result => isResultRelevant(result, query));
    }
    
    if (!config.SiteConfig.DisableYellowFilter) {
      flattenedResults = flattenedResults.filter((result) => {
        const typeName = result.type_name || '';
        return !yellowWords.some((word: string) => typeName.includes(word));
      });
    }
    const cacheTime = await getCacheTime();

    if (flattenedResults.length === 0) {
      // no cache if empty
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    return NextResponse.json(
      { results: flattenedResults },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}