export interface AdminConfig {
  ConfigSubscribtion: {
    URL: string;
    AutoUpdate: boolean;
    LastCheck: string;
  };
  ConfigFile: string;
  SiteConfig: {
    SiteName: string;
    Announcement: string;
    SearchDownstreamMaxPage: number;
    SiteInterfaceCacheTime: number;
    DoubanProxyType: string;
    DoubanProxy: string;
    DoubanImageProxyType: string;
    DoubanImageProxy: string;
    DisableYellowFilter: boolean;
    FluidSearch: boolean;
  };
  UserConfig: {
    AllowRegister?: boolean; // 是否允许用户注册，默认 true
    Users: {
      username: string;
      password?: string; // 明文密码，用于管理员查看
      role: 'user' | 'admin' | 'owner';
      banned?: boolean;
      enabledApis?: string[]; // 优先级高于tags限制
      tags?: string[]; // 多 tags 取并集限制
      disablePasswordChange?: boolean; // 是否禁用修改密码
      registerTime?: string; // 注册时间
      registerIP?: string; // 注册IP地址
      registerUserAgent?: string; // 注册时的浏览器信息
      lastLoginTime?: string; // 最后登录时间
      lastLoginIP?: string; // 最后登录IP
      loginHistory?: {
        ip: string;
        time: string;
        userAgent?: string;
      }[]; // 登录历史记录
    }[];
    Tags?: {
      name: string;
      enabledApis: string[];
    }[];
  };
  SourceConfig: {
    key: string;
    name: string;
    api: string;
    detail?: string;
    from: 'config' | 'custom';
    disabled?: boolean;
  }[];
  CustomCategories: {
    name?: string;
    type: 'movie' | 'tv';
    query: string;
    from: 'config' | 'custom';
    disabled?: boolean;
  }[];
  LiveConfig?: {
    key: string;
    name: string;
    url: string;  // m3u 地址
    ua?: string;
    epg?: string; // 节目单
    from: 'config' | 'custom';
    channelNumber?: number;
    disabled?: boolean;
  }[];
  NetDiskConfig?: {
    enabled: boolean;                    // 是否启用网盘搜索
    pansouUrl: string;                   // PanSou服务地址
    timeout: number;                     // 请求超时时间(秒)
    enabledCloudTypes: string[];         // 启用的网盘类型
  };
  AIRecommendConfig?: {
    enabled: boolean;                    // 是否启用AI推荐功能
    apiUrl: string;                      // OpenAI兼容API地址
    apiKey: string;                      // API密钥
    model: string;                       // 模型名称
    temperature: number;                 // 温度参数 0-2
    maxTokens: number;                   // 最大token数
  };
  YouTubeConfig?: {
    enabled: boolean;                    // 是否启用YouTube搜索功能
    apiKey: string;                      // YouTube Data API v3密钥
    enableDemo: boolean;                 // 是否启用演示模式
    maxResults: number;                  // 每页最大搜索结果数
    enabledRegions: string[];            // 启用的地区代码列表
    enabledCategories: string[];         // 启用的视频分类列表
  };
  TVBoxSecurityConfig?: {
    enableAuth: boolean;                 // 是否启用Token验证
    token: string;                       // 访问Token
    enableIpWhitelist: boolean;          // 是否启用IP白名单
    allowedIPs: string[];               // 允许的IP地址列表
    enableRateLimit: boolean;            // 是否启用频率限制
    rateLimit: number;                   // 每分钟允许的请求次数
  };
}

export interface AdminConfigResult {
  Role: 'owner' | 'admin';
  Config: AdminConfig;
}
