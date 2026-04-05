
# AI 辅助编程实战指南：Claude Code, Gemini, Codex

这份指南将教你如何利用三种不同类型的AI工具来接管代码编写、调试和架构设计。

### 1. Claude Code：你的终端编程代理 (The Terminal Agent)

**定位：** 全能型项目经理/执行者。
**核心特点：** 它是 Anthropic 官方推出的 CLI 工具。它不仅仅是聊天，它是一个 **Agent（智能体）**。这意味着它有权限**读写文件、运行终端命令、执行 Git 操作**。

**如何上手：**
1.  **安装：** `npm install -g @anthropic-ai/claude-code`
2.  **启动：** 在终端输入 `claude`。
3.  **鉴权：** 需要绑定你的 Anthropic Console 账号。

**实战场景：**
*   **重构整个项目：**
    > *Prompt:* "遍历 `src/` 目录下所有的组件，把使用了 `React.createClass` 的老旧代码全部重构为 `Functional Components` 并使用 Hooks。修改前先运行测试，修改后再次运行测试确保没有破坏功能。"
    *   *Claude Code 的动作：* 它会自己 `ls` 找文件，自己 `cat` 读代码，自己 `vi` 改代码，然后自己跑 `npm test`。
*   **理解大型代码库：**
    > *Prompt:* "解释一下这个项目的认证流程是如何工作的？画出流程图。"
*   **修复 Bug：**
    > *Prompt:* "刚才的构建报错了（自动读取上一条 stderr），请帮我修复并提交 git commit。"

**指南建议：** 把 Claude Code 当作一个**坐在你旁边的初级/中级工程师**。你可以把繁琐的、跨文件的脏活累活直接丢给它在终端里跑。

---

### 2. Gemini-CLI / Gemini Models：长上下文之王 (The Context King)

**定位：** 代码库分析师与多模态助手。
**核心特点：** Google 的 Gemini 模型（特别是 1.5 Pro）拥有**超大上下文窗口（100万~200万 tokens）**。这意味着你可以把**几本书那么厚的整个代码库**一次性喂给它，而不需要做复杂的检索增强（RAG）。

*注：Gemini-CLI 通常指通过 Google Vertex AI CLI 或者社区封装的工具调用 Gemini API。*

**实战场景：**
*   **全库级问答（God Mode）：**
    *   当你接手一个几十万行代码的旧项目（屎山），完全看不懂逻辑时。
    *   *做法：* 将整个代码库打包（或使用支持读取文件夹的 Gemini 工具），问它：“如果我要在支付模块增加微信支付功能，我需要修改哪些文件？请列出具体位置。”
    *   *优势：* Codex 或 Claude 的网页版可能吃不下这么多代码，但 Gemini 可以。
*   **多模态编程（看图写代码）：**
    *   *做法：* 截一张 UI 设计稿的图，或者截一个报错的弹窗图。
    *   > *Prompt:* "把这张截图转换成 HTML/Tailwind CSS 代码，保持像素级还原。"

**指南建议：** 使用 Gemini 主要用于**“读”**。当你要进行大规模架构分析、或者需要 AI 理解几千个文件之间的关联时，Gemini 是首选。

---

### 3. Codex (GitHub Copilot)：IDE 里的实时副驾驶 (The Autocompleter)

**定位：** 实时代码补全与微操。
**解释：** **Codex** 是 OpenAI 的模型名称，它是 **GitHub Copilot** 的核心引擎。现在的 Copilot 实际上混合使用了 Codex、GPT-4 和专门的轻量级模型。

**实战场景：**
*   **幽灵文本（Ghost Text）：**
    *   你只需要打出函数名 `def calculate_mortgage_payment(`，Codex 会自动补全剩下的十几行逻辑。
    *   *技巧：* 通过写**清晰的注释**来引导补全。先写注释 `// 获取用户列表并按活跃度排序`，然后换行，代码自然就出来了。
*   **行内对话（Chat in Editor）：**
    *   选中一段复杂的正则代码，按 `Cmd+I` (VS Code)，输入：“这段代码是什么意思？帮我加个注释。”
*   **根据上下文预测：**
    *   如果你在 A 文件里定义了一个 API 接口，转到 B 文件去调用时，Codex 会自动知道那个接口的参数结构。

**指南建议：** Codex/Copilot 应该**永远开启**。它是微观层面的提效工具，让你少敲键盘。它不需要你像指挥 Claude 那样发号施令，它更像是你的思维延伸。

---

### 综合实战工作流（The Ultimate Workflow）

要达到最高效率，建议混合使用这三类工具：

**第一步：架构与理解（Gemini / LLM Chat）**
*   如果你要开新项目或重构旧项目，先用 **Gemini** 分析需求或现有代码库。
*   *任务：* "阅读这些文档，生成一个项目文件结构树。"

**第二步：脚手架与粗活（Claude Code - Terminal）**
*   在终端使用 **Claude Code** 生成基础代码、配置文件、安装依赖。
*   *任务：* "claude: 初始化一个 Next.js 项目，配置好 Tailwind 和 ESLint，并创建一个带有登录页面的基础路由。"

**第三步：具体编码（Codex / Copilot - IDE）**
*   进入 VS Code，开始写具体的业务逻辑。利用 **Codex** 的自动补全快速填充函数体。
*   *任务：* 按 Tab 键狂奔。

**第四步：调试与测试（Claude Code / Copilot）**
*   遇到报错，直接在终端让 **Claude Code** 修复，或者在 IDE 里问 **Copilot** "为什么这里会空指针？"

### 总结

*   **Claude Code** = **你的外包团队**（给指令，它去干一整套活，操作终端）。
*   **Gemini** = **你的架构师**（读懂海量文档和代码，分析全局）。
*   **Codex (Copilot)** = **你的智能键盘**（实时补全，极大提升手速）。

你需要立刻做的是：
1.  在 VS Code 安装 **GitHub Copilot**。
2.  在终端安装 **Claude Code** 并尝试用它改几个 Bug。
3.  在遇到搞不定的超大项目时，想起 **Gemini** 的长上下文能力。