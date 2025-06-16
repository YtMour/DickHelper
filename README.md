# 🍆 DickHelper

> 祝愿所有给本项目Star的小伙伴牛子长度翻倍！

一个专业、安全、私密的个人健康数据管理助手。基于现代Web技术栈构建的跨平台桌面应用，为用户提供完整的数据记录、分析和管理解决方案。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.4+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-30.0+-purple.svg)](https://www.electronjs.org/)

## ✨ 功能特色

### 📝 智能记录系统
- **精准计时功能** - 支持实时计时和手动输入
- **多维度评分** - 心情、精力、满意度等多项指标
- **智能标签系统** - 自定义标签，支持快速分类
- **私密记录模式** - 本地加密存储，保护隐私安全
- **快速记录** - 一键开始/停止，简化操作流程

### 📊 数据可视化分析
- **智能仪表盘** - 个性化数据洞察和趋势分析
- **高级统计图表** - 基于ECharts的专业数据可视化
- **多维度分析** - 频率、时长、心情、精力等全方位统计
- **时间热力图** - 直观展示活跃时间分布
- **趋势预测** - 基于历史数据的智能预测分析

### 🔒 数据安全管理
- **本地加密存储** - 采用AES加密算法保护数据安全
- **自动备份系统** - 定期自动备份，防止数据丢失
- **导入导出功能** - 支持JSON格式的数据迁移
- **历史记录管理** - 完整的记录查看、编辑、删除功能
- **高级搜索过滤** - 多条件筛选，快速定位目标记录

### 🎨 现代化用户体验
- **响应式设计** - 完美适配桌面、平板、移动设备
- **深色模式支持** - 护眼的深色主题切换
- **流畅动画效果** - 精心设计的页面切换和交互动画
- **个性化设置** - 丰富的自定义选项和偏好设置
- **多语言支持** - 国际化界面设计（计划中）

## 🛠 技术栈

### 前端框架
- **Vue 3** - 渐进式JavaScript框架，Composition API
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - 企业级Vue 3组件库
- **Pinia** - 新一代Vue状态管理库
- **Vue Router** - 官方路由管理器

### 数据可视化
- **ECharts** - 专业的数据可视化图表库
- **自定义图表组件** - 针对应用场景优化的图表组件

### 桌面应用
- **Electron** - 跨平台桌面应用开发框架
- **Vite** - 下一代前端构建工具
- **Electron Builder** - 应用打包和分发工具

### 开发工具
- **ESLint** - 代码质量检查工具
- **Prettier** - 代码格式化工具
- **Husky** - Git hooks管理工具

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-username/DickHelper.git
cd DickHelper

# 安装依赖
npm install
# 或使用 yarn
yarn install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 启动Electron开发模式
npm run electron:dev
```

### 构建应用
```bash
# 构建Web版本
npm run build

# 构建桌面应用
npm run build:electron

# 构建所有平台
npm run build:all
```

## 📱 应用截图

### 主界面
![主界面](docs/screenshots/main.png)

### 智能仪表盘
![智能仪表盘](docs/screenshots/dashboard.png)

### 数据统计
![数据统计](docs/screenshots/analytics.png)

### 设置界面
![设置界面](docs/screenshots/settings.png)

## 🔧 配置说明

### 应用配置
应用配置文件位于 `src/config/` 目录下：
- `app.config.ts` - 应用基础配置
- `theme.config.ts` - 主题配置
- `chart.config.ts` - 图表配置

### 环境变量
创建 `.env.local` 文件进行本地配置：
```env
# 应用标题
VITE_APP_TITLE=DickHelper

# API地址（如果需要）
VITE_API_BASE_URL=http://localhost:3000

# 调试模式
VITE_DEBUG=true
```

## 📦 项目结构

```
DickHelper/
├── src/
│   ├── components/          # Vue组件
│   │   ├── RecordForm.vue   # 记录表单
│   │   ├── StatsChart.vue   # 统计图表
│   │   └── ...
│   ├── stores/              # Pinia状态管理
│   ├── services/            # 业务逻辑服务
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript类型定义
│   └── styles/              # 样式文件
├── electron/                # Electron主进程
├── public/                  # 静态资源
├── docs/                    # 文档和截图
└── dist/                    # 构建输出
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的注释和文档
- 保持组件的单一职责原则

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3组件库
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架

## 📞 联系我们

- 项目主页：[GitHub Repository](https://github.com/your-username/DickHelper)
- 问题反馈：[Issues](https://github.com/your-username/DickHelper/issues)
- 功能建议：[Discussions](https://github.com/your-username/DickHelper/discussions)

---

<div align="center">
  <p>如果这个项目对您有帮助，请给我们一个 ⭐️ Star！</p>
  <p>Made with ❤️ by DickHelper Team</p>
</div>

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建应用
npm run build
```

## 项目结构

```
src/
  ├── assets/        # 静态资源
  ├── components/    # 组件
  ├── services/      # 服务
  ├── stores/        # 状态管理
  ├── types/         # 类型定义
  ├── views/         # 页面
  └── router/        # 路由配置
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
