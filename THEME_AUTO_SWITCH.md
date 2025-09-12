# 主题自动切换功能说明

## 功能介绍

EnhancedThemeToggle组件为InfinityTV-main项目添加了以下功能：

1. **多种主题模式**：
   - 浅色模式
   - 深色模式
   - 跟随系统
   - 护眼模式
   - 高对比度模式

2. **自动切换功能**：
   - 根据时间自动切换主题
   - 白天(6:00-18:00)使用浅色主题
   - 夜间(18:00-6:00)使用深色主题
   - 设置会保存在localStorage中

## 使用方法

1. 点击顶部导航栏的主题图标打开主题选择面板
2. 选择你喜欢的主题模式
3. 启用"根据时间自动切换"选项以启用自动切换功能

## 技术实现

- 使用`next-themes`库管理主题状态
- 通过`localStorage`保存用户设置
- 使用`useEffect`监听时间变化并自动切换主题
- 支持View Transitions API以实现平滑的主题切换动画

## 自定义设置

你可以通过修改[EnhancedThemeToggle.tsx](file:///C:/Users/Administrator/Desktop/tv/InfinityTV-main/src/components/EnhancedThemeToggle.tsx)组件中的时间判断逻辑来自定义自动切换的时间段：

```typescript
// 6:00-18:00 使用浅色主题，18:00-6:00 使用深色主题
const newTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
```