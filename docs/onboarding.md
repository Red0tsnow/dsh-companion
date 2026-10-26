# 新手连接向导

## 0.6.0 身体与陪伴日常 / Body and daily companionship

本节是新功能的使用说明，未做实际世界或唤醒验收。 / These are usage instructions, not a claim of live-world or wake acceptance.

**新安装**会复制新版身体。**旧版本升级**分两种：没改过的身体（跟历史发行版一字不差）会**自动**换成新版，换之前先在 `runtime/mc/body-backups/` 留一份备份；改过的身体**一个字都不动**，只留一份 `runtime/mc/BODY-UPGRADE.md` 说明，想升级就按下面的流程自己走——先正常让身体离开世界，再在角色对话中要求它执行 `node companion.mjs body prepare-update`、`body diff`。确认需要保留的自改内容后，使用已有的 `body test`、`body apply` 流程安装新版；失败可 `body rollback`。`prepare-update` 遇到已有待编辑副本会拒绝覆盖。 / Fresh installations receive the new body. Upgrades work in two ways: an untouched body (byte-identical to an earlier release) is replaced automatically, with a backup written first; a body the user edited is never touched — a `runtime/mc/BODY-UPGRADE.md` note explains how to update it through the existing prepare-update / diff / test / apply flow.

在角色工作区运行以下命令，也可以直接让角色代为使用。 / Run from the character workspace, or ask the character to use them.

```text
node companion.mjs mc snapshot --json
node companion.mjs mc do goto 12 65 30
node companion.mjs mc do follow Player 30
node companion.mjs mc do hunt 20
node companion.mjs mc do mine oak_log 3
node companion.mjs mc do idle 20
node companion.mjs mc do status
node companion.mjs mc stop
```

`snapshot` 一次读取位置、维度、朝向、血量、饥饿、昼夜、脚下三层、四向障碍、敌对生物、地点、背包和任务。`do` 默认最多等待 8 秒，随后返回 `running` 时任务仍在身体里执行；用 `do status` 查询。只有 `state:done` 才完成，`failed` 和 `running` 都不能声称成功。`--wait 0` 立即返回；卡住、断线、低血撤退或停止会明确失败。 / Snapshot combines perception and task state. Intents wait up to eight seconds by default, then continue in the background. Poll status; only `done` means success. Stuck, offline, retreat and cancellation are failures.

地点保存在角色数据根的 `places.json`，`spawn`、`death` 由新版身体自动记录。 / Named places live in the character data root; spawn and death are automatic.

```text
node companion.mjs mc places list
node companion.mjs mc places here home
node companion.mjs mc places add garden 12 65 30
node companion.mjs mc go home
node companion.mjs mc places rm garden
```

地点含维度，跨维度不会直接导航。`go` 没有真正到达就返回 `arrived:false`；身体离线时不冒报到达。 / Places include dimension; navigation cannot silently cross dimensions. An unfinished journey returns arrived:false.

技能仍使用 `skills new/run/list/rm`，另在数据目录 `runtime/mc/skills/<name>.expect.json` 写验收目标，例如： / Skills use a separate acceptance file:

```json
{"inventoryDelta":{"oak_log":3},"movedAtLeast":5,"healthAtLeast":10}
```

运行前后拍快照，所有条件同时满足才显示 ✓。没有条件显示 ⚠ 未验收；空条件、脚本失败、运行结束时任务仍在执行或差值不足显示 ✗。结果保存在 `runtime/mc/skills-state.json`。 / All criteria must pass against before/after snapshots. Missing criteria are unverified; empty criteria, script failures, running tasks and unmet changes fail.

面板的“陪伴日常”有三个独立开关。默认全关，不会偷偷使用额度。安装并启用 **dsh-proactive 0.3.1** 后，保存想启用的开关；它使用同一个角色会话的已注册工具，创建单文件句柄，文件原子写入数据根 `proactive/`。实际 `declaredEntries` 对上才显示接入完成。缺插件、工具受限或宿主接口不同会显示原因。请在 dsh-proactive 自己的面板设置每天额度、时区和安静时段。 / Three independent switches are off by default. Enable the optional provider, then save your choices. Registration and declared-entry counts determine actual status. Configure the provider's budget and quiet hours separately.

