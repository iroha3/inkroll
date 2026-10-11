<div align="center">

# 墨卷 · InkRoll

<p align="center">
  <strong>墨下生花，一卷成图 —— 专为优雅阅读而生的出版级 Markdown 长图排版引擎</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL_3.0-blue.svg?style=flat-square" alt="AGPL 3.0 License" /></a>
  <a href="./packages/core/LICENSE"><img src="https://img.shields.io/badge/Core-MPL_2.0-orange.svg?style=flat-square" alt="MPL 2.0 License" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Runtime-Bun-black.svg?style=flat-square&logo=bun" alt="Bun" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/UI-React_19-61DAFB.svg?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript" alt="TypeScript" /></a>
</p>

[✨ 在线体验网页版](#-在线体验) · [📦 油猴脚本安装](#-油猴长图脚本) · [🏛️ 开发者架构文档](./docs/ARCHITECTURE.md) · [📜 协议说明](#-开源许可证与分包协议)

</div>

---

## 🌟 为什么选择墨卷？

日常在社交媒体、社群或知识库分享技术笔记与读书随笔时，普通的截图往往充满生硬的工业黑体、断行错乱与刺眼的冷白背景。

**墨卷 (InkRoll)** 汲取传统纸质出版物美学与现代渲染管线，将纯文本 Markdown 一键转化为极具温度与人文质感的长图卡片。

```
  Markdown 源码 ────────►  @inkroll/core ────────► 视网膜级 PNG / 剪贴板
 (公式 / 图表 / 笔记)        (统一排版事实源)            (微信 / 即刻 / 小红书)
```

---

## ✨ 核心特性

| 特性 | 说明 |
| :--- | :--- |
| 📜 **Kami 和纸美学** | 采用沉稳墨水蓝强调色、温润羊皮纸底色，配合严谨的跨平台衬线字体降级体系（Charter / Georgia / 思源宋体），告别生硬工业黑体。 |
| ⚡ **3x 超清无损导出** | 独创 SVG foreignObject 视网膜光栅化渲染，锁定 3x 超清无损 PNG 输出，无任何 JPEG 模糊压缩噪点；支持一键复制到剪贴板。 |
| 🧮 **全离线公式与图表** | 全离线 KaTeX 数学公式渲染（零网络外链依赖，彻底防范导出白屏）+ Mermaid 流程图与时序图扩展支持。 |
| 🛡️ **严格防污染隔离** | 核心排版引擎 `@inkroll/core` 作为单一事实源，零 UI 框架依赖，彻底阻断宿主网站的全局 CSS 渗透污染。 |
| 🔌 **多形态分层消费** | 既是全功能分栏 Web 编辑器，也是体积严格压制在 ~808KB 的全自包含 Greasyfork 油猴长图导出脚本。 |
| ⚖️ **务实双重开源许可** | 渲染核心 MPL-2.0（弱传染、促生态、允许闭源模块安全引用）；应用端 AGPL-3.0（封死整站套壳与商业白嫖）。 |

---

## 🎨 排版主题一览

墨卷内置针对不同阅读场景精细调校的 8 款主题体系：

* **Kami 和纸 (Kami Paper)**：*推荐*，受 tw93/Kami 启发的出版物美学，沉稳墨水蓝搭配温润和纸底色与柔和水彩染高亮。
* **经典纯白 (Classic White)**：极简干净、现代高可读性通用排版。
* **暖调纸张 (Warm Paper)**：柔和护眼、适合长篇随笔阅读。
* **松墨黛绿 (Forest Paper)**：深沉雅致的东方古典色调。
* **柔蓝印记 / 淡雅薰衣草**：轻快明亮、适合年轻化内容传播。
* **极简暗黑 / 翡翠深邃**：专为夜间与代码块干货打造的深色视界。

---

## 📦 架构生态与形态矩阵

墨卷采用现代 Monorepo 架构进行分层开发与工程管理：

```
inkroll-monorepo/
├── packages/
│   └── core/                 # 核心绘图引擎（Vanilla TypeScript，MPL-2.0）
│                             # - Markdown 增强解析、KaTeX 离线保护、排版 CSS 事实源
└── apps/
    ├── web/                  # 豪华版：React 19 全功能 Web 编辑器 (AGPL-3.0)
    ├── userscripts/          # 油猴脚本：Google AI Studio / 通义千问导出扩展 (AGPL-3.0)
    └── lite/                 # 调试打样台：轻量排版基准测试页
```

> 详细架构分层设计、模块契约与本地构建命令，请参阅：  
> 📖 **[Monorepo 架构与开发者指引文档](./docs/ARCHITECTURE.md)**

---

## 🚀 极速起步 (开发者)

本项目使用 [Bun](https://bun.sh) 进行统一包管理：

```sh
# 安装依赖
bun install

# 启动 React Web 开发服务器 (http://localhost:5173)
bun run dev:web

# 核心渲染引擎独立构建
bun run build:core

# 全量端到端构建 (Core + Lite + Web + Userscripts)
bun run build:all
```

---

## 📄 开源许可证与分包协议

本项目采用**分包差异化许可（Split Licensing）**策略：

* **渲染核心引擎 ([`packages/core`](./packages/core))**：基于 **[MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/) (Mozilla Public License 2.0)** 许可开源。
  * 具备文件级弱传染性（Weak Copyleft）：任何对 core 内部源码的直接修改与优化**必须向社区开源回馈**。
  * 允许私有或闭源商业软件以模块依赖形式自由引入调用，宿主业务代码不会被传染。
* **应用终端与脚本 ([`apps/*`](./apps))**：基于 **[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) (GNU Affero General Public License v3.0)** 许可开源。
  * 包含完整的 Web 站点界面与油猴下游脚本，严防未授权的云端服务化套壳与商业白嫖。

---

## 🙏 致敬与鸣谢 (Credits)

* 🎨 **[tw93/Kami](https://github.com/tw93/kami)**：墨卷的 Kami 和纸主题、沉稳墨水蓝强调色及克制出版物排版哲学深受 tw93 探索的启发。在此致敬！
* 📐 **[KaTeX](https://katex.org/)** & **[markdown-it](https://github.com/markdown-it/markdown-it)**：提供强大的底层数学公式与标记语言解析基石。
* 📊 **[Mermaid](https://mermaid.js.org/)**：为卡片排版提供优雅的图表渲染支持。
