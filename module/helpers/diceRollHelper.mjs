export class diceRollHelper {
    constructor(params) {
        this.data = params.actor.system;
        this.bonus = params.actor.useBonus;
        this.healthMalus = this._getMalus(parseInt(this.system.attributes.health));
        this.canAct = false;
        this.baseDicePool = {
            formula: params.formula,
            base: 0,
            tier: 0,
            joker: 0,
            xp: 0,
            joker_xp: 0,
            health_malus: this.healthMalus,
            stress_malus: 0
        };
        this._parseFormula();
        
        
    }

    static parseBaseFormula(params) {
        const baseDice = dicePool.base;
        const roll = new Roll("1D6 +2");
        roll.evaluate();
    }

    _getMalus(health) {
        switch(health){
            case 0:
                return 0;
                break;
            case 1:
            case 2: 
                return 1;
                break;
            case 3:
                return 2;
                break;
            case 4:
                return 3;
                break;
            case 5:
                return 4;
                break;
            default:
                return -1; 
                break;
        }
    //     if(health === 0) {return 0}
    //     if(health <= 2 ) { return 1; }
    //     else if(health == 3) {return 2;
    //     }
    //     else if(health == 4) {
    //       return 3;
    //     }
    //     else if(health == 5) {
    //       return 4;
    //     }
    //     else {
    //       return -1;
    //     }
    //   }
    }

    getHealthStatus(){
        return this.healthMalus;
    }

    async useBonus(bonus){
        if(bonus == "xp"){
            //console.log("adding bonus xp");
            const bonusValue = await this._getBonusValue();
            if(bonusValue){
                this.baseDicePool.xp = +bonusValue - 1;
                this.baseDicePool.joker_xp = 1;
                return bonusValue;
            }
            else {
                return 0;
            }
            //console.log(this.baseDicePool);
        }
        else {
            //console.log("adding bonus cojones");
            this.baseDicePool.base = (this.baseDicePool.base + 1) * 2 - 1;
            this.baseDicePool.tier *= 2;
            return 1;
            //this.baseDicePool.joker = 1;
            //console.log(this.baseDicePool);
        }
        
        
    }

    async _getBonusValue(){
        const bonusValue = await this._askForBonusValue(this.baseDicePool.formula, this.data.attributes.xp.value);
        return bonusValue;
    }

    _parseFormula() {
        
        [this.baseDicePool.base, this.baseDicePool.tier] = this.baseDicePool.formula.split("D+");
        //console.log("health malus ", parseInt(this.baseDicePool.base) - this.baseDicePool.health_malus);
        if(this.baseDicePool.base - this.baseDicePool.health_malus > 0 && this.baseDicePool.health_malus != -1){
            this.canAct = true;
            this.baseDicePool.base -= 1;
            this.baseDicePool.joker += 1;
        }
        
        // if(this.baseDicePool){
        //     this.canAct = true;
        // }
    }

    async _askForBonusValue(formula, available) {
        const template = `systems/zcorps/templates/actor/parts/bonusSelection.hbs`;
        const [dice, tier] = formula.split("D+");
        const html = await renderTemplate(template, {dice: dice, tier: tier, available: available, limit: game.settings.get("zcorps", "XPPointPerRollMax")});

        return new Promise(resolve => {
            const data = {
                title: "Points de personnage à utiliser",
                content: html,
                buttons: {
                    normal : {
                        label: "Valider",
                        callback: html => resolve(this._processBonusValueFromDialog(html[0].querySelector("form")))
                    },
                    cancel : {
                        label : "Annuler",
                        callback : html => resolve(false)
                    }
                },
                default: "normal",
                close : () => resolve(false),
            }
    
            new Dialog(data, {
                with: 500,
                classes: ["bonus"],
            }).render(true);
        });

    }

    _processBonusValueFromDialog(form) {
        return form[1].value.split("D+")[0];
    }

    getFinalFormula() {
        this.baseDicePool.base = this.baseDicePool.base - this.baseDicePool.health_malus;
        const base = `${this.baseDicePool.base}D6[black] + ${this.baseDicePool.joker}D6x[bloodmoon]`;
        let xp = "";
        if (this.baseDicePool.joker_xp) {
            xp = this.baseDicePool.xp ? ` + ${this.baseDicePool.xp}D6[black] + ${this.baseDicePool.joker_xp}D6x[acid] ` : ` + ${this.baseDicePool.joker_xp}D6x[acid] `;
        }
        const tier = +this.baseDicePool.tier ? `+ ${this.baseDicePool.tier}` : "";
        return base +  xp  + tier;
    }
}