- **自己接着做**：只在新版身体在线、没有任务时生成世界唤醒；默认无人指令 180 秒、任务结束 60 秒、冷却 120 秒，连续最多十次；人的新指令重置连续次数。关世界就撤销对应文件订阅。 / Self-play is world-only, with idle/completion gates, cooldown and a ten-wake cap reset by human activity.
- **主动找你**：默认窗口从 10:00 开始，之后 13 小时内随机；修改为适合自己的时间，窗口不能跨天。随机延迟由提供方的 `cron + jitter_seconds` 计算，不另设随机定时器。落在普通 DSH 角色私聊，不作为世界事件，也不自动转发 QQ。 / Reach-out uses provider-owned cron plus jitter, in a same-day window. Replies stay in the ordinary DSH private conversation, not Minecraft or automatic QQ forwarding.
- **写日记**：默认 21:00，可改时间。与睡前一句独立；内容保存在 `workspace/diary.md`，账本 `workspace/diary.jsonl`。 / Diary time is configurable and independent of bedtime lines.

### 回头看自己 / Looking back at itself

三个开关共用「启用回顾」一个总开关，和上面三项**独立**，同样需要 dsh-proactive。默认关闭。它们解决的是同一个问题：人设、长期记忆、规则都不会自己更新，必须有固定时机回头看。 / Three switches share one master toggle, independent of the three above. Same provider, off by default. They exist because a persona, its long-term memory and its rules never update on their own — something has to make room to look back.

| 开关 | 节奏 | 做什么 | 记账 |
|---|---|---|---|
| **整理长期记忆** | 每月 N 号（默认 1 号 11:00） | 日记里 30 天前的段落压成三行写进长期记忆，原文进 `archive/` | `reflect mark memory "…"` |
| **人设回顾** | 每周某天（默认周日 21:00） | 这周有没有哪句话让她觉得「我不是这样想的」；**想不清楚可以跳过** | `reflect mark persona "…"` 或 `--skip` |
| **规则检查** | 每月 N 号（默认 15 号 21:00） | 规则有没有跟实际冲突、过时；**一个月最多改一条** | `reflect mark rules "原来…现在…为什么"` |

日期限制在 **1–28**，避免二月没有 30 号导致整月跳过。人设回顾允许空着——为了完成配额去改人设，比不改更糟。 / Day numbers are capped at 28 so short months cannot skip a run. The persona review may be skipped: churning the persona to meet a quota is worse than leaving it alone.

```text
node companion.mjs reflect status            # 三件各自这个窗口做了没有
node companion.mjs reflect status persona    # 只看一件
node companion.mjs reflect gate memory       # 定时唤醒先查这个，allowed:false 就安静结束
node companion.mjs reflect mark memory "整理了三段，留下了什么"
node companion.mjs reflect mark persona --skip
node companion.mjs reflect show              # 最近几条
```

**配额按窗口算，不是按天**：月度功能整个自然月只记一次，周度功能按周一为界。同一窗口内第二次 mark 退出码 3。账本 `workspace/reflect.jsonl`。 / Quotas are window-based, not daily: monthly features record once per calendar month, weekly ones reset on Monday. A second mark in the same window exits with code 3. Ledger: `workspace/reflect.jsonl`.

日常工具：`reachout status|show`；`reachout mark "一句话"` 在回复前记账，`--skip` 安静跳过。同一天第二次 mark 退出码 3。40 字、禁用打卡问候由工具检查。`diary write --file <正文文本文件>` 自动新起 `## MM-DD`；正文 3–6 行，平淡一天允许一行实话。`diary skip` 记录今天不想写。文件与账本已有当天记录时拒绝再加一段，不用“补”接旧段落。 / Daily tools enforce one record per day, validate reach-out text and add new diary date headings. Duplicate operations exit with code 3. Skip is explicit and also counts as the day's decision.

