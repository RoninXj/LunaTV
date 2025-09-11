import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { clearAllYouTubeCache } from '@/lib/youtube-cache';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查用户是否为管理员
    if (authInfo.role !== 'admin' && authInfo.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 清除所有YouTube缓存
    await clearAllYouTubeCache();

    return NextResponse.json({ 
      success: true, 
      message: 'YouTube缓存已清除' 
    });
  } catch (error) {
    console.error('清除YouTube缓存失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '清除YouTube缓存失败' 
    }, { status: 500 });
  }
}