# Code Terminology

本文整理当前项目里常用且应保持统一的代码术语。

目标：

- 同一概念只保留一套主命名
- 新代码优先复用这里的术语
- 旧代码重构时，尽量向这里靠拢

## 基本原则

- 优先用业务语义，不用实现细节词。
- 优先用能表达职责的名词，不用模糊缩写。
- 同一层级保持一致：
  - `Node` 相关字段尽量带 `Node`
  - 世界坐标尽量带 `WorldPos`
  - 运行时上下文尽量带 `Context`
  - 能力契约尽量用 `Receiver`

## 攻击体系

| 推荐术语 | 含义 | 当前对应代码 | 避免使用 |
|---|---|---|---|
| `AttackBase` | 攻击行为基类 | `assets/scripts/attacks/base/AttackBase.ts` | 泛化成 `BaseAttack` |
| `AttackContext` | 一次攻击启动时的运行时上下文 | `assets/scripts/attacks/base/AttackContext.ts` | `params`, `data`, `runtimeData` |
| `attackContext` | 攻击组件内部缓存的上下文 | `AttackBase.attackContext` | `context` |
| `isAttackActive` | 当前攻击是否仍在执行 | `AttackBase.isAttackActive` | `isAlive` |
| `attackDamage` | 这次攻击携带的伤害信息 | `AttackContext.attackDamage` | `damageInfo` |
| `attackerNode` | 发起攻击的节点 | `AttackContext.attackerNode` | `attacker` |
| `targetNode` | 攻击锁定的目标节点 | `AttackContext.targetNode` | `target` |
| `spawnWorldPos` | 攻击或投射物生成世界坐标 | `AttackContext.spawnWorldPos` | `startWorldPos` |
| `destinationWorldPos` | 攻击预期到达的世界坐标 | `AttackContext.destinationWorldPos` | `endWorldPos` |

## 投射物体系

| 推荐术语 | 含义 | 当前对应代码 | 避免使用 |
|---|---|---|---|
| `Projectile` | 泛指会飞行的攻击实体 | `LinearProjectile`, `BlastBombProjectile` | 一律叫 `Bullet` |
| `LinearProjectile` | 线性飞行投射物基类 | `assets/scripts/attacks/projectile/LinearProjectile.ts` | 混入具体武器语义 |
| `DirectHitProjectile` | 首次命中即结算并结束的通用投射物 | `assets/scripts/attacks/projectile/DirectHitProjectile.ts` | `CommonBulletProjectile` |
| `BoomerangProjectile` | 来回飞行、前后段可重复结算的投射物 | `assets/scripts/attacks/projectile/BoomerangProjectile.ts` | `BananaProjectile` 这类武器耦合名 |
| `landingWorldPos` | 抛物投射物最终落点 | `BlastBombProjectile.landingWorldPos` | `endWorldPos` |
| `impactAoeRadius` | 爆炸或范围命中的作用半径 | `BlastBombProjectile.impactAoeRadius` | `aoe`, `radius` |
| `ProjectileDestinationReceiver` | 支持注入投射终点的能力契约 | `ProjectileAttackContract.ts` | 靠 `typeof xxx === 'function'` 猜能力 |
| `AreaImpactRadiusReceiver` | 支持注入范围伤害半径的能力契约 | `ProjectileAttackContract.ts` | 隐式方法能力 |

## 命中与伤害

| 推荐术语 | 含义 | 当前对应代码 | 说明 |
|---|---|---|---|
| `HitSystem` | 负责命中采样 | `assets/scripts/combat/HitSystem.ts` | 只管“打没打到” |
| `HitInfo` | 一次命中的结算输入 | `assets/scripts/combat/HitInfo.ts` | 给伤害结算层用 |
| `DamageInfo` | 伤害数据本体 | `assets/scripts/combat/DamageInfo.ts` | 金额、来源等 |
| `DamageResolver` | 负责把命中转换成实际伤害 | `assets/scripts/combat/DamageResolver.ts` | 只管结算 |
| `AttackPhase` | 攻击阶段 | `Forward`, `Return`, `Impact` | 用于回旋镖、多阶段攻击等 |
| `DamageChannel` | 伤害通道 | `Projectile`, `SingleTarget`, `Area` | 用于筛选可受击目标 |
| `AttackHitTracker` | 去重同一攻击的命中记录 | `assets/scripts/attacks/base/AttackHitTracker.ts` | 不负责采样 |