关闭开关会删除相应文件并取消本插件句柄；卸载也清理订阅，保留日记和其他角色数据。不会修改用户原有的其他闹钟。 / Disabling or unloading withdraws the plugin's schedule files and handles while retaining character data and unrelated alarms.

先确认 DSH 自己能正常聊天（随便发一句，有回复就行）。插件用宿主已有的模型，不需要另外填 key。再保存人设，点击“打开角色对话”。面板显示“宿主模型：可用 / 未配置 / 未知”，打开前重新检查：明确未配置时引导到设置登录；没有足够证据时显示未知。

## 我的世界

点击“开始一起玩”，先选择你已经有哪种世界。

### 没有，帮我准备一个

选择“你选择的版本”。默认取 Mojang 正式版与当前身体依赖实际支持版本的最新交集，本次验证是 **26.1**，需要 Java 25；插件按官方清单准备对应运行环境。

列表分为“身体支持”“只可建世界”和“不可选”。本次清单的 26.3 只可建世界，必须额外确认身体不能进入；测试版不可选，低于 1.21.8 不列出。依赖更新后支持范围会随实际版本清单扩展。

勾选允许官方组件下载，阅读并同意 Minecraft 使用协议，再点“准备并开启世界”。完成后复制地址，在自己的 Minecraft **Java 版相同版本**客户端中添加并进入。客户端和游戏授权自行准备，自己的游戏名与角色不同即可。

**0.5.2 开放已验证的 Paper 1.21.8 自定义皮肤。** 在新建世界的向导中选择游戏版本 `1.21.8`、服务端类型 `Paper`，确认下载与 Minecraft 协议后准备世界。世界开启且角色进入后，在“为角色设置皮肤”里粘贴 PNG 图片的 https 直链，再点“应用皮肤”；无需关闭世界。图片不可达、世界不受插件管理、插件未加载或命令超时都会明确报错，不会显示成功。其他游戏版本继续使用原版，不会拿 1.21.8 的 Paper 替代所选版本。客户端截图见 [皮肤验收记录](skin-spike.md)。

若此前 0.5.0 已创建 Paper 目录，旧目录保持原样。向导的“改用原版重新准备”会准备独立原版目录，不会将原版 jar 覆盖进旧 Paper 存档。若要继续旧 Paper 世界，使用已有服务端目录并核对其真实版本。

**换版本将新建世界，旧世界保留在原目录。** 切换前先关闭当前世界。受管世界仅监听本机；升级插件不会覆盖存档或身体运行副本。

### 我自己开一个，对局域网开放

在游戏里进入单人世界 → Esc → 对局域网开放，然后点“查找并进入世界”。插件最多等待 4 秒公告，发现后保存地址并让身体连接，不下载 Java 或服务端。

**装了模组的客户端，她的身体可能因注册表不一致被踢；建议用原版客户端。** 还需使用身体支持的游戏版本。未发现时保持世界开启再重试；发现但连不上时检查游戏与本地网络权限。房主退出后显示“世界已关闭”。“退出世界”只让身体退出，不关闭你的游戏。

### 我已经有服务端目录

输入放着 `server.jar` 和 `server.properties` 的文件夹，点“检查并进入世界”。插件逐项检查目录、jar、游戏端口、Java 版本和已有协议确认。缺文件、端口被其他程序占用或 Java 太旧时会逐条列出原因。

插件不会为已有服务端写入 `eula.txt`，请在原服务端自行完成协议确认。外部已启动的同一 jar 可连接，但停止权限仍属于原控制台；插件自己启动且确认归属的进程才允许“关世界”。特殊 jar 可使用高级设置。

## QQ

**登录前请注意：** 新建或多年未使用的 QQ 小号可能触发风控、验证或账号限制，也可能因风险提醒需要每隔一段时间重新扫码登录。本插件尚未在长期使用的账号上进行测试，**不推荐使用主号**。使用风险由用户自行承担，本插件不承担由此产生的账号限制或其他损失。

