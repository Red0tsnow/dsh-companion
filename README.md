# dsh-companion · 同居者

给 DSH 中的角色一个独立工作区：保存人设、日记和长期记忆，按需接入 Minecraft、QQ、B站与自备的小黑盒工具。只配置人设即可开始 DSH 对话，其余通道可以一直留空。

首个验证平台为 Windows；需要 DSH 持续运行及宿主中可用的模型。当前版本为 `0.6.0`，加入身体分层与陪伴日常，保留版本选择、三种世界来源和 Paper 皮肤流程。先确认 DSH 自己能正常聊天。插件用宿主已有的模型，不需要另外填 key。本次按要求不跑功能回归，只检查构建和包加载；0.5.2 历史证据不代表本版本已验收。

## 安装

从源码准备插件包：

```powershell
npm ci
npm run build
npm test
npm run check
npm pack
```

在已安装 DSH 的终端中安装生成的包，并重启该 DSH profile：

```powershell
dsh plugin --profile desktop add ./dsh-companion-0.6.0.tgz
```

开发时也可安装本地目录：`dsh plugin --profile desktop add "link:<插件源码绝对路径>"`。默认 profile 名为 `desktop`；使用其他 profile 时替换该名称。插件入口位于 DSH 设置中的“同居者 / Companion”。

## 第一次使用

1. 打开面板，填写角色名、关系、语气，编辑并保存人设。可载入空白模板或脱敏示例。
2. 人设上限为规范化换行后的 **4000 个 UTF-16 单位**；通常汉字占 1，部分 emoji 占 2。界面和服务端均检查，超限不会保存或静默截断。
3. 点击“打开角色对话”。会话身份保存在角色数据目录，重启后继续使用同一个身份。
4. 需要哪个通道，就点击对应的“开始一起玩”“连接 QQ”或“扫码连接 B站”。跟着向导完成准备；技术字段收在“高级设置”中。灰色“未接入”是正常状态。
5. “角色写的”查看公共日记、私人日记、手札、长期记忆、印象、便签和睡前一句。页面可见时每 10 秒刷新。

## 可选通道

| 通道 | 用户需要准备 | 插件负责 |
|---|---|---|
| Minecraft | 选择新建世界、游戏内对局域网开放或已有服务端 | 动态选择支持版本，准备对应 Java（26.1 使用 Java 25）；换版本保留旧世界。Paper 皮肤目前仅支持已验证的 1.21.8，开启世界并让角色进入后可粘贴 PNG 直链应用；默认原版不受影响 |
| QQ | 两个 QQ 号：你的，和角色用的那个 | 下载并校验官方便携版 NapCat、解压后直接运行（不执行安装器、不要管理员权限）、自动写入连接参数；扫码登录由你完成 |
| B站 | 用希望角色使用的账号在 B站 App 扫码确认 | 获取登录二维码，在本地保存确认后的登录态，并提供自有工具链 |
| 小黑盒 | 用户自行提供的 CLI 路径 | 调用 CLI、展示返回状态；不分发签名代码或内部签名常量 |

QQ 只接受配置的主人私聊；群聊可在高级设置中填写允许的群号并 @ 角色。WS token 与 Cookie 在独立凭据文件中保存，读取配置只返回“是否已设置”。新手步骤见 [连接向导](docs/onboarding.md)，高级配置与故障说明见 [使用指南](docs/usage.md)。

外部组件在用户明确确认后从官方来源下载并校验；运行副本与安装包分开。NapCat 固定版本与哈希，解压后运行官方便携版，运行前需要你确认版本与哈希；版本对不上就拒绝下载，等待插件更新。公开包不含 Java、Minecraft jar、NapCat、QQ 或小黑盒签名实现。

## 角色的新能力 / Character capabilities

| 能力 / Capability | 使用方式与边界 / Use and limits |
|---|---|
| **会自己接着做**（可关） / Keep going independently (optional) | Minecraft 身体在线且空闲时接着做一小步，连续最多十次；默认关闭 / Online, idle world only; up to ten consecutive wakes; off by default |
| **会主动找你**（独立开关，一天一条） / Think of you (independent switch, once daily) | 随机窗口、40 字以内；普通角色私聊，允许安静跳过 / Random window, at most 40 characters in the ordinary private conversation; silence is allowed |
| **会写自己的日记**（一天一段，必须新起日期） / A personal diary (one newly dated entry daily) | 工具自动添加日期和账本，连续三天没写会提示 / Tool-managed headings and ledger, with a notice after three empty days |

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

升级：备份数据目录，安装新版包并重启 DSH。运行中的身体位于 `runtime/mc`，角色自行修改的身体不会被新版模板静默覆盖。

卸载：`dsh plugin --profile desktop remove dsh-companion`，然后重启该 profile。卸载保留角色数据；Minecraft 世界请先在面板显式关闭。回滚时安装保留的旧版 `.tgz`，必要时恢复自己备份的数据目录。

## 开发与验证

`npm run dev` 启动隔离的本地面板预览；它使用真实插件服务，未接入 DSH 时不会伪造对话成功。`npm test` 运行行为测试；`npm run check` 检查发布源码语法、相对导入、个人路径与身份泄漏、QQ 实现边界及小黑盒签名排除规则。`npm pack --dry-run --json` 可查看发行清单。

实现与测试限制见 [已知问题](docs/known-issues.md)。许可证为 [MIT](LICENSE)，自有源码改编记录与第三方依赖见 [NOTICE](NOTICE)。

## English quick start

Install the package into your DSH profile, restart DSH, and open **Settings → Companion**. Save a persona, then open the character conversation. All four external channels are optional. Windows is the first validation target; DSH and its configured model must stay available.

The Minecraft guide offers a managed world with dynamic version selection, LAN discovery, or an existing server folder. Managed setup requires download and EULA confirmation. Paper skins are enabled only for the verified 1.21.8 build; apply a direct PNG URL while the managed world is running. NapCat uses its pinned portable archive with explicit version/hash confirmation and an isolated process data path. The guide supports restarting the helper and scanning a fresh QR code. Bilibili supports app QR login. Heybox requires your own CLI; no signing implementation or internal constants are shipped. The plugin reuses the host model and needs no additional API key. Missing evidence is shown as unknown.

Run migration without `--apply` to preview it. It preserves source files and existing destination files. Back up the companion data directory before upgrading. Uninstalling the plugin leaves that data intact. See [usage](docs/usage.md), [migration](docs/migration.md), and [verification](docs/verification.md) for current details and limits.
