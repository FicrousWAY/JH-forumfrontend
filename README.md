# 精弘论坛前端
[![Netlify Status](https://api.netlify.com/api/v1/badges/9460f4c0-d217-4603-a3a6-e139c29a7512/deploy-status)](https://app.netlify.com/projects/jhforumfrontend/deploys)
Vue 3 + Vite + TypeScript + Pinia + Element Plus。

## 开发

```bash
npm install
npm run dev
```

默认通过 Vite 代理将 `/api` 转发到本地后端 `http://127.0.0.1:8080`（见 `vite.config.ts`）。生产环境由 `netlify.toml` 将 `/api` 反向代理到云服务器。

## 构建

```bash
npm run build
```

## 缓存机制

前端使用 **Pinia + pinia-plugin-persistedstate** 将关键状态持久化到 `localStorage`，并配合 **Stale-While-Revalidate（SWR）** 策略：有缓存时先展示本地数据，必要时在后台静默刷新，减少重复请求、提升二次打开与页面切换体验。

### 登录态（`src/stores/auth.ts`）

| 持久化字段 | 说明 |
|-----------|------|
| `token` | 访问令牌 |
| `user` | 当前用户信息 |

刷新页面后保持登录状态，无需重新输入账号密码。401 响应时会自动清空并跳转登录页。

### 帖子列表（`src/stores/posts.ts`）

| 持久化字段 | 说明 |
|-----------|------|
| `posts` | 当前页帖子列表 |
| `likedMap` | 各帖子的点赞状态 |
| `page` / `pageSize` / `sort` / `total` | 分页与排序状态 |
| `fetchedAt` | 上次成功拉取的时间戳 |

**刷新策略：**

- **无缓存**：显示骨架屏，等待接口返回。
- **有缓存且未过期**（默认 TTL 60 秒）：直接使用本地数据，不发起请求。
- **有缓存但已过期**：先展示缓存内容，后台静默刷新，排序栏显示「更新中」提示。
- **切换分页 / 排序**：强制重新请求并更新缓存。

**缓存失效与预热：**

- 登录成功后调用 `invalidate()` 并预取列表，缩短进入首页的等待时间。
- 发布新帖成功后调用 `invalidate()`，下次进入列表页会重新拉取。
- 管理员删除帖子后调用 `removePost()`：立刻从本地列表移除该帖，并失效 TTL，返回发现页时会重新拉取，避免已删除内容残留。

**使用位置：** `src/views/post-list-view.vue`

### Agent 对话（`src/stores/agent.ts`）

| 持久化字段 | 说明 |
|-----------|------|
| `sessions` | 按用户名隔离的会话映射 |

每个用户独立保存：

- `sessionId`：与后端 Agent 接口对应的多轮会话 ID
- `messages`：对话消息记录
- `pending`：待确认的草稿帖子

刷新或关闭浏览器后，同一账号的对话可恢复。Agent 页面提供「清空对话」按钮，可重置当前用户的会话。

**使用位置：** `src/views/agent-view.vue`

### 冷启动说明

| 场景 | 行为 |
|------|------|
| 首次访问（localStorage 为空） | 无本地缓存，帖子列表显示骨架屏，需等待网络请求 |
| 二次打开 / 刷新页面 | 帖子列表与 Agent 对话从 localStorage 恢复，可秒开 |
| 登录后 | 主动预取帖子列表，减少首页白屏时间 |
| 发帖后 | 列表缓存失效，保证数据一致性 |

真正的「初次冷启动」无法避免首次网络请求。若需进一步优化首屏，可考虑 PWA 静态资源预缓存、SSR/SSG 或服务端渲染首屏数据等方案。

## 项目结构（Store 相关）

```
src/stores/
├── auth.ts    # 登录态持久化
├── posts.ts   # 帖子列表缓存 + SWR
└── agent.ts   # Agent 对话 localStorage 持久化
```