**Before signing in:** New or long-unused secondary QQ accounts may trigger risk checks, verification or restrictions, and may need periodic QR sign-in after security alerts. This plugin has not been tested with accounts in long-term regular use. Main accounts are not recommended. Use at your own risk; this plugin accepts no responsibility for resulting restrictions or other losses.

**协议风险：** 用非官方客户端登录 QQ 可能**违反 QQ 用户协议**，平台有权据此限制或封停账号。插件不在你本机之外做任何事，也不绕过平台的安全机制；是否使用由你决定。

**Terms:** Signing a QQ account in through a third-party client may **violate QQ's terms of service**, and the platform may restrict or ban the account as a result. The plugin does nothing outside your machine and bypasses no platform security; the decision is yours.

点击“连接 QQ”，填两个不同的 QQ 号（你的、和角色用的那个），勾选允许官方下载。插件会下载**官方便携版 NapCat**（固定版本 + SHA-256 校验），解压到角色数据目录后直接运行——**不执行安装器、不需要管理员权限、不写注册表**。

开始运行前，面板会显示将运行的版本号与哈希前 8 位，你要点一次确认。之后 NapCat 会给出登录二维码，**用角色的 QQ 扫码登录**（这一步只能你来做，插件不会替你登录，也不会读取你现有的 QQ 或 NapCat 配置）。

登录后插件自动把连接参数写好，你从自己的 QQ 给角色发一条私聊就能验证。群聊需要在高级设置里填允许的群号，并且消息里 @ 角色。

重新打开 DSH 后，向导会显示“连接助手已停止”。确认版本与哈希后，点击“重新启动 QQ 连接”；已有有效登录态可继续使用，否则扫描新二维码。重新启动会清除旧二维码，不会把上次图片当作新的扫码状态。

运行文件与专属角色数据位于 `qq/napcat`。停止连接助手后可删除该目录；重新准备可复用已校验的组件缓存。若官方便携版的版本或哈希与包内 `tools/known-good.json` 不一致，插件会拒绝下载并提示等待更新——不会自动换成别的来源。

从旧版升级时，系统 QQ 目录中的登录态不会自动迁入角色专属目录，首次请重新扫码。

## B站

**登录前请注意：** 新建或多年未使用的 B站小号可能触发平台风控、验证或账号限制。本插件尚未在长期使用的账号上进行测试，**不推荐使用主号**。使用风险由用户自行承担，本插件不承担由此产生的账号限制或其他损失。

**Before signing in:** New or long-unused secondary Bilibili accounts may trigger platform risk checks, verification or restrictions. This plugin has not been tested with accounts in long-term regular use. Main accounts are not recommended. Use at your own risk; this plugin accepts no responsibility for resulting restrictions or other losses.

**协议风险：** 用自动化方式调用 B站接口（发评论、动态、私信等）可能**违反 B站用户协议**，账号可能被限制。插件只使用你扫码得到的登录态，不绕过验证码或其他安全机制。只读操作风险较低，写操作请自行掂量。

**Terms:** Automating Bilibili actions (comments, dynamics, direct messages) may **violate Bilibili's terms of service** and the account may be restricted. The plugin uses only the session you obtained by scanning, and bypasses no captcha or other security mechanism. Read-only use carries less risk than writing; judge for yourself.

点击“扫码连接 B站”，用 B站 App 扫描页面二维码，在手机上确认角色使用的账号。确认后自动保存登录态，无需寻找 Cookie。二维码过期可重新获取；扫码不会自动发评论或动态。

## 小黑盒

当前需要用户已有的兼容 CLI。“查看接入方式”说明条件，高级设置可填写工具位置。公开包不包含小黑盒签名实现、平台内部常量或密钥。

## 数据和失败处理

官方组件只在用户确认后下载并校验，保存在角色数据目录的 `components`；受管世界位于 `worlds`。运行组件、凭据、存档均不随插件包分发。下载代理只作用于本插件，不改宿主全局网络设置。

Minecraft 准备失败或取消后可以重试，旧世界设置保留。NapCat 信任校验失败请走手动路径。卸载保留角色数据，正在运行的受管世界仍需用户显式关闭。
