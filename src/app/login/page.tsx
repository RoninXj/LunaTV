'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

import { useSite } from '@/components/SiteProvider';
import EnhancedThemeToggle from '@/components/EnhancedThemeToggle';

// 版本显示组件
function VersionDisplay() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (_) {
        // do nothing
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  return (
    <button
      onClick={() => {
        // 本地部署版本，不需要跳转
      }}
      className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 transition-colors cursor-pointer'
    >
      <span className='font-mono'>v{CURRENT_VERSION}</span>
      {!isChecking && updateStatus !== UpdateStatus.FETCH_FAILED && (
        <div
          className={`flex items-center gap-1.5 ${updateStatus === UpdateStatus.HAS_UPDATE
            ? 'text-yellow-600 dark:text-yellow-400'
            : updateStatus === UpdateStatus.NO_UPDATE
              ? 'text-green-600 dark:text-green-400'
              : ''
            }`}
        >
          {updateStatus === UpdateStatus.HAS_UPDATE ? (
            <>
              <span className='w-2 h-2 rounded-full bg-yellow-500'></span>
              有更新
            </>
          ) : updateStatus === UpdateStatus.NO_UPDATE ? (
            <>
              <span className='w-2 h-2 rounded-full bg-green-500'></span>
              最新版本
            </>
          ) : null}
        </div>
      )}
    </button>
  );
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { siteName } = useSite();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);

  useEffect(() => {
    // 检查是否需要用户名（多用户模式）
    const checkMode = async () => {
      try {
        const res = await fetch('/api/auth-mode');
        const data = await res.json();
        setShouldAskUsername(data.multiUser);
      } catch (_) {
        // 默认为单用户模式
        setShouldAskUsername(false);
      }
    };

    checkMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (shouldAskUsername && !username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ...(shouldAskUsername ? { username } : {}),
        }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('密码错误');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <div className='absolute top-4 right-4'>
        <EnhancedThemeToggle />
      </div>
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='text-3xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 tracking-tight text-center drop-shadow-sm hover:scale-105 transition-transform duration-200'>
          {siteName}
        </h1>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* 用户名输入框（仅在多用户模式下显示） */}
          {shouldAskUsername && (
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                用户名
              </label>
              <input
                id='username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                placeholder='请输入用户名'
                disabled={loading}
              />
            </div>
          )}

          {/* 密码输入框 */}
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              密码
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
              placeholder='请输入密码'
              disabled={loading}
            />
          </div>

          {/* 错误信息显示 */}
          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          {/* 登录按钮 */}
          <button
            type='submit'
            disabled={
              !password || loading || (shouldAskUsername && !username)
            }
            className='inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {/* 注册链接 - 仅在非 localStorage 模式下显示 */}
          {shouldAskUsername && (
            <div className='text-center'>
              <span className='text-gray-600 dark:text-gray-400 text-sm'>
                还没有账户？
              </span>
              <button
                type='button'
                onClick={() => router.push('/register')}
                className='ml-2 text-green-600 dark:text-green-400 text-sm font-medium hover:underline'
              >
                立即注册
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 版本信息显示 */}
      <VersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}