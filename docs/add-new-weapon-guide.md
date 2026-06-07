# Add New Weapon Guide

本文说明当前项目里“新增一把新武器”的标准步骤，目标是：

- 尽量不影响现有武器实现和行为
- 保持“每把武器功能独立，互不干扰”
- 新增武器时，改动集中在配置、绑定、装配和新武器自身文件

## 总原则

- 每把武器的专属效果放在自己的脚本里，不写进别的武器文件。
- 如果只是复用已有攻击类型，也要优先给新武器独立攻击脚本。
- 只把纯通用能力抽成独立模块，不把武器 A/B 的专属效果混在一起。
- 能不改 `WeaponSystem` 主体，就不要改。

## 当前结构分层

新增武器前，先理解当前分层：

- `WeaponConfigTable`
  - 武器配置入口
  - 文件：`assets/scripts/config/WeaponConfigTable.ts`
- `WeaponAttackBinding`
  - `weaponPrefabKey -> attack binding` 映射
  - 文件：`assets/scripts/systems/WeaponAttackBinding.ts`
- `WeaponAttackAssembler`
  - `attack binding -> 挂载/获取攻击组件`
  - 文件：`assets/scripts/systems/WeaponAttackAssembler.ts`
- `WeaponAttackExecutor`
  - 各攻击类型的执行逻辑
  - 文件：`assets/scripts/systems/WeaponAttackExecutor.ts`
- `WeaponAttackExecutorRegistry`
  - `attackType -> executor` 注册表
  - 文件：`assets/scripts/systems/WeaponAttackExecutorRegistry.ts`
- `WeaponSystem`
  - 统一入口协调，不承载具体武器专属行为
  - 文件：`assets/scripts/systems/WeaponSystem.ts`

## 情况一：复用已有攻击类型

适用场景：

- 新武器只是复用已有攻击类型
- 例如仍属于 `Projectile`、`Boomerang`、`Beam`、`Chain`、`Ricochet`

步骤：

1. 在 `WeaponConfigTable` 里新增配置
   - 填 `id`
   - 填 `name`
   - 选已有 `attackType`
   - 填 `weaponPrefabKey`
   - 填 `damage`、`cooldown`
   - 根据武器需要补 `volley`、`flight`、`projectile`、`impact`、`beam`、`chain` 等配置组

2. 新增该武器自己的攻击脚本
   - 文件名直接表达武器语义
   - 示例：`IceShardProjectile.ts`
   - 不要把效果写进 `RapidBulletProjectile`、`BlastBombProjectile` 这类现有武器文件

3. 准备该武器 prefab
   - `weaponPrefabKey` 要能被 `PrefabRegistry` 找到
   - 尽量新增 prefab，不改现有武器 prefab

4. 在 `WeaponAttackBinding` 里给新武器加绑定
   - 增加 `weaponPrefabKey -> binding key`
   - 如果是新武器独立脚本，绑定键也应体现该武器语义

5. 在 `WeaponAttackAssembler` 里注册装配逻辑
   - 让该 `binding key` 能正确挂载新武器组件
   - 让该 `binding key` 能正确返回攻击组件

6. 如果新武器需要专属纯算法
   - 新增独立纯函数模块
   - 示例：伤害衰减、额外状态、特殊命中规则
   - 不要改现有武器算法文件去兼容新武器

## 情况二：新增全新攻击类型

适用场景：

- 现有 `WeaponAttackType` 不足以表达新武器
- 新武器执行方式与已有类型明显不同

步骤：

1. 在 `WeaponConfigTable` 里扩展 `WeaponAttackType`
   - 新增新的攻击类型枚举值

2. 在 `WeaponConfigTable` 里为新武器新增配置
   - 同“复用已有攻击类型”的配置步骤
   - 如果需要新的配置组，也在这里新增配置接口和字段

3. 新增新武器自己的攻击脚本
   - 文件和类名都按业务语义命名

4. 在 `WeaponAttackBinding` 里新增绑定
   - `weaponPrefabKey -> binding key`

5. 在 `WeaponAttackAssembler` 里新增装配注册
   - 负责挂载和取回该武器组件

6. 在 `WeaponAttackExecutor` 里新增执行函数
   - 负责该攻击类型的开火流程
   - 不把具体武器专属效果塞回 `WeaponSystem`

7. 在 `WeaponAttackExecutorRegistry` 里注册
   - `attackType -> executor`
   - 新增攻击类型时，改这里，不改 `WeaponSystem` 分支

## 哪些文件通常需要改

### 复用已有攻击类型时

- `assets/scripts/config/WeaponConfigTable.ts`
- 新武器自己的脚本文件
- `assets/scripts/systems/WeaponAttackBinding.ts`
- `assets/scripts/systems/WeaponAttackAssembler.ts`
- 如果有专属纯算法，再新增一个独立纯函数模块

### 新增全新攻击类型时

- 上面全部文件
- `assets/scripts/systems/WeaponAttackExecutor.ts`
- `assets/scripts/systems/WeaponAttackExecutorRegistry.ts`

## 哪些文件尽量不要改

- 不要把新武器效果塞进现有武器脚本
- 不要为了图省事继续扩大 `WeaponSystem`
- 不要把两个武器的专属行为放进同一个文件
- 不要改资源路径、场景文件名、脚本文件名、`.meta`，除非这次目标本身就需要

## 推荐测试步骤

新增武器后，至少做以下验证：

1. 配置测试
   - 更新 `tests/config/WeaponConfigTable.test.ts`
   - 验证新武器配置字段正确

2. 绑定测试
   - 更新 `tests/systems/WeaponAttackBinding.test.ts`
   - 验证新武器 `weaponPrefabKey` 绑定到正确 `binding key`

3. 如果新增纯算法或纯效果模块
   - 为该模块新增单独测试
   - 不依赖 `cc` 运行时，优先做纯函数测试

4. 运行全量测试
   - 命令：`npm test`

## 新增武器检查清单

- 是否给新武器单独脚本，而不是复用别的武器文件承载专属效果
- 是否只在 `binding` / `assembler` / `executor registry` 这些扩展点上增量修改
- 是否避免修改现有武器行为
- 是否补了配置和绑定测试
- 是否运行了 `npm test`

## 简化版流程

### 新武器复用已有攻击类型

1. 配置表加武器
2. 新建武器脚本
3. 准备 prefab
4. 加 `WeaponAttackBinding`
5. 加 `WeaponAttackAssembler`
6. 补测试
7. 跑 `npm test`

### 新武器新增攻击类型

1. 扩展 `WeaponAttackType`
2. 配置表加武器和新配置组
3. 新建武器脚本
4. 加 `WeaponAttackBinding`
5. 加 `WeaponAttackAssembler`
6. 加 `WeaponAttackExecutor`
7. 加 `WeaponAttackExecutorRegistry`
8. 补测试
9. 跑 `npm test`
