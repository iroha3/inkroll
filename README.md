# 墨卷 (Inkroll) Monorepo

> 统一核心绘图引擎，多形态分层消费体系。

本项目将原先分散在不同仓库的 **Inkroll 网页版**、**打样调试页** 和 **Greasyfork 油猴长图脚本** 统一收敛为标准 Monorepo 架构。核心渲染与排版管线唯一下沉为底层基础包，彻底杜绝“多套引擎、手工对齐”的历史割裂。

---

## 🏛️ 架构分层设计

```text
inkroll-monorepo/
├── packages/
│   └── core/                 # 核心绘图引擎（Vanilla TypeScript）
│                             # - Markdown 全语法解析器 (markdown-it + 增强插件)
│                             # - KaTeX 离线公式渲染与保护
│                             # - 7 大主题配色与 CSS 变量系统
│                             # - 唯一的排版与样式事实源 (inkroll.css)
│                             # - SVG foreignObject -> Canvas 高清导出
│                             # - 零前端框架依赖，体积轻量
│
└── apps/
    ├── web/                  # 豪华皮肤：React 19 全功能 Web 应用
    │                         # - 现代化分栏编辑器、撤销/重做、历史记录
    │                         # - 参数抽屉、实时缩放、动效与模态导出框
    │                         # - 底层完全委托 @inkroll/core 进行渲染挂载
    │                         # - 扩展支持 Mermaid 流程图
    │
    ├── lite/                 # 调试皮肤：极简排版打样与回归测试台
    │                         # - 原生轻量网页，秒级启动与热重载
    │                         # - 专用于调试 @inkroll/core 的所见即所得排版
    │                         # - 内置全语法基准测试文档与导出性能监测
    │
    └── userscripts/          # 油猴下游：Greasyfork 平台长图脚本
                              # - 平台适配层 (Google AI Studio, Qwen 等)
                              # - 浮动导出按钮 UI、进度环、状态机、多语系
                              # - 消费 @inkroll/core 打包出完全自包含的 .user.js
                              # - 单个脚本体积严格控制在 ~808KB（含离线字体）
```

---

## 🚀 常用开发与构建命令

本项目使用 [Bun](https://bun.sh) Workspaces 进行统一包管理与构建。

```sh
# 1. 安装所有依赖并建立 Workspace 软链
bun install

# 2. 核心引擎独立构建
bun run build:core

# 3. 启动开发服务器
bun run dev:web         # 启动 React 网页端 (http://localhost:5173)
bun run dev:lite        # 启动轻量打样台 (http://localhost:5174)

# 4. 构建油猴脚本
bun run build:userscripts
# 产物输出在 apps/userscripts/dist/:
#   - ai-studio-export-png.user.js
#   - qwen-export-png.user.js

# 5. 全量一键端到端构建 (Core + Lite + Web + Userscripts)
bun run build:all
```

---

## 📦 模块契约与职责边界

| 模块 | 角色定位 | 依赖关系 | 输出产物 |
| :--- | :--- | :--- | :--- |
| **`packages/core`** | 底层渲染内核 | 无 UI 框架依赖 | `dist/index.js` (ESM), `dist/inkroll-core.iife.js` (IIFE), `styles` |
| **`apps/web`** | 交互表现层 | 依赖 `@inkroll/core` | 静态 Web 站点（可部署至 GitHub/Cloudflare Pages） |
| **`apps/lite`** | 引擎调试器 | 依赖 `@inkroll/core` | 调试工具静态页 |
| **`apps/userscripts`** | 宿主注入层 | 依赖 `@inkroll/core` | 自包含用户脚本（可发布至 Greasyfork） |

---

## 📄 开源许可证与分包授权协议

本项目采用**分包差异化许可（Split Licensing）**策略：

* **核心引擎 ([`packages/core`](./packages/core))**：基于 **[MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/) (Mozilla Public License 2.0)** 许可开源。
  * 具备文件级弱传染性（Weak Copyleft）：任何对 `core` 内部源码的直接修改与优化**必须向社区开源回馈**。
  * 允许私有/闭源软件以模块依赖形式自由引入调用，宿主业务代码不会被传染。
* **应用终端 ([`apps/*`](./apps))**：基于 **[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) (GNU Affero General Public License v3.0)** 许可开源。
  * 包含完整的 Web 站点界面与油猴下游脚本，严防未授权的云端服务化套壳与商业白嫖。
