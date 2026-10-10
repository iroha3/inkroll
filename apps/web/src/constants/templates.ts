import { TemplatePreset } from '../types';

export const DEFAULT_MARKDOWN_IMAGE_TEST = `👨‍💻 User

请你尽可能完整输出 markdown 的多种语法格式。我好用来测试下页面渲染 markdown 的效果！无需在文本代码块里输出。

🤖 Assistant

这是一份完整的 Markdown 语法测试文档，你可以将其复制到你的渲染器中进行测试。

---

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

**1. 文本格式**
**加粗文本** 或 __加粗文本__
*斜体文本* 或 _斜体文本_
~~删除线~~
***加粗斜体***
==高亮文本==（部分渲染器支持）
下标：H~2~O
上标：X^2^

**2. 列表**
**无序列表**

* 项目 A
* 项目 B
  * 子项目 B1
  * 子项目 B2

**有序列表**
1. 第一项
2. 第二项
3. 第三项

**任务列表**
- [x] 已完成任务
- [ ] 未完成任务

---

**3. 引用**
> 这是一段引用文本。
>
> 引用可以包含多行，
> 也可以包含**加粗**或其他格式。
> > 还可以嵌套引用。

---

**4. 代码**
行内代码：使用 \`print("Hello World")\` 即可。

代码块：

\`\`\`python
def hello_world():
    print("Hello Markdown!")
\`\`\`

---

**5. 链接与图片**
[点击这里访问 Google](https://google.com)

图片示例（若链接失效则显示占位）：
![Markdown Logo](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

---

**6. 表格**
| 姓名 | 年龄 | 职业 |
| :--- | :---: | ---: |
| 张三 | 25 | 工程师 |
| 李四 | 30 | 设计师 |

---

**7. 分割线**
***
---
___

---

**8. 数学公式 (LaTeX)**
行内公式：$E = mc^2$

块级公式：

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

---

**9. 特殊功能**
**脚注**
这是一个脚注测试[^1]。

[^1]: 这是脚注的具体注解内容。

**细节展开 (折叠)**

<details>
<summary>点击展开查看更多</summary>

这里是隐藏的内容，支持 Markdown 排版。
</details>

---

**10. 流程图 (Mermaid - 若支持)**

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -- 是 --> C[结果 1]
    B -- 否 --> D[结果 2]
\`\`\`

---

**测试完毕。** 如果某些格式（如数学公式、流程图）无法显示，说明该渲染器对 Markdown 的扩展支持有限。

`;

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'conversation-exact',
    name: '格式测试 / 语法测试',
    description: '完全一致的对话长图效果，包含完整的 Markdown 语法测试示例',
    content: DEFAULT_MARKDOWN_IMAGE_TEST,
    config: {
      showTitle: false,
      titleText: '',
      showRoleBadges: true,
      userBadgeText: 'User',
      userBadgeIcon: '👨‍💻',
      assistantBadgeText: 'Assistant',
      assistantBadgeIcon: '🤖',
      cardWidth: 500,
      padding: 'normal',
      theme: 'classic-white',
      showWatermark: true,
      watermarkText: 'By InkRoll',
    },
  },
  {
    id: 'tech-article',
    name: '技术笔记 / 思考干货',
    description: '适合分享长文、知识总结与代码片段的高清长图',
    content: `# 🚀 React 19 新特性完全解析

React 19 带来了许多激动人心的更新，显著提升了开发体验与应用性能。

---

### 1. Actions 与 useActionState
在 React 19 中，你可以直接在 \`<form>\` 中使用异步函数处理数据提交，系统会自动管理 **Pending** 和 **Error** 状态：

\`\`\`tsx
const [error, submitAction, isPending] = useActionState(
  async (previousState, formData) => {
    const error = await updateName(formData.get("name"));
    if (error) return error;
    return null;
  },
  null
);
\`\`\`

> 💡 **小技巧**：搭配 \`useOptimistic\` 可以在网络请求未返回前优先在界面展示预期数据！

---

### 2. 性能对比

| 特性 | React 18 | React 19 |
| :--- | :--- | :--- |
| 表单提交 | 手动管理状态 | 原生 Action 绑定 |
| 客户端组件 | 传统导入 | 编译器自动优化 |
| 资源加载 | link 标签手动引入 | 声明式资源预加载 |

---

- [x] 升级依赖版本
- [x] 测试 Server Components
- [ ] 迁移旧版 Context API

*发布于 2026年8月 · 个人技术专栏*`,
    config: {
      showTitle: false,
      titleText: 'Technical Notes',
      showRoleBadges: false,
      cardWidth: 520,
      padding: 'spacious',
      theme: 'classic-white',
      showWatermark: true,
      watermarkText: 'By InkRoll',
    },
  },
  {
    id: 'minimal-quote',
    name: '金句卡片 / 读书笔记',
    description: '简约精美的单张读书随笔或灵感卡片',
    content: `# 📖 极简生活法则

> "简单不是少，而是刚好。" —— 密斯·凡德罗

人生就像清理磁盘，定期清理不重要的杂物，才能给真正重要的事情腾出空间。

---

### 核心三原则：

1. **聚焦**：同时只做一件事，做到极致。
2. **断舍离**：不执着于过往，不焦虑于未来。
3. **沉淀**：每天留出 30 分钟无打扰思考时间。

==真正的自由，是拥有拒绝的权利。==`,
    config: {
      showTitle: false,
      titleText: '',
      showRoleBadges: false,
      cardWidth: 460,
      padding: 'spacious',
      theme: 'kami-paper',
      showWatermark: true,
      watermarkText: 'By InkRoll',
    },
  },
  {
    id: 'blank',
    name: '空白文档 / 自由创作',
    description: '从零开始，自由书写',
    content: '',
    config: {},
  },
];
