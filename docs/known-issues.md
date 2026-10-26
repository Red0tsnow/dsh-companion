# 已知问题与支持边界

- **0.6.0 本次按要求未跑功能测试、实际世界验收或 verify-release**。构建与包入口加载不能证明反射、挖矿、唤醒或私聊体验已验收；0.5.2 记录仅作历史证据。 / No functional or live acceptance suite was run for 0.6.0 at the user's request; build/load checks are not feature acceptance.
- 自主循环、主动找你、日记分别 opt-in，额外依赖 dsh-proactive 0.3.1 的文件表工具。其未安装、未加载、被角色工具策略限制（含不允许直接调用的 PTC 模式）或缺少 schedule_file/jitter_seconds 时明确不可用；不会硬加载内部模块、改全局预算或自建随机计时器。需要用户配置提供方的模型额度及安静时段。 / Wake features are independent opt-ins using an optional provider; missing or restricted tools fail explicitly. Set the provider's own budget and quiet hours.
- 意图层不保证复杂地形成功；2.5 秒无位置、背包总数、血量变化会判卡住，原地战斗或挖掘慢方块也可能被打断。目标消失不等于确认击杀；挖矿按指定物品的实际背包增量验收，掉落为其他物品时不会虚报成功。 / Complex terrain is not guaranteed. The strict progress fingerprint can interrupt stationary fighting or slow mining. Target disappearance is not a confirmed kill; differing drops do not satisfy a requested inventory item.
- 旧运行身体不会静默升级，需使用 prepare-update、差异检查和原有试用/应用流程；有自改时先合并。技能检查、快照和自主循环需要新版身体。 / Existing edited bodies require an explicit update/merge; new capabilities need the updated body.
- 日常模板要求模型先 gate、再查账本、成功记账后才回复；它们是工具使用约定，不能阻止模型直接改文件或绕开约定发言。主动消息记录在尝试私聊前，异常中断当天不自动重发。日记不自动猜测事实；写作内容仍由模型负责。 / Prompts require gate/ledger discipline, not a sandbox against a model bypassing tools. Reach-out is recorded before replying and is not retried after an ambiguous interruption. Diary factuality remains the model's responsibility.
- 日常账本使用跨进程锁；进程被外部结束时可能留下 `.lock`。确认没有写入进程后可备份数据并移除对应锁；不要在写入期间删除锁。日记写入被外部中断且不能确定文件状态时会拒绝继续并要求恢复，避免重复日期。 / A killed writer can leave a lock or interrupted diary transaction; recover only after confirming the writer has stopped.

- 首发以 Windows 为验证目标；macOS、Linux 的受管 Minecraft 进程识别和生命周期尚未承诺支持。
- DSH 公开服务接口会随宿主版本变化。开发基线为本机提取的 `0.2.1-rc.3` 接口，真实支持版本和结果见 [验证记录](verification.md)。
- 独立面板预览不提供模型服务。真实对话依赖 DSH 已配置的可用模型。
- 小黑盒为用户自备 CLI 接入；不分发签名实现或平台内部签名常量。旧工具需自行适配数据和凭据位置。
- 0.3.0 已验证实际 Java 25、Minecraft 26.1 起服与身体进入，以及已有服务端路径。局域网 UDP、真实服务端与身体集成已通过，但公告由脚本模拟，实际游戏客户端“对局域网开放”和模组兼容性仍待实测。
- NapCat 使用官方便携版（非安装器）：解压到角色数据目录后运行，不执行安装包、不需要管理员权限。运行前需确认版本与哈希；真实 QQ 账号往返、B站扫码确认和实际权限仍待验收。
- Paper 自定义皮肤只开放已验证的 1.21.8 build 60 与 SkinsRestorer 15.12.6。26.1 的 Paper、原版存档迁入 Paper、首次断网准备尚未完成实测；不要据此替换其他版本或已有存档。见 [皮肤验收记录](skin-spike.md)。Paper 有原版行为差异、首次联网和额外依赖维护成本。
- 新 Paper 的皮肤配置关闭可选 Paper 进服监听，避免首次查询角色皮肤时卡在登录阶段；常规进服和手动皮肤刷新仍保留。已有 `plugins/SkinsRestorer/config.yml` 不会自动修改。若出现登录过慢，可检查 `advanced.enablePaperJoinListener`；若自改控制台语言或移除消息前缀，自动确认可能超时，请保留英文控制台与默认前缀。
- 皮肤命令超时后需正常关闭并重新开启世界再试。插件暂停该世界实例的后续皮肤命令，避免把旧操作延迟返回的回执误认作新操作成功；不会为此强杀或自动重启世界。
- 便携 QQ 已验证真实启动、专属原生数据路径与重新扫码；真实账号扫码确认及文本往返仍待用户实测。插件关闭会停止自己启动的连接助手，重启后需在向导中确认重新启动。
- “宿主模型可用”依据当前模型最近十分钟的成功回复；存在凭据或模型目录不能证明可用。没有公开证据时显示未知。检查不发送付费探测请求，也不读取凭据值。
- 下载确认不等于账号登录授权。Minecraft 协议、QQ 与 B站扫码均由用户完成；插件不会自动登录现有账号。下载可能受官方服务或网络限制，无进展会提示重试。
- Minecraft 端口、Java 进程和 jar 身份不明确时显示冲突。旧式以相对 jar 路径启动的外部世界可能不能被可靠认领；请回原控制台管理。
- 世界关闭使用正常保存与 stop。超时会报告失败，避免自动强杀导致存档损坏。
- Cookie 验证通过只能证明当前读接口登录态。平台写操作、风控、验证码、互关和账号权限仍可能限制对应动作。
- 依赖审计目前不是全绿：`npm audit` 记录 8 项 moderate、0 项 high、0 项 critical。moderate 项来自同一个 `uuid < 11.1.1` 通告（GHSA-w5hq-g745-h8pq），经 `prismarine-auth`、`@azure/msal-node`、`yggdrasil` 等上游路径传播；npm 未提供声明兼容的自动修复。直接 `ws` 已升级为 8.22.0，修复旧版对应的高危拒绝服务通告。未使用只对本仓库生效、无法随依赖安装传播的根级 overrides 来制造“已修复”结果。
- Microsoft 在线认证使用的账号流程尚未通过真实账号验收；Minecraft 实测使用独立本地离线世界。依赖通告详情：[uuid 通告](https://github.com/advisories/GHSA-w5hq-g745-h8pq)、[ws 通告](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)。
- 凭据以本机文件形式保存，不是系统钥匙串。请按用户数据管理并限制数据目录访问，不要公开备份。
- 七份文字的面板读取有大小上限，长文件显示最近内容；完整原文保存在工作区。
- 迁入任务默认停用，复杂旧任务需人工检查并对照新版格式。旧会话历史不自动迁移。
- 表情包和语音是可选能力。缺少 Python/Pillow 或其他外部处理工具时，对应能力可能不可用；核心对话和文字阅读继续工作。
- 测试中的模拟 OneBot、进程事实或模型端点仅验证边界行为，不能证明真实 QQ、Minecraft 账号或用户体验验收已完成。

未完成的真实验证必须在验证记录中保持“待实测”，不能用自动化通过替代。
