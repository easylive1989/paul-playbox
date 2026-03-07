# 新建築與兵種設計

## 概述

為 Tiny Swords RTS 遊戲新增 4 種建築和 2 種玩家兵種，並引入人口系統。

## 新建築

### Tower（防禦塔）
- **尺寸**: 2×3 格
- **HP**: 400
- **成本**: 125 金
- **功能**: 自動偵測範圍內敵人並發射箭矢
- **射程**: 5 格
- **攻擊間隔**: 1.5 秒
- **傷害**: 12
- **素材**: `Buildings/Blue Buildings/Tower.png` (320×256)

### Archery（射箭場）
- **尺寸**: 3×3 格
- **HP**: 500
- **成本**: 175 金
- **功能**: 訓練 Archer（弓箭手）
- **生產時間**: 12 秒
- **素材**: `Buildings/Blue Buildings/Archery.png` (320×256)

### House（房屋）
- **尺寸**: 2×2 格
- **HP**: 200
- **成本**: 75 金
- **功能**: 增加人口上限 +5
- **素材**: `Buildings/Blue Buildings/House1.png` (320×256)

### Monastery（修道院）
- **尺寸**: 3×3 格
- **HP**: 500
- **成本**: 200 金
- **功能**: 訓練 Monk（僧侶）
- **生產時間**: 15 秒
- **素材**: `Buildings/Blue Buildings/Monastery.png` (320×256)

## 新兵種

### Archer（弓箭手）
- **成本**: 60 金
- **HP**: 60
- **速度**: 70
- **攻擊**: 10
- **範圍**: 4 格（遠程）
- **冷卻**: 1200ms
- **特殊**: 發射箭矢投射物飛向敵人
- **生產建築**: Archery
- **素材**: `Units/Blue Units/Archer/` — Archer_Idle.png, Archer_Run.png, Archer_Shoot.png, Arrow.png

### Monk（僧侶）
- **成本**: 80 金
- **HP**: 50
- **速度**: 75
- **攻擊**: 0（無攻擊力）
- **治療量**: 15 HP
- **治療範圍**: 3 格
- **冷卻**: 2000ms
- **特殊**: 自動偵測範圍內受傷友軍，移動過去治療
- **生產建築**: Monastery
- **素材**: `Units/Blue Units/Monk/` — Idle.png, Run.png, Heal.png, Heal_Effect.png

## 人口系統

- **初始上限**: 10
- **House 加成**: 每棟 +5
- **每單位佔用**: 1 人口
- **限制**: 超過上限無法訓練新單位
- **影響**: Barracks、Archery、Monastery 訓練時需檢查人口

## 建築生產對應

| 建築 | 訓練兵種 | 狀態 |
|------|---------|------|
| Castle | 無 | 已有 |
| Barracks | Warrior | 已有 |
| Archery | Archer | 新增 |
| Monastery | Monk | 新增 |
| Tower | 自動射擊 | 新增 |
| House | 人口加成 | 新增 |

## 建造菜單更新

Castle 上方的 BuildMenu 需從 2 項擴充為 6 項：
Gold Mine、Barracks、Tower、Archery、House、Monastery
