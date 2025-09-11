/* eslint-disable no-console,@typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { clearConfigCache, getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  // 优先级按照：代理服务器设置的头部 -> 直连IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个（最原始的客户端IP）
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // 如果都没有，返回连接IP（可能是代理服务器IP）
  return request.ip || '未知';
}

// 读取存储类型环境变量，默认 localstorage
const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | undefined) || 'localstorage';

// 生成签名
async function generateSignature(
  data: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 生成签名
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // 转换为十六进制字符串
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 生成认证Cookie（带签名）
async function generateAuthCookie(
  username?: string,
  password?: string,
  role?: 'owner' | 'admin' | 'user',
  includePassword = false
): Promise<string> {
  const authData: any = { role: role || 'user' };

  // 只在需要时包含 password
  if (includePassword && password) {
    authData.password = password;
  }

  if (username && process.env.PASSWORD) {
    authData.username = username;
    // 使用密码作为密钥对用户名进行签名
    const signature = await generateSignature(username, process.env.PASSWORD);
    authData.signature = signature;
    authData.timestamp = Date.now(); // 添加时间戳防重放攻击
  }

  return encodeURIComponent(JSON.stringify(authData));
}

export async function POST(req: NextRequest) {
  try {
    // localStorage 模式不支持注册
    if (STORAGE_TYPE === 'localstorage') {
      return NextResponse.json(
        { error: 'localStorage 模式不支持用户注册' },
        { status: 400 }
      );
    }

    const { username, password, confirmPassword } = await req.json();

    // 先检查配置中是否允许注册（在验证输入之前）
    try {
      const config = await getConfig();
      const allowRegister = config.UserConfig?.AllowRegister !== false; // 默认允许注册
      
      if (!allowRegister) {
        return NextResponse.json(
          { error: '管理员已关闭用户注册功能' },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error('检查注册配置失败', err);
      return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
    }

    // 验证输入
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: '两次输入的密码不一致' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 检查是否与管理员用户名冲突
    if (username === process.env.USERNAME) {
      return NextResponse.json({ error: '该用户名已被使用' }, { status: 400 });
    }

    // 检查用户名格式（只允许字母数字和下划线）
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字和下划线，长度3-20位' },
        { status: 400 }
      );
    }

    try {
      // 检查用户是否已存在
      const userExists = await db.checkUserExist(username);
      if (userExists) {
        return NextResponse.json({ error: '该用户名已被注册' }, { status: 400 });
      }

      // 获取注册IP地址
      const registerIP = getClientIP(req);
      const userAgent = req.headers.get('user-agent') || undefined;
      
      // 注册用户
      await db.registerUser(username, password);

      // 使用原子操作更新配置，避免并发冲突
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // 清除配置缓存，确保获取到最新的配置
          clearConfigCache();
          
          // 重新获取配置来添加用户
          const config = await getConfig();
          
          // 检查用户是否已经存在于配置中（防止重复添加）
          const userExistsInConfig = config.UserConfig.Users.some(u => u.username === username);
          if (userExistsInConfig) {
            // 用户已经存在，跳出循环
            break;
          }
          
          const newUser = {
            username: username,
            role: 'user' as const,
            registerTime: new Date().toISOString(), // 添加注册时间
            registerIP: registerIP, // 注册IP地址
            registerUserAgent: userAgent, // 注册时的浏览器信息
            password: password, // 添加密码信息，确保管理员页面能显示注册时设置的密码
          };
          
          config.UserConfig.Users.push(newUser);
          
          // 保存更新后的配置
          await db.saveAdminConfig(config);
          
          // 清除缓存，确保下次获取配置时是最新的
          clearConfigCache();
          
          // 成功更新配置，跳出循环
          break;
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw err;
          }
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      // 注册成功后自动登录
      const response = NextResponse.json({ 
        ok: true, 
        message: '注册成功，已自动登录' 
      });
      
      const cookieValue = await generateAuthCookie(
        username,
        password,
        'user',
        false
      );
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7天过期

      response.cookies.set('auth', cookieValue, {
        path: '/',
        expires,
        sameSite: 'lax',
        httpOnly: false,
        secure: false,
      });

      return response;
    } catch (err) {
      console.error('注册用户失败', err);
      return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
    }
  } catch (error) {
    console.error('注册接口异常', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}