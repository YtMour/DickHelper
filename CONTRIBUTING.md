# 贡献指南

感谢您对 DickHelper 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能

## 🚀 开始贡献

### 1. Fork 项目

点击项目页面右上角的 "Fork" 按钮，将项目 fork 到您的 GitHub 账户。

### 2. 克隆项目

```bash
git clone https://github.com/your-username/DickHelper.git
cd DickHelper
```

### 3. 创建分支

```bash
# 创建并切换到新分支
git checkout -b feature/your-feature-name

# 或者修复 bug
git checkout -b fix/your-bug-fix
```

### 4. 安装依赖

```bash
npm install
```

### 5. 开发和测试

```bash
# 启动开发服务器
npm run dev

# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint
```

## 📝 代码规范

### TypeScript 规范
- 使用 TypeScript 进行开发
- 为所有函数和变量提供类型注解
- 避免使用 `any` 类型，优先使用具体类型

### Vue 组件规范
- 使用 Composition API
- 组件名使用 PascalCase
- Props 和 emits 必须定义类型
- 使用 `<script setup>` 语法

### 代码风格
- 使用 2 个空格缩进
- 使用单引号
- 行末不加分号
- 遵循 ESLint 配置

### 提交信息规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(record): 添加自动保存功能

- 实现记录表单的自动保存
- 添加保存状态指示器
- 优化用户体验

Closes #123
```

## 🐛 报告 Bug

在报告 Bug 之前，请：

1. 检查是否已有相关的 issue
2. 确保使用的是最新版本
3. 提供详细的重现步骤

### Bug 报告模板

```markdown
**Bug 描述**
简洁清晰地描述 bug。

**重现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述您期望发生的行为。

**实际行为**
描述实际发生的行为。

**截图**
如果适用，添加截图来帮助解释您的问题。

**环境信息**
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91]
- 应用版本: [例如 v0.1.0]

**附加信息**
添加任何其他相关信息。
```

## 💡 功能建议

我们欢迎新功能建议！请：

1. 检查是否已有相关建议
2. 详细描述功能需求
3. 说明使用场景
4. 考虑实现的可行性

## 🔍 代码审查

所有的 Pull Request 都需要经过代码审查：

- 确保代码符合项目规范
- 添加必要的测试
- 更新相关文档
- 保持向后兼容性

## 📚 开发指南

### 项目结构
```
src/
├── components/     # Vue 组件
├── stores/         # Pinia 状态管理
├── services/       # 业务逻辑服务
├── utils/          # 工具函数
├── types/          # TypeScript 类型定义
└── styles/         # 样式文件
```

### 添加新组件
1. 在 `src/components/` 目录下创建组件文件
2. 使用 TypeScript 和 Composition API
3. 添加必要的类型定义
4. 编写组件文档

### 添加新服务
1. 在 `src/services/` 目录下创建服务文件
2. 定义清晰的接口
3. 添加错误处理
4. 编写单元测试

## 🧪 测试

虽然项目目前还没有完整的测试套件，但我们鼓励：

- 手动测试所有修改的功能
- 确保不破坏现有功能
- 在不同环境下测试

## 📄 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下授权。

## 🤝 行为准则

请遵循我们的行为准则：

- 尊重所有参与者
- 使用友好和包容的语言
- 接受建设性的批评
- 专注于对社区最有利的事情

## 📞 获取帮助

如果您有任何问题，可以：

- 创建 GitHub Issue
- 参与 GitHub Discussions
- 查看项目文档

感谢您的贡献！🎉
