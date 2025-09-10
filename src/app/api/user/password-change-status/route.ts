/* eslint-disable no-console*/

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ disabled: true });
    }
    const username = authInfo.username;

    const adminConfig = await db.getAdminConfig();
    const user = adminConfig?.UserConfig.Users.find(u => u.username === username);
    const disabled = !!user?.disablePasswordChange;
    return NextResponse.json({ disabled });
  } catch (e) {
    return NextResponse.json({ disabled: false });
  }
}