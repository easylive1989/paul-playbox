export default class SelectionSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedUnits = [];
        this.selectedBuilding = null;

        this.setupInput();
    }

    setupInput() {
        // Left-click: select unit or building
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleLeftClick(pointer);
            }
        });

        // Right-click: issue command
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.handleRightClick(pointer);
            }
        });

        // Disable browser right-click menu
        this.scene.input.mouse.disableContextMenu();
    }

    handleLeftClick(pointer) {
        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        // Check if clicked on a player unit
        let clickedUnit = null;
        for (const unit of this.scene.playerUnits) {
            if (!unit.alive) continue;
            const dist = unit.distanceToPoint(clickX, clickY);
            if (dist < 30) {
                clickedUnit = unit;
                break;
            }
        }

        // Check if clicked on a building
        let clickedBuilding = null;
        if (!clickedUnit) {
            for (const building of this.scene.buildings) {
                if (!building.alive) continue;
                const center = building.getCenter();
                const hw = (building.gridW * 64) / 2;
                const hh = (building.gridH * 64) / 2;
                if (clickX >= center.x - hw && clickX <= center.x + hw &&
                    clickY >= center.y - hh && clickY <= center.y + hh) {
                    clickedBuilding = building;
                    break;
                }
            }
        }

        if (clickedUnit) {
            this.deselectAll();
            this.selectUnit(clickedUnit);
        } else if (clickedBuilding) {
            this.deselectAll();
            this.selectedBuilding = clickedBuilding;
        } else {
            this.deselectAll();
        }
    }

    handleRightClick(pointer) {
        if (this.selectedUnits.length === 0) return;

        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        // Check if right-clicked on an enemy unit
        let targetEnemy = null;
        for (const unit of this.scene.enemyUnits) {
            if (!unit.alive) continue;
            const dist = unit.distanceToPoint(clickX, clickY);
            if (dist < 30) {
                targetEnemy = unit;
                break;
            }
        }

        if (this.scene.commandSystem) {
            if (targetEnemy) {
                this.scene.commandSystem.issueAttack(this.selectedUnits, targetEnemy);
            } else {
                this.scene.commandSystem.issueMove(this.selectedUnits, clickX, clickY);
            }
        }
    }

    selectUnit(unit) {
        unit.setSelected(true);
        this.selectedUnits.push(unit);
    }

    deselectAll() {
        for (const unit of this.selectedUnits) {
            unit.setSelected(false);
        }
        this.selectedUnits = [];
        this.selectedBuilding = null;
    }
}
