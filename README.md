# SSE Stream Inspector

面向开发者的 **Server-Sent Events (SSE) 流解析与可视化工具**，针对 Claude 风格模型输出做了优化——支持 thinking 块、tool call、对话历史等结构的解析与重建。

界面标题为 **Claude Protocol Inspector**，适合调试 API 响应、理解 SSE 事件序列、分析完整对话 JSON。

## 功能特性

### SSE 流模式

粘贴原始 SSE 文本（可含 HTTP 响应头），工具会：

- 自动跳过 HTTP 头，定位 `event:` / `data:` 起始位置
- 将流拆分为逐条 **SSE 事件**，按类型着色展示（手风琴折叠）
- 将事件序列 **重建** 为结构化消息：model、stop_reason、content blocks（thinking / text / tool_use）
- 展示 **Token 用量**（input / output / cache 等）

### 对话 JSON 模式

粘贴 Claude API 请求体或对话历史 JSON（含 `messages` 数组），工具会：

- 自动识别并切换到对话视图
- 以聊天界面渲染完整轮次：用户消息、助手回复
- 展示 thinking 过程、tool_use 调用、tool_result 结果
- 支持 system 指令与 tools 定义预览

### 其他

- 输入变更时 **实时解析**，无需手动点击
- 内置 SSE 与对话 JSON **示例数据**，一键加载
- 解析失败时在输入区下方显示错误提示

## 快速开始

**环境要求：** Node.js（建议 18+）

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npm run dev
```

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 开发模式，监听 `0.0.0.0:3000` |
| `npm run build` | 生产构建，输出到 `dist/` |
| `npm run preview` | 预览生产构建 |

## 使用方式

1. 启动应用后，在左侧 **RAW DATA INPUT** 文本框粘贴内容
2. 右上角可点击 **Load SSE Example** 或 **Load Dialogue Example** 加载示例
3. 顶部标签显示当前检测到的模式：`SSE` 或 `DIALOGUE`
4. 左侧（SSE 模式）查看事件序列；右侧查看可视化重建结果

### 支持的输入格式

**SSE 流示例：**

```
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: message_start
data: {"type":"message_start","message":{...}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{...}}
```

**对话 JSON 示例：**

```json
{
  "model": "claude-haiku-4-5-20251001",
  "messages": [
    { "role": "user", "content": [{ "type": "text", "text": "你好" }] },
    { "role": "assistant", "content": [{ "type": "thinking", "thinking": "..." }] }
  ]
}
```

## 项目结构

```
├── App.tsx                    # 根组件，状态管理与自动解析
├── index.tsx                  # 应用入口
├── types.ts                   # TypeScript 类型定义
├── services/
│   └── sseParser.ts           # SSE 解析与消息重建
└── components/
    ├── EventItem.tsx          # 单条 SSE 事件展示
    ├── MessagePreview.tsx     # SSE 重建结果预览
    └── ChatHistory.tsx        # 对话历史聊天视图
```

## 技术栈

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS**（CDN 引入，无 PostCSS 配置文件）
- 无外部状态库，使用 `useState` + `useCallback` 本地管理状态

## 开发说明

- SSE 解析支持多行 `data:` 拼接
- JSON 解析失败时回退到 SSE 模式；两种格式均无法识别则显示错误
- 组件遵循 `React.FC<Props>` 模式，类型统一放在 `types.ts`
- AI 代理开发约定见 [AGENTS.md](./AGENTS.md)
