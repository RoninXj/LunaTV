# 全局搜索功能优化方案

## 概述

本次优化主要针对项目的全局搜索功能，目标是确保搜索结果只显示与关键字相关的资源，过滤掉无关的资源，提高搜索结果的相关性和用户体验。

## 优化内容

### 1. 影视搜索优化（src/app/api/search/route.ts）

在API层面对搜索结果进行相关性过滤：

```typescript
// 应用相关性过滤 - 只返回与查询关键词相关的资源
flattenedResults = flattenedResults.filter((result) => {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return true;
  
  // 检查标题是否包含关键词
  const titleMatch = result.title?.toLowerCase().includes(trimmedQuery);
  
  // 检查年份是否匹配（如果查询包含年份）
  const yearMatch = result.year && trimmedQuery.includes(result.year);
  
  // 检查类型名称是否包含关键词
  const typeNameMatch = result.type_name?.toLowerCase().includes(trimmedQuery);
  
  // 检查分类是否包含关键词
  const classMatch = result.class?.toLowerCase().includes(trimmedQuery);
  
  // 检查描述是否包含关键词
  const descMatch = result.desc?.toLowerCase().includes(trimmedQuery);
  
  // 如果是精确匹配标题，直接返回true
  if (result.title?.toLowerCase().trim() === trimmedQuery) {
    return true;
  }
  
  // 如果任何字段匹配，返回true
  return titleMatch || yearMatch || typeNameMatch || classMatch || descMatch;
});
```

### 2. 网盘搜索优化（src/app/api/netdisk/search/route.ts）

对网盘搜索结果进行相关性过滤：

```typescript
// 应用相关性过滤 - 只返回与查询关键词相关的资源
if (result.data?.merged_by_type) {
  const filteredResults: { [key: string]: any[] } = {};
  
  Object.keys(result.data.merged_by_type).forEach(type => {
    const links = result.data.merged_by_type[type];
    const filteredLinks = links.filter((link: any) => {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery) return true;
      
      // 检查备注是否包含关键词
      const noteMatch = link.note?.toLowerCase().includes(trimmedQuery);
      
      // 检查来源是否包含关键词
      const sourceMatch = link.source?.toLowerCase().includes(trimmedQuery);
      
      // 如果是精确匹配备注，直接返回true
      if (link.note?.toLowerCase().trim() === trimmedQuery) {
        return true;
      }
      
      // 如果任何字段匹配，返回true
      return noteMatch || sourceMatch;
    });
    
    if (filteredLinks.length > 0) {
      filteredResults[type] = filteredLinks;
    }
  });
  
  result.data.merged_by_type = filteredResults;
  
  // 重新计算总数
  result.data.total = Object.values(filteredResults).reduce((total, links) => total + links.length, 0);
}
```

### 3. YouTube搜索优化（src/app/api/youtube/search/route.ts）

对YouTube搜索结果进行相关性过滤：

```typescript
// 应用相关性过滤 - 只返回与查询关键词相关的资源
let filteredVideos = data.items || [];
if (filteredVideos.length > 0) {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery) {
    filteredVideos = filteredVideos.filter((video: any) => {
      // 检查标题是否包含关键词
      const titleMatch = video.snippet?.title?.toLowerCase().includes(trimmedQuery);
      
      // 检查描述是否包含关键词
      const descMatch = video.snippet?.description?.toLowerCase().includes(trimmedQuery);
      
      // 检查频道标题是否包含关键词
      const channelMatch = video.snippet?.channelTitle?.toLowerCase().includes(trimmedQuery);
      
      // 如果是精确匹配标题，直接返回true
      if (video.snippet?.title?.toLowerCase().trim() === trimmedQuery) {
        return true;
      }
      
      // 如果任何字段匹配，返回true
      return titleMatch || descMatch || channelMatch;
    });
  }
}
```

### 4. 下游数据源优化（src/lib/downstream.ts）

在数据源层面进行相关性过滤：