## 目标选择与敌人注册

| 推荐术语 | 含义 | 当前对应代码 | 避免使用 |
|---|---|---|---|
| `ITargetProvider` | 提供目标查询能力的接口 | `assets/scripts/core/interfaces/ITargetProvider.ts` | 具体实现名出现在接口层 |
| `NearestTargetProvider` | 基于“最近目标”规则的查询器 | `assets/scripts/targeting/NearestTargetProvider.ts` | 同时承担调试生成逻辑 |
| `getPrimaryTarget()` | 获取主目标 | `ITargetProvider` | `getTarget()` |
| `getTargetsWithinRange()` | 获取范围内目标 | `ITargetProvider` | `getTargetsInRange()` |
| `TargetSelectionCandidate` | 目标选择的纯数据候选项 | `assets/scripts/targeting/TargetSelection.ts` | 直接在算法里塞引擎对象细节 |
| `EnemyRegistry` | 当前活动敌人/受击盒注册表 | `assets/scripts/combat/EnemyRegistry.ts` | 用数组散落缓存 |
| `Hurtbox` | 敌人的可命中区域与受击查询入口 | `assets/scripts/enemy/base/Hurtbox.ts` | `EnemyCollider` |
| `EnemyTouchSpawner` | 触摸生成敌人的调试组件 | `assets/scripts/enemy/EnemyTouchSpawner.ts` | 放进 `NearestTargetProvider` |

## 武器系统

| 推荐术语 | 含义 | 当前对应代码 | 避免使用 |
|---|---|---|---|
| `WeaponSystem` | 武器统一发射入口 | `assets/scripts/systems/WeaponSystem.ts` | 每把武器一个独立入口脚本 |
| `currentWeaponId` | 当前选中的武器 ID | `WeaponSystem.currentWeaponId` | `weaponType`, `currentType` |
| `fireCurrentWeapon()` | 发射当前武器 | `WeaponSystem` | 直接操作具体武器脚本 |
| `fireWeapon(weaponId)` | 按 ID 发射指定武器 | `WeaponSystem` | 把 UI 直接绑到具体攻击类 |
| `ProjectileShotPlan` | 单次投射发射计划 | `WeaponSystem` 内部类型 | `bulletPlan` |
| `projectileRoot` | 投射物运行时节点容器 | `WeaponSystem.projectileRoot` | `bulletRoot` |
| `weaponPoint` | 武器发射起点节点 | `WeaponSystem.weaponPoint` | `firePos`, `shootPoint` |

## 武器配置术语

| 推荐术语 | 含义 | 当前对应代码 | 说明 |
|---|---|---|---|
| `WeaponConfigTable` | 武器配置表 | `assets/scripts/config/WeaponConfigTable.ts` | 当前为 TS 常量表 |
| `WeaponConfigData` | 单把武器配置结构 | `WeaponConfigTable.ts` | 配置数据模型 |
| `weaponId` | 武器主业务标识 | `WeaponConfigData.id` | 用“效果 + 表现形式”，不用外观物化名 |
| `WeaponAttackType.Boomerang` | 回旋镖类攻击 | `WeaponConfigTable.ts` | 飞出去再返回 |
| `WeaponAttackType.Projectile` | 泛投射物类攻击 | `WeaponConfigTable.ts` | 包括直线弹、抛物弹等 |
| `weaponPrefabKey` | 武器 prefab 注册键 | `WeaponConfigData.weaponPrefabKey` | 用主业务语义，不是 uuid |
| `boomerang` | 回旋镖专属配置组 | `WeaponConfigData.boomerang` | 如 `forwardDistance` |
| `volley` | 多发编排配置组 | `WeaponConfigData.volley` | 发几发、间隔多少 |
| `flight` | 飞行配置组 | `WeaponConfigData.flight` | 飞多远、是否落到目标点 |
| `impact` | 命中/爆炸配置组 | `WeaponConfigData.impact` | 范围半径等 |

