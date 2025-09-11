import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { clearAllYouTubeCache } from '@/lib/youtube-cache';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取管理员配置以检查用户角色
    const adminConfig = await db.getAdminConfig();
    if (!adminConfig) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 查找当前用户的角色
    const currentUser = adminConfig.UserConfig.Users.find(
      (user) => user.username === authInfo.username
    );
    
    // 检查用户是否为管理员
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
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