# SSE Stream Inspector

面向开发者的 **Server-Sent Events (SSE) 流解析与可视化工具**，支持 **Anthropic** 与 **OpenAI Chat Completions** 两种协议格式——包括 thinking / reasoning 块、tool call、对话历史等结构的解析与重建。

界面标题为 **AI Protocol Inspector**，适合调试 API 响应、理解 SSE 事件序列、分析完整对话 JSON。

## 功能特性

### 多 Provider 支持

| Provider | SSE 流 | 对话 JSON |
|----------|--------|-----------|
| **Anthropic** | `event:` + `data:`，`message_start` / `content_block_delta` 等 | `content[]` 分块、`tool_use` / `tool_result` |
| **OpenAI** | `data:` chunk，`chat.completion.chunk`，含 `reasoning_content` | `tool_calls[]`、`role: tool`、function tools |

粘贴内容后**自动检测** Provider，顶部显示 `SSE · OPENAI` 或 `DIALOGUE · ANTHROPIC` 等标签。

### SSE 流模式

- 自动跳过 HTTP 头，支持 Anthropic 单行与 OpenAI **多行** `data:` JSON
- 将流拆分为逐条 SSE 事件，按类型着色展示
- 重建为结构化消息：model、stop_reason、content blocks（thinking/reasoning、text、tool_use）
- 展示 Token 用量（input / output / reasoning / cache 等）

### 对话 JSON 模式

- 自动识别 Anthropic 或 OpenAI 对话 JSON
- 聊天界面渲染完整轮次，含 `role: tool` 消息
- 展示 thinking / reasoning、tool_use 调用、tool_result 结果
- 支持 system 指令与 tools 定义预览

### 其他

- 输入变更时**实时解析**
- 顶部**示例模板**下拉（仅控制加载哪套示例）+ 一键加载；粘贴内容仍自动识别 Provider
- 解析失败时显示错误提示

## 快速开始

**环境要求：** Node.js（建议 18+）

```bash
npm install
npm run dev    # http://localhost:3000
```

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 开发模式，监听 `0.0.0.0:3000` |
| `npm run build` | 生产构建，输出到 `dist/` |
| `npm run preview` | 预览生产构建 |

## 使用方式

1. 在左侧文本框粘贴 SSE 流或对话 JSON
2. 选择 Provider 下拉（anthropic / openai），点击加载对应示例
3. 查看顶部检测标签确认模式与 Provider
4. 左侧查看事件序列（SSE 模式），右侧查看可视化重建

### 示例目录

```
examples/
├── anthropic/
│   ├── sse.txt
│   └── dialogue.json
└── openai/
    ├── sse.txt
    └── dialogue.json
```

### 支持的输入格式

**Anthropic SSE：**

```
event: message_start
data: {"type":"message_start","message":{...}}
```

**OpenAI SSE：**

```
data: {
  "object": "chat.completion.chunk",
  "choices": [{ "delta": { "reasoning_content": "..." } }]
}

data: [DONE]
```

**OpenAI 对话 JSON：**

```json
{
  "model": "deepseek-v4-flash",
  "tools": [{ "type": "function", "function": { "name": "read_file", "parameters": {} } }],
  "messages": [
    { "role": "system", "content": "You are a coding agent..." },
    { "role": "user", "content": "hello" },
    { "role": "assistant", "content": null, "tool_calls": [...] },
    { "role": "tool", "tool_call_id": "call_123", "content": "..." }
  ]
}
```

## 项目结构

```
├── App.tsx                         # 根组件，自动解析与 Provider 切换
├── types.ts                        # 类型定义（Provider、ChatHistory、MessageState）
├── examples/                       # 按 Provider 分层的示例文件
├── services/
│   ├── sseParser.ts                # 通用 SSE 分词（含多行 data）
│   ├── formatDetector.ts           # Provider 自动检测
│   ├── anthropicReconstructor.ts   # Anthropic SSE 重建
│   ├── openaiReconstructor.ts      # OpenAI SSE 重建（含 reasoning_content）
│   ├── reconstructMessage.ts       # 重建分发入口
│   └── dialogueNormalizer.ts       # 对话 JSON 归一化
└── components/
    ├── EventItem.tsx
    ├── MessagePreview.tsx
    └── ChatHistory.tsx
```

## 技术栈

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS**（CDN 引入）
- 本地 `useState` + `useCallback` 状态管理

## 开发说明

- 核心策略：**归一化内部模型** — 各 Provider 的 parser/normalizer 将输入转为统一的 `ChatHistory` / `MessageState`
- SSE 解析支持多行 `data:` 拼接与 `data: [DONE]` 终止标记
- AI 代理开发约定见 [AGENTS.md](./AGENTS.md)