### 武器主命名规则

- `weaponId` 与 `weaponPrefabKey` 统一使用“效果 + 表现形式”。
- 外观、题材、食物名只允许留在显示文案或素材层，不作为武器主业务概念。
- 同一效果系如果玩法不同，必须补足表现形式区分，例如 `chain_lightning` 与 `piercing_beam`。

### 配置字段细化

| 字段 | 含义 |
|---|---|
| `volley.count` | 一次攻击发射多少个投射物 |
| `volley.spacingX` | 发射起点之间的横向偏移 |
| `volley.targetSpreadX` | 不同投射物瞄准点之间的横向扩散 |
| `volley.shotDelay` | 连续发射时相邻投射物的时间差 |
| `flight.travelDistance` | 非锁定落点时，沿瞄准方向继续飞行的距离 |
| `flight.endAtTarget` | 是否直接以目标点作为终点 |
| `flight.visualScale` | 投射物视觉缩放 |
| `impact.aoeRadius` | 范围命中半径 |
| `boomerang.forwardDistance` | 回旋镖前进目标距离 |
| `boomerang.returnDamageScale` | 回程伤害倍率 |

## Prefab 与注册

| 推荐术语 | 含义 | 当前对应代码 | 避免使用 |
|---|---|---|---|
| `PrefabRegistry` | prefab 注册表组件 | `assets/scripts/registry/PrefabRegistry.ts` | 在业务代码里硬编码 prefab 引用 |
| `prefabKeys` | prefab 的业务键列表 | `PrefabRegistry.prefabKeys` | `keys` |
| `registeredPrefabs` | 已注册 prefab 列表 | `PrefabRegistry.registeredPrefabs` | `prefabs` |
| `getPrefabByKey()` | 按业务键取 prefab | `PrefabRegistry.getPrefabByKey()` | `getPrefab()` 这种太宽泛的名字 |

## 视觉与可视区域

| 推荐术语 | 含义 | 当前对应代码 |
|---|---|---|
| `ProceduralExplosionEffect` | 临时程序化爆炸视觉效果 | `assets/scripts/effects/ProceduralExplosionEffect.ts` |
| `ProjectileViewportCulling` | 投射物视区裁剪工具 | `assets/scripts/attacks/projectile/ProjectileViewportCulling.ts` |
| `isRectFullyOutsideVisibleArea()` | 判断矩形是否完全离开可视区域 | `ProjectileViewportCulling.ts` |
| `isNodeFullyOutsideVisibleArea()` | 判断节点包围盒是否完全离开可视区域 | `ProjectileViewportCulling.ts` |

## 当前推荐的命名风格

### 节点引用

- 用 `xxxNode`
- 例：
  - `attackerNode`
  - `targetNode`
  - `targetingOriginNode`
  - `spawnParentNode`

### 世界坐标

- 用 `xxxWorldPos`
- 例：
  - `spawnWorldPos`
  - `destinationWorldPos`
  - `landingWorldPos`
  - `hitWorldPos`

### 配置组

- 用业务分组名，不用平铺布尔
- 例：
  - `boomerang`
  - `volley`
  - `flight`
  - `impact`

### 纯函数

- 函数名直接表达行为
- 例：
  - `findNearestTarget`
  - `findTargetsWithinRange`
  - `buildProjectileShotPlans`
  - `buildAttackContext`

## 后续维护建议

- 新增术语时，优先补到本文档，再开始大面积命名。
- 如果一个旧术语已经在多个文件出现，先选定唯一主术语，再分批迁移。
- 如果一个类同时承担两种业务职责，优先拆职责，再讨论命名。
