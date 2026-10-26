# 自定义皮肤：1.21.8 客户端显示通过

## 2026-10-26：客户端证据

按新提供的《给Codex-皮肤验收任务》补齐现有 **1.21.8-60** 的客户端截图后，0.5.2 开放这一固定版本，Paper 与 SkinsRestorer 的 `releaseVerified` 均为 true。本轮没有验证 Paper 26.1，也不开放其他 Paper 版本。

独立世界复用 `.dev/spike-paper/server`，仅监听 `127.0.0.1:25599`。本次启动重新核对 Paper SHA-256 与 SkinsRestorer SHA-512；Java 21 启动后身体 `Companion` 已进入，位置 `12.5, 106, 90.5`。使用公开 Notch 皮肤作为易辨识的验收样本。

本次控制台证据（本机时间）：

```text
[02:12:36 INFO]: This server is running Paper version 1.21.8-60-main@29c8822
[02:12:38 INFO]: [SkinsRestorer] Enabling SkinsRestorer v15.12.6
[02:12:39 INFO]: [SkinsRestorer] Running on Minecraft 1.21.8.
[02:12:42 INFO]: Done (17.632s)! For help, type "help"
> sr createcustom companion_skin https://textures.minecraft.net/texture/292009a4925b58f02c77dadc3ecef07ea4c7472f64e0fdc32ce5522489362680
[02:12:55 INFO]: [SkinsRestorer] The skin companion_skin was created.
> skin set companion_skin Companion
[02:12:56 INFO]: [SkinsRestorer] You changed the skin of Companion.
```

机器记录为 `artifacts/skin-spike.json`，完整控制台为 `.dev/skin-client-acceptance/paper-console.log`。用户先反馈“我看见了成功了”，随后提供下图；可见 `Companion` 的名字与预期的 Notch 皮肤。`clientVisible.status` 已记为 `passed`，截图为 `docs/images/skin-client-1.21.8.png`，检查时间为 **2026-10-26 02:26:56 +08:00**。客户端版本由用户确认为 1.21.8，未独立检查其发行版、模组或光影。

截图 SHA-256：`d244a7c197eed2f440f11d411516454d50decb00c2cc41da783f9d2ae846f12d`。

![用户客户端中 Companion 的 Notch 皮肤](images/skin-client-1.21.8.png)

02:21 用户反馈 `Connection refused: getsockopt`。检查确认原 Java 进程已退出，25599 无监听；原测试目录日志还记录了随后另一轮 PlaceBot 联调及停止。为隔离共享测试目录，将已有验收世界复制至 `.dev/skin-client-acceptance/server`，保留原件与上轮报告，使用隐藏后台验收脚本启动。02:22 再次取得启动完成、身体加入与正确皮肤命令回执；Minecraft 状态协议查询确认 `Paper 1.21.8`，在线玩家包含 `Companion`，25599 监听归属本轮 Java PID。此后台脚本无自动定时停服操作，后续由明确的 stop 控制请求正常保存退出。

收到截图后，这次验收服已正常保存并退出，退出码为 0。

## 插件接入

皮肤操作复用 `world.mjs up` 启动的 supervisor，通过世界锁内的请求/回执文件访问该 supervisor 持有的 Java stdin。进程身份或实例变化时拒绝发送；白名单仅接受固定皮肤名的创建、应用命令。超时表示未确认，不会报告成功。

真实隔离联调取得两条明确成功回执，并确认操作前后 Java PID、创建时间、实例与启动标识一致；没有启动第二个 Java。移走隔离副本的 SkinsRestorer 后，真实服务端返回未知命令，插件显示未加载，而非成功。记录位于 `artifacts/skin-release-verification.json`。

联调还发现：没有缓存的新角色使用 Paper 进服监听时会卡在登录阶段并收到 `slow_login`。仅在隔离副本中关闭 `advanced.enablePaperJoinListener` 后，相同身体正常进入；皮肤命令与正常关闭均成功。新建 Paper 配置因此采用这一常规进服路径，保留常规皮肤应用；已有配置不覆盖。[官方高级设置说明](https://skinsrestorer.net/docs/reference/advanced)描述了该可选监听，固定插件配置也建议在登录过慢时关闭它。此修复针对已复现的登录阻塞，不用修改开关代替客户端证据。

用户随后要求停止额外测试，因此没有重跑最终完整回归与发布验收；具体边界见 [0.5.2 记录](verification-0.5.2.md)。

## 0.5.1 保留记录

0.5.1 暂未开放 Paper 新建与皮肤操作，默认原版世界继续可用。0.5.0 的单独 Java 启动、错误皮肤命令和定时强杀逻辑已移除。旧 Paper 文件不会自动删除或覆盖。

0.5.1 当时的本地记录只证明 Paper **1.21.8** 可启动、SkinsRestorer 可加载、身体可进入；尚无客户端截图。该版本的 `releaseVerified: false` 阻止了公开向导，随后由上方 0.5.2 证据更新。它不能证明 Paper 26.1 或原版存档迁移完成。

旧方案提出的以下项目保留作后续验收清单；本轮按新任务只开放已验证的 1.21.8，不以此宣称下列其他版本、迁移及完整离线验收已完成：

- Paper 26.1.x 的准确游戏版本、build 与完整哈希；身体使用兼容协议真实进入。
- SkinsRestorer 加载成功；正确的控制台命令执行后，原版客户端确实看到目标角色皮肤，提供截图。
- 首次启动额外下载清单、体积、耗时；断网或超时有明确结果，可回到原版且保留旧世界。
- 使用原版存档的副本迁入 Paper，正常加载、保存和关闭；原件哈希不变。
- 世界来源 C 识别 Paper；所有启动仍走 `world.mjs up`，持有同一把锁，停止等待正常保存退出。
- 皮肤操作通过已核实的世界控制通道执行，按明确成功回执确认结果；不得靠固定等待和“日志里没出现 error”宣称成功。

SkinsRestorer 15.12.6 的命令顺序为 `skin set <skinName> <selector>`。自定义命名皮肤另用 `sr createcustom <skinName> <skinInput>`；以 [官方命令说明](https://skinsrestorer.net/docs/configuration/commands-permissions) 为准。皮肤名放在目标玩家之前。

Paper 首次启动必须联网，并增加 Paper build/SkinsRestorer 的维护工作。原版行为差异与存档迁移风险需要纳入实测；当前不以协议模拟替代游戏客户端验收。
