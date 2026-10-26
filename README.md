# dsh-companion · 鲸屋

给 DSH 中的角色一个独立工作区：保存人设、日记和长期记忆，按需接入 Minecraft、QQ、B站与自备的小黑盒工具。只配置人设即可开始 DSH 对话，其余通道可以一直留空。

> **这不是独立 App。** 它是 [DeepSeek Harness](https://github.com/deepseek-ai/dsh)（DSH）的**插件**——没有 DSH 就装不上、也跑不起来。它不是模型，不提供对话能力，用的是你自己 DSH 里已经配好的模型。

当前版本 `0.7.3`，MIT 许可，源码与发行包都在本仓库。

## 为什么用它

| 没有它 | 有了它 |
|---|---|
| 每次开新会话，角色都像第一次认识你 | 人设、日记、长期记忆存在独立目录；关掉 DSH 再开，还是同一个她 |
| 人设挤在系统提示词里，超长被悄悄截断 | 人设是独立文件，超过 **4000 个 UTF-16 单位**会明确拒绝保存，不静默截断 |
| 角色只能聊天 | 可选接 Minecraft（能进世界走动、挖、放、打怪）、QQ（私聊找你）、B站、小黑盒；**不接任何一个也能正常聊天** |
| 想让她做点什么，只能一条条下指令 | 可选的三项日常：自己接着做、主动找你、写自己的日记 |
| 性格写死在代码里 | 行动层是一个可编辑的 `.mjs` 文件，**角色自己能改**（试用端口验过才生效，失败可回滚） |

## 前置条件

必装，缺一不可：

| 项 | 要求 | 说明 |
|---|---|---|
| **DSH** | 能自己正常聊天 | 插件挂在 DSH 上运行，不自己起服务；DSH 关掉插件就停了 |
| **模型** | 宿主里已配置、能成功回复 | 复用 DSH 的模型，**不需要另外填 key** |
| **Node.js** | 22 或更高 | 插件工具进程使用；可用 `runtime.nodePath` 或 `DSH_NODE` 指定 |
| **操作系统** | **Windows** | 这是首个验证平台，其他系统未验证 |
| 磁盘空间 | 约 1 GB 起 | 开 Minecraft 世界再占几百 MB |

不装 DSH 的人用不了这个插件——这一点请不要误会成"下载即用"。

## 四个通道各需要什么

**全部可选。** 只想要"能记住你的对话角色"，装完填人设就行，下面四个都可以一直留空。

| 通道 | 你要准备 | 插件替你做 | 现状 |
|---|---|---|---|
| **Minecraft** | 三种里选一种：① 什么都不用，插件帮你新建世界；② 自己开游戏内「对局域网开放」；③ 已有服务端目录。要进世界玩还需要**你自己的 Java 版客户端和游戏授权** | 自动选支持的版本、按需准备对应 Java（26.1 用 Java 25，1.21.8 用 Java 21）、下载官方服务端、起停世界、让角色进入、换版本时保留旧世界 | 已实测 1.21.4 / 1.21.8 / 26.1 |
| **QQ** | **两个 QQ 号**（你的 + 角色专用的那个）、手机装 QQ 用来扫码 | 下载并校验官方便携版 NapCat（固定版本 + sha256，**不执行安装器、不要管理员权限**）、解压后直接运行、自动写入连接参数、隔离自己的数据目录 | 便携版启动和重启已实测；**真实账号的完整往返没跑通** |
| **B站** | 一个希望角色使用的 B站账号，用 App 扫码确认 | 获取登录二维码、本地保存登录态、提供一套工具链（看视频内容、评论、动态、私信、弹幕、额度） | 登录与只读能力已测；写操作取决于平台返回 |
| **小黑盒** | **你自己准备的** Node CLI（本仓库不分发） | 用你指定的 CLI，展示返回状态 | 只做调用与展示，**不含任何签名实现或内部常量** |

### 各通道的额外说明

**QQ / B站账号风险提示：** 新建小号或多年未使用的小号可能触发平台风控、验证或账号限制。本插件尚未在长期使用的账号上进行测试，**不推荐使用主号**。请自行评估并承担使用风险；本插件不承担由此产生的账号限制或其他损失。QQ 小号还可能因风控或风险提醒，需要每隔一段时间重新扫码登录，不能保证登录态长期有效。

**QQ / Bilibili account risks:** New secondary accounts, or accounts unused for years, may trigger risk checks, verification, or restrictions. This plugin has not been tested with accounts in long-term regular use. **Using your main account is not recommended.** Assess and accept the risks yourself; this plugin accepts no responsibility for resulting restrictions or other losses. Secondary QQ accounts may require periodic QR sign-in after security alerts; continued login validity is not guaranteed.

**平台协议风险：** 用第三方客户端或自动化方式使用 QQ、B站、小黑盒，可能**违反这些平台的用户协议**。平台有权因此限制或封停账号——这是平台条款层面的风险，不是法律诉讼，但后果由你承担。插件只在你本机调用公开协议和你自己准备的工具，不绕过任何平台的安全机制，也不代替你做出这个决定。B站与小黑盒的自动化操作特别容易被判定为异常；请自行判断是否值得。

**Platform terms:** Using third-party clients or automation with QQ, Bilibili or Heybox may **violate those platforms' terms of service**. They may restrict or ban the account as a result — that is a contractual risk rather than a legal claim, but the consequence is yours. The plugin only speaks public protocols from your own machine and invokes tools you provide; it does not bypass platform security or make this decision for you.

- **Minecraft**：服务端 jar、Java、NapCat 都在你**明确确认**后从官方来源下载并校验；公开包里不含这些东西。角色身体第一次由包内模板生成到 `runtime/mc/mc-daemon.mjs`。
- **QQ**：插件使用 [OneBot v11](https://github.com/botuniverse/onebot-11) 公开协议；不读取、不修改其他 QQ 插件，不接管宿主全局消息钩子。私聊默认只认你配的主人号。
- **B站**：视频抽帧需要 **FFmpeg** 在 PATH 里或设置 `FFMPEG`；普通登录检测不需要。
- **小黑盒**：契约是 `node <你的CLI> whoami --json`，stdout 只输出一个 JSON。工具必须支持 `DSH_COMPANION_CREDENTIALS` 环境变量才能用插件保存的凭据。
- **可选媒体处理**：Python / Pillow 只用于额外的图片处理能力检测；缺失只影响对应功能，插件不会替你装。

## 隐私

**插件不上传任何数据**：没有账号服务器、没有遥测、没有崩溃上报。日记、记忆、人设、媒体和凭据都只存在你的数据目录里；凭据不出现在任何接口响应中。对外请求只发往硬编码白名单里的官方下载源，且每个都需要你明确确认。

**你和角色的对话会发给你 DSH 里配置的模型服务方**——这是 DSH 的行为，不是插件记录的。生成内容由该模型与平台负责。

完整清单（数据位置、请求目标、删除方式、你的责任）见 [隐私与数据](docs/privacy.md)。 / The plugin uploads nothing and has no telemetry; see [privacy](docs/privacy.md) for data locations, the outbound host allowlist and deletion.

## 明确的限制

写在这里，免得装完才发现。

**平台与验收**

- 只在 **Windows** 上验证过；macOS / Linux 未验证。
- **首次安装有过一次真实用户验证（2026-10-26）**：一位完全没有 Node 基础的 Windows 用户，按说明让 DSH 完成安装，并接好了 Minecraft 与 QQ，没有卡住。
- **B站仍未验证**：那次验证的对方没有小号，扫码之后的真实往返没跑过。
- QQ 验证到「能连上、能往返」，**长期稳定性（掉线重连、多久要重新扫码）没有验证**。
- 这是一次验证，不是长期回归。0.6.0 之后加的功能（自主循环、三类回顾、空世界自动关）**还没有经过真实唤醒的验证**。

**功能边界**

- **人设上限 4000 个 UTF-16 单位**（汉字通常占 1，部分 emoji 占 2）。超了拒绝保存，不会截断。
- 三个日常功能（自己接着做 / 主动找你 / 写日记）**默认全关**，而且需要另装 `dsh-proactive@0.3.1`；缺了会在面板上明示不可用。
- Paper 皮肤**只支持 1.21.8 build 60** 这一个版本；其他版本仍走原版。
- 插件**不生成语音**；媒体库不会仅因上传文件就自动发到 QQ 或别的平台。
- 小黑盒**不含签名实现**，你得自己有可用的 CLI。
- 模型调用产生的费用由你自己承担，插件不提供额度。

**行为约束**

- 外部世界（你自己起的服务端）可以由插件识别，但**关闭要回原控制台**；插件不会强制结束归属不明的 Java 进程。
- 身体是可以被改的：没改过的身体升级时自动更新（先备份），**改过的一个字都不动**，只留 `runtime/mc/BODY-UPGRADE.md` 说明。

## 安装

**先确认 DSH 自己能正常聊天**，再来装插件。插件不自带模型。

两种装法，任选一种：

**A. 用发行包（推荐）**

从 [Releases](https://github.com/Red0tsnow/dsh-companion/releases) 下载 `dsh-companion-0.7.3.tgz`，在已安装 DSH 的终端里：

```powershell
dsh plugin --profile desktop add ./dsh-companion-0.7.3.tgz
```

**B. 从源码自己打包**

```powershell
npm ci
npm run build
npm test
npm run check
npm pack
dsh plugin --profile desktop add ./dsh-companion-0.7.3.tgz
```

装完**重启该 DSH profile**。插件入口在 DSH 设置里的「鲸屋 / Whale House」。

默认 profile 名是 `desktop`，用别的 profile 就替换掉。开发时也可以直接链源码目录：`dsh plugin --profile desktop add "link:<插件绝对路径>"`。

## 第一次使用

**完全没接触过？** 看 [从零开始：第一次用](docs/first-run.md)——按面板上真实出现的按钮一步步写，包含"看到什么、点哪里"，以及卡住时该查哪个日志。

下面是速览：

1. 打开面板，填写角色名、关系、语气，编辑并保存人设。可载入空白模板或脱敏示例。
2. 人设上限为规范化换行后的 **4000 个 UTF-16 单位**；通常汉字占 1，部分 emoji 占 2。界面和服务端均检查，超限不会保存或静默截断。
3. 点击“打开角色对话”。会话身份保存在角色数据目录，重启后继续使用同一个身份。
4. 需要哪个通道，就点击对应的“开始一起玩”“连接 QQ”或“扫码连接 B站”。跟着向导完成准备；技术字段收在“高级设置”中。灰色“未接入”是正常状态。
5. “角色写的”查看公共日记、私人日记、手札、长期记忆、印象、便签和睡前一句。页面可见时每 10 秒刷新。

## 通道细节与安全

- **QQ 只接受你配置的主人私聊**；群聊可在高级设置中填写允许的群号并 @ 角色。WS token 与 Cookie 存在独立凭据文件里，读取配置只返回"是否已设置"。
- 外部组件（Java、Minecraft 服务端、NapCat）都在你**明确确认后**从官方来源下载并校验；运行副本与安装包分开。NapCat 固定版本与哈希，版本对不上就拒绝下载，等插件更新。公开包不含 Java、Minecraft jar、NapCat、QQ 或小黑盒签名实现。
- 新手步骤见 [连接向导](docs/onboarding.md)，高级配置与故障说明见 [使用指南](docs/usage.md)。

## 角色的新能力 / Character capabilities

| 能力 / Capability | 使用方式与边界 / Use and limits |
|---|---|
| **会自己接着做**（可关） / Keep going independently (optional) | Minecraft 身体在线且空闲时接着做一小步，连续最多十次；**世界里没有别人时不会唤醒**；默认关闭 / Online, idle world only; **never wakes while no other player is in the world**; up to ten consecutive wakes; off by default |
| **会主动找你**（独立开关，一天一条） / Think of you (independent switch, once daily) | 随机窗口、40 字以内；普通角色私聊，允许安静跳过 / Random window, at most 40 characters in the ordinary private conversation; silence is allowed |
| **会写自己的日记**（一天一段，必须新起日期） / A personal diary (one newly dated entry daily) | 工具自动添加日期和账本，连续三天没写会提示 / Tool-managed headings and ledger, with a notice after three empty days |

世界里**没有别人超过 15 分钟**（可在面板改成任意值，`0` 表示不关）就自动关掉世界，免得空世界一直占内存。她正在做任务时不会关。 / When nobody has been in the world for 15 minutes (configurable, `0` disables) the world is shut down so an empty world does not keep holding memory. A task in progress is never interrupted.

日常唤醒依赖**可选**的 `dsh-proactive@0.3.1` 文件表工具；不随包安装，也不改它的额度或安静时段。缺少能力会明示不可用，核心对话照常使用。身体还提供 `mc snapshot`、后台 `mc do`、`mc places` 和技能结果验收。完整步骤见 [连接与日常使用](docs/onboarding.md)。 / Wake features need the optional dsh-proactive 0.3.1 schedule-file tools. The provider is neither bundled nor reconfigured. Snapshot, background intents, named places and skill acceptance are also available.

## 数据、迁移和升级

默认数据根目录为 `$DSH_HOME/companion`；未设置 `DSH_HOME` 时使用用户的 `.dsh/companion`。可设置 `DSH_COMPANION_HOME` 或宿主插件配置 `dataDir` 改用独立目录。角色工作区位于其中的 `workspace`，与安装包分开。

人设原件是 `workspace/AGENTS.md`，`persona.md` 是插件管理的镜像。`secrets.json` 是凭据来源；`bili/credentials.json`、`xhh/xhh-cookie.json` 是工具使用的派生视图，保存凭据时同步，不在配置响应中返回。请备份整个数据目录，勿把它提交到公开仓库。

迁移默认只预览：

```powershell
node tools/migrate.mjs --source "<旧DSH数据目录>" --target "<新角色数据目录>"
node tools/migrate.mjs --source "<旧DSH数据目录>" --target "<新角色数据目录>" --apply
```

仅在确实需要复制凭据时添加 `--credentials`。原件保留、目标已有文件保留，旧会话日志不自动搬运。迁入闹钟默认停用，需检查路径、时区与目标后再启用。完整说明见 [迁移与回滚](docs/migration.md)。

**备份**：数据全在这一个目录里——`workspace`（人设、日记、记忆、便签、技能、地点）、`runtime`（运行中的身体与日志）、`schedules`、`secrets.json` 和各通道凭据。磁盘坏了、系统重装或误删，就一起没了；没有云端，也没有第二份。备份就是把整个目录复制走（含凭据，放在自己的加密盘或私有位置）：

```powershell
# 先退出 DSH（或至少停掉身体和世界），避免复制到写了一半的文件
$data = "$env:USERPROFILE\.dsh\companion"    # 改过 DSH_COMPANION_HOME/dataDir 就换成实际路径
Copy-Item $data "$env:USERPROFILE\Backup\companion-$(Get-Date -Format yyyyMMdd-HHmm)" -Recurse
```

恢复：退出 DSH，把备份目录放回原路径（目录名仍是 `companion`），再启动。升级前、换机器前各备份一次。

升级：备份数据目录，安装新版包并重启 DSH。运行中的身体位于 `runtime/mc`，角色自行修改的身体不会被新版模板静默覆盖。

卸载：`dsh plugin --profile desktop remove dsh-companion`，然后重启该 profile。卸载保留角色数据；Minecraft 世界请先在面板显式关闭。回滚时安装保留的旧版 `.tgz`，必要时恢复自己备份的数据目录。

## 开发与验证

`npm run dev` 启动隔离的本地面板预览；它使用真实插件服务，未接入 DSH 时不会伪造对话成功。`npm test` 运行行为测试；`npm run check` 检查发布源码语法、相对导入、个人路径与身份泄漏、QQ 实现边界及小黑盒签名排除规则。`npm pack --dry-run --json` 可查看发行清单。

实现与测试限制见 [已知问题](docs/known-issues.md)。许可证为 [MIT](LICENSE)，自有源码改编记录与第三方依赖见 [NOTICE](NOTICE)。

## English quick start

Install the package into your DSH profile, restart DSH, and open **Settings → Whale House**. Save a persona, then open the character conversation. All four external channels are optional. Windows is the first validation target; DSH and its configured model must stay available.

The Minecraft guide offers a managed world with dynamic version selection, LAN discovery, or an existing server folder. Managed setup requires download and EULA confirmation. Paper skins are enabled only for the verified 1.21.8 build; apply a direct PNG URL while the managed world is running. NapCat uses its pinned portable archive with explicit version/hash confirmation and an isolated process data path. The guide supports restarting the helper and scanning a fresh QR code. Bilibili supports app QR login. Heybox requires your own CLI; no signing implementation or internal constants are shipped. The plugin reuses the host model and needs no additional API key. Missing evidence is shown as unknown.

Run migration without `--apply` to preview it. It preserves source files and existing destination files. Back up the companion data directory before upgrading. Uninstalling the plugin leaves that data intact. See [usage](docs/usage.md), [migration](docs/migration.md), and [verification](docs/verification.md) for current details and limits.
