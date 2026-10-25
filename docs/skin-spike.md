# 自定义皮肤：待验收

0.5.1 暂未开放 Paper 新建与皮肤操作，默认原版世界继续可用。0.5.0 的单独 Java 启动、错误皮肤命令和定时强杀逻辑已移除。旧 Paper 文件不会自动删除或覆盖。

当前本地记录只证明 Paper **1.21.8** 可启动、SkinsRestorer 可加载、身体可进入。它不能证明 Paper 26.1 的可用性、原版客户端实际看到皮肤，或原版存档迁移完成。固定资产里的 1.21.8 build 60 保留为调查记录，`releaseVerified: false` 阻止用于公开向导。

重新开放前，以下项目必须全部附证据：

- Paper 26.1.x 的准确游戏版本、build 与完整哈希；身体使用兼容协议真实进入。
- SkinsRestorer 加载成功；正确的控制台命令执行后，原版客户端确实看到目标角色皮肤，提供截图。
- 首次启动额外下载清单、体积、耗时；断网或超时有明确结果，可回到原版且保留旧世界。
- 使用原版存档的副本迁入 Paper，正常加载、保存和关闭；原件哈希不变。
- 世界来源 C 识别 Paper；所有启动仍走 `world.mjs up`，持有同一把锁，停止等待正常保存退出。
- 皮肤操作通过已核实的世界控制通道执行，按明确成功回执确认结果；不得靠固定等待和“日志里没出现 error”宣称成功。

SkinsRestorer 15.12.6 的命令顺序为 `skin set <skinName> <selector>`。自定义命名皮肤另用 `sr createcustom <skinName> <skinInput>`；以 [官方命令说明](https://skinsrestorer.net/docs/configuration/commands-permissions) 为准。皮肤名放在目标玩家之前。

Paper 首次启动必须联网，并增加 Paper build/SkinsRestorer 的维护工作。原版行为差异与存档迁移风险需要纳入实测；当前不以协议模拟替代游戏客户端验收。