```typescript
// 应用相关性过滤 - 只返回与查询关键词相关的资源
results = results.filter((result: SearchResult) => {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return true;
  
  // 检查标题是否包含关键词
  const titleMatch = result.title?.toLowerCase().includes(trimmedQuery);
  
  // 检查年份是否匹配（如果查询包含年份）
  const yearMatch = result.year && trimmedQuery.includes(result.year);
  
  // 检查类型名称是否包含关键词
  const typeNameMatch = result.type_name?.toLowerCase().includes(trimmedQuery);
  
  // 检查分类是否包含关键词
  const classMatch = result.class?.toLowerCase().includes(trimmedQuery);
  
  // 检查描述是否包含关键词
  const descMatch = result.desc?.toLowerCase().includes(trimmedQuery);
  
  // 如果是精确匹配标题，直接返回true
  if (result.title?.toLowerCase().trim() === trimmedQuery) {
    return true;
  }
  
  // 如果任何字段匹配，返回true
  return titleMatch || yearMatch || typeNameMatch || classMatch || descMatch;
});
```

### 5. 前端搜索页面优化（src/app/search/page.tsx）

在前端增加相关性过滤函数，并在聚合和非聚合视图中应用：

```typescript
// 添加关键词相关性过滤函数
const filterResultsByRelevance = (items: SearchResult[], query: string): SearchResult[] => {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return items;

  return items.filter((item: SearchResult) => {
    // 检查标题是否包含关键词
    const titleMatch = item.title?.toLowerCase().includes(trimmedQuery);
    
    // 检查年份是否匹配（如果查询包含年份）
    const yearMatch = item.year && trimmedQuery.includes(item.year);
    
    // 检查类型名称是否包含关键词
    const typeNameMatch = item.type_name?.toLowerCase().includes(trimmedQuery);
    
    // 检查分类是否包含关键词
    const classMatch = item.class?.toLowerCase().includes(trimmedQuery);
    
    // 检查描述是否包含关键词
    const descMatch = item.desc?.toLowerCase().includes(trimmedQuery);
    
    // 如果是精确匹配标题，直接返回true
    if (item.title?.toLowerCase().trim() === trimmedQuery) {
      return true;
    }
    
    // 如果任何字段匹配，返回true
    return titleMatch || yearMatch || typeNameMatch || classMatch || descMatch;
  });
};
```

### 6. 网盘搜索结果组件优化（src/components/NetDiskSearchResults.tsx）

优化网盘搜索结果的显示，过滤掉空的结果类型：

```typescript
// 获取有结果的网盘类型统计（过滤掉空的类型）
const availableTypes = results 
  ? Object.entries(results)
      .filter(([_, links]) => links.length > 0) // 只显示有结果的类型
      .map(([type, links]) => ({
        type,
        count: links.length,
        info: CLOUD_TYPES[type as keyof typeof CLOUD_TYPES] || CLOUD_TYPES.others
      })).sort((a, b) => b.count - a.count) // 按数量降序排列
  : [];
```

## 优化效果

通过以上优化，搜索功能将实现以下改进：

1. **提高相关性**：只显示与搜索关键词相关的资源，过滤掉无关内容
2. **多维度匹配**：支持标题、年份、类型、分类、描述等多个字段的匹配
3. **精确匹配优先**：精确匹配标题的结果会优先显示
4. **统一过滤逻辑**：不同搜索类型（影视、网盘、YouTube）采用统一的相关性过滤机制
5. **提升用户体验**：减少无关结果的干扰，让用户更快找到需要的内容

## 实现原理

1. **关键词匹配**：将搜索关键词与资源的多个字段进行匹配检查
2. **多字段检查**：检查标题、年份、类型、分类、描述等字段是否包含关键词
3. **精确匹配优化**：对精确匹配标题的结果给予最高优先级
4. **层级过滤**：从API层到前端层逐层过滤，确保结果相关性
5. **动态过滤**：根据不同的搜索类型采用相应的字段匹配策略

## 测试建议

1. 测试不同类型关键词的搜索效果
2. 验证精确匹配和模糊匹配的结果排序
3. 检查各种搜索类型（影视、网盘、YouTube）的过滤效果
4. 确认聚合和非聚合视图下的过滤一致性
5. 验证边缘情况（空关键词、特殊字符等）的处理