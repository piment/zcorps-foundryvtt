export class diceRollHelper {
    constructor(params) {
        this.data = params.actor.data.data;
        this.bonus = params.actor.useBonus;
        this.healtStatus = this._getMalus(parseInt(this.data.attributes.health));
        this.canAct = false;

        this.baseDicePool = {
            formula: params.formula,
            base: 0,
            tier: 0,
            joker: 0,
            xp: 0,
            joker_xp: 0,
            health_malus: 0,
            stress_malus: 0
        };
        this._parseFormula();
        
        
    }

    static parseBaseFormula(params) {

        const baseDice = dicePool.base;
        const roll = new Roll("1D6 +2");
        roll.evaluate();
        console.log(params.useBonus);
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
        return this.healtStatus;
    }

    async useBonus(bonus){
        if(bonus == "xp"){
            console.log("adding bonus xp");
            const bonusValue = await this._getBonusValue();
            if(bonusValue){
                this.baseDicePool.xp = +bonusValue - 1;
                this.baseDicePool.joker_xp = 1;
            }
            else {
                return 0;
            }
            console.log(this.baseDicePool);
        }
        else {
            console.log("adding bonus cojones");
            this.baseDicePool.base = (this.baseDicePool.base + 1) * 2 - 1;
            this.baseDicePool.tier *= 2;
            //this.baseDicePool.joker = 1;
            console.log(this.baseDicePool);
        }
        
        
    }

    async _getBonusValue(){
        const bonusValue = await this._askForBonusValue(this.baseDicePool.formula, this.data.attributes.xp.value);
        return bonusValue;
    }
    _parseFormula() {
        
        [this.baseDicePool.base, this.baseDicePool.tier] = this.baseDicePool.formula.split("D+");
        console.log("At start ", this.baseDicePool.base);
        if(parseInt(this.baseDicePool.base)){
            this.canAct = true;
            this.baseDicePool.base -= 1;
            this.baseDicePool.joker += 1;
        }
        
        // if(this.baseDicePool){
        //     this.canAct = true;
        // }
    }

    async _askForBonusValue(formula, max) {
        const template = `systems/zcorps/templates/actor/parts/bonusSelection.hbs`;
        const [dice, tier] = formula.split("D+");
        const html = await renderTemplate(template, {dice: dice, tier: tier, max: max, limit: game.settings.get("zcorps", "XPPointPerRollMax")});

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
        
        const base = `${this.baseDicePool.base}D6[black] + ${this.baseDicePool.joker}D6x[bloodmoon]`;
        let xp = "";
        if (this.baseDicePool.joker_xp) {
            xp = this.baseDicePool.xp ? ` + ${this.baseDicePool.xp}D6[black] + ${this.baseDicePool.joker_xp}D6x[acid] ` : ` + ${this.baseDicePool.joker_xp}D6x[acid] `;
        }
        const tier = +this.baseDicePool.tier ? `+ ${this.baseDicePool.tier}` : "";
        return base +  xp  + tier;
    }
}