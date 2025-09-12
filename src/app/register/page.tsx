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
      onClick={() =>
        window.open('https://github.com/SzeMeng76/LunaTV', '_blank')
      }
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

function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { siteName } = useSite();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldShowRegister, setShouldShowRegister] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    // 检查注册状态
    const checkRegistrationStatus = async () => {
      try {
        const res = await fetch('/api/register/status');
        const data = await res.json();
        
        if (!data.allowRegistration) {
          setRegistrationDisabled(true);
        } else {
          setShouldShowRegister(true);
        }
      } catch (_) {
        // 出错时默认允许注册
        setShouldShowRegister(true);
      } finally {
        setLoading(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setSuccess(true);
        // 注册成功后1.5秒跳转到登录页
        setTimeout(() => {
          const redirect = searchParams.get('redirect') || '/login';
          router.replace(redirect);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? '注册失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!shouldShowRegister) {
    return <div>Loading...</div>;
  }

  // 如果注册被禁用，显示提示页面
  if (registrationDisabled) {
    return (
      <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
        <div className='absolute top-4 right-4'>
          <EnhancedThemeToggle />
        </div>
        <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
          <h1 className='text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 tracking-tight text-center drop-shadow-sm hover:scale-105 transition-transform duration-200'>
            {siteName}
          </h1>
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-red-600 dark:text-red-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
              注册功能已关闭
            </h2>
            <p className='text-gray-600 dark:text-gray-400 mb-6'>
              {disabledReason || '管理员已关闭用户注册功能'}
            </p>
            <p className='text-gray-500 dark:text-gray-500 text-xs'>
              如需注册账户，请联系网站管理员
            </p>
            <button
              onClick={() => router.push('/login')}
              className='inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700'
            >
              返回登录
            </button>
          </div>
        </div>
        <VersionDisplay />
      </div>
    );
  }

  // 注册表单
  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <div className='absolute top-4 right-4'>
        <EnhancedThemeToggle />
      </div>
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 tracking-tight text-center drop-shadow-sm hover:scale-105 transition-transform duration-200'>
          {siteName}
        </h1>

        {success ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-green-600 dark:text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
              注册成功！
            </h2>
            <p className='text-gray-600 dark:text-gray-400'>
              正在跳转到登录页面...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-6'>
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

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                确认密码
              </label>
              <input
                id='confirmPassword'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200'
                placeholder='请再次输入密码'
                disabled={loading}
              />
            </div>

            {error && (
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? '注册中...' : '注册'}
            </button>

            <div className='text-center'>
              <span className='text-gray-600 dark:text-gray-400 text-sm'>
                已有账户？
              </span>
              <button
                type='button'
                onClick={() => router.push('/login')}
                className='ml-2 text-green-600 dark:text-green-400 text-sm font-medium hover:underline'
              >
                立即登录
              </button>
            </div>
          </form>
        )}
      </div>

      <VersionDisplay />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageClient />
    </Suspense>
  );
}