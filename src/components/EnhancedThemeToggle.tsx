'use client';

import React, { useEffect, useState } from 'react';
import { Contrast, Eye, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

type ThemeMode = 'light' | 'dark' | 'system' | 'eye-care' | 'high-contrast';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const EnhancedThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [autoSwitch, setAutoSwitch] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化自动切换设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAutoSwitch = localStorage.getItem('autoSwitch');
      if (savedAutoSwitch === 'true') {
        setAutoSwitch(true);
      }
    }
  }, []);

  // 自动切换主题逻辑
  useEffect(() => {
    if (!autoSwitch || !mounted) return;

    const checkTimeAndSetTheme = () => {
      const hour = new Date().getHours();
      // 6:00-18:00 使用浅色主题，18:00-6:00 使用深色主题
      const newTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
      if (theme !== newTheme) {
        setTheme(newTheme);
        applyThemeStyles(newTheme);
      }
    };

    // 初始检查
    checkTimeAndSetTheme();

    // 每分钟检查一次时间
    const interval = setInterval(checkTimeAndSetTheme, 60000);

    return () => clearInterval(interval);
  }, [autoSwitch, mounted, theme, setTheme]);

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: '浅色模式',
      icon: <Sun className="w-4 h-4" />,
      description: '经典的浅色主题'
    },
    {
      value: 'dark',
      label: '深色模式',
      icon: <Moon className="w-4 h-4" />,
      description: '护眼的深色主题'
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: <Monitor className="w-4 h-4" />,
      description: '自动跟随系统设置'
    },
    {
      value: 'eye-care',
      label: '护眼模式',
      icon: <Eye className="w-4 h-4" />,
      description: '减少蓝光，保护视力'
    },
    {
      value: 'high-contrast',
      label: '高对比度',
      icon: <Contrast className="w-4 h-4" />,
      description: '提高可读性'
    }
  ];

  const getCurrentThemeOption = () => {
    return themeOptions.find(option => option.value === theme) || themeOptions[0];
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    // 检查浏览器是否支持 View Transitions API，保持原有的平滑动画
    const supportsViewTransition = 
      typeof document !== 'undefined' && 
      'startViewTransition' in document.documentElement.style;
      
    if (!supportsViewTransition) {
      setTheme(newTheme);
      setIsOpen(false);
      applyThemeStyles(newTheme);
      return;
    }

    // 类型断言确保 startViewTransition 存在
    const doc = document as typeof document & {
      startViewTransition: (callback: () => void) => void;
    };
    
    doc.startViewTransition(() => {
      setTheme(newTheme);
      setIsOpen(false);
      applyThemeStyles(newTheme);
    });
  };

  const applyThemeStyles = (newTheme: ThemeMode) => {
    // 应用特殊主题样式
    const root = document.documentElement;

    switch (newTheme) {
      case 'eye-care':
        root.style.setProperty('--filter-blue-light', 'sepia(10%) saturate(90%) hue-rotate(15deg)');
        document.body.style.filter = 'var(--filter-blue-light)';
        break;
      case 'high-contrast':
        root.style.setProperty('--contrast-multiplier', '1.5');
        document.body.style.filter = 'contrast(var(--contrast-multiplier))';
        break;
      default:
        document.body.style.filter = 'none';
        break;
    }
  };

  const toggleAutoSwitch = () => {
    const newAutoSwitch = !autoSwitch;
    setAutoSwitch(newAutoSwitch);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoSwitch', newAutoSwitch.toString());
    }
    
    // 如果关闭自动切换，停止自动切换逻辑
    if (!newAutoSwitch) {
      // 用户可以在这里选择是否恢复到系统主题或其他默认主题
    }
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const currentTheme = getCurrentThemeOption();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="切换主题"
      >
        {currentTheme.icon}
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 主题选择面板 */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-64">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              选择主题
            </div>

            <div className="py-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as ThemeMode)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left ${theme === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                  {theme === option.value && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* 自动切换设置 */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <div className="px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={autoSwitch}
                    onChange={toggleAutoSwitch}
                  />
                  根据时间自动切换
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  白天使用浅色，夜间使用深色
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedThemeToggle;