import { diceRollHelper } from "../helpers/diceRollHelper.mjs";
import { ZCORPS } from "../helpers/config.mjs";
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class zcorpsActor extends Actor {
    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags.zcorps || {};
    }

	prepareFormuleInit(){
		console.info(this.data)
	}

    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags.zcorps || {};
        
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        if (actorData.type == "survivor") {
            const data = actorData.data;
        }
        if (actorData.type == "controler") {
            const data = actorData.data;
        }
    }

    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();

        // Prepare character roll data.
        this._getCharacterRollData(data);

        return data;
    }

    /**
     * Prepare character roll data.
     */
    _getCharacterRollData(data) {
        if (this.data.type !== "character") return;

        // Add level for easier access, or fall back to 0.
        if (data.attributes.level) {
            data.lvl = data.attributes.level.value ?? 0;
        }
    }
    _getFormattedTiersData(data) {
        
        if (data.value == 1) {
            data.skill
                ? (data.skill.array.skill_1 = 1)
                : (data.carac.array.carac_1 = 1);
            data.skill
                ? (data.skill.array.skill_2 = 0)
                : (data.carac.array.carac_2 = 0);
        } else if (data.value == 2) {
            data.skill
                ? (data.skill.array.skill_1 = 1)
                : (data.carac.array.carac_1 = 1);
            data.skill
                ? (data.skill.array.skill_2 = 1)
                : (data.carac.array.carac_2 = 1);
        } else {
            data.skill
                ? (data.skill.array.skill_1 = 0)
                : (data.carac.array.carac_1 = 0);
            data.skill
                ? (data.skill.array.skill_2 = 0)
                : (data.carac.array.carac_2 = 0);
        }

        return data;
    }

    _parseRollFormula(formula) {
        formula = formula.split("D+");
        return formula;
    }

    _parseRollFormulaWithMalus(formula, malus) {
        const [die, tier] = this._parseRollFormula(formula);
        if (die - malus <= 0) {
            return 0;
        }
        return `${die - malus - 1}D6[black] + 1D6x[bloodmoon] + ${tier}`;
    }

    async roll(dataset) {
        const bonus = this.useBonus;
        const malus = this._getMalus(dataset.carac);
        if(malus.health == -1 || malus.stressValue == -1){
          ui.notifications.warn("Le personnage n'est pas en capacité d'agir");
          return;
        }

        if (bonus == "xp") {
            var [bonusRollFormula, used_xp] = await this._bonusRollFormula(true, 0);
        }

        let standartRollFormula = await this._standardRollFormula(
            dataset.roll,
            bonus == "cojones" ? true : false, 
            malus
        );
        if(!standartRollFormula && !bonusRollFormula) {
          ui.notifications.error("Le personnage n'est pas en capacité d'agir.");
          return;
        }
        if(bonusRollFormula) {
          if(!standartRollFormula) {
            standartRollFormula = "0D6[black] + 0D6x[bloodmoon]";
          }
          var finalFormula = standartRollFormula + " + " + bonusRollFormula;
        }
        else {
          var finalFormula = standartRollFormula
        }
        if(bonus == "cojones") {
          this.data.data.attributes.cojones.value -= 1;
          this.update({ data: this.data.data });
        }
        if(bonus){
          document.querySelectorAll(".bonus-icon").forEach((el) => {
            el.classList.remove("fa-check-square", "fa-minus-square");
            el.classList.add("fa-square");
        });
        }
        let roll = await new Roll(finalFormula, {}).roll();
        const results = this._parseRollResult(roll);
        
          const template = "systems/zcorps/templates/chat/actions.hbs";
          var templateRendered = await renderTemplate(template, {
          black: results.black,
          joker: results.bloodmoon,
          xp: results.white,
          xp_joker: results.acid,
          total: results.total,
          total_base: results.total_base,
          total_xp: results.total_xp,
          tier: results.tier,
          fail: results.fail,
          total_fail: results.total_fail,
          actor: this.data,
          label: dataset.label,
          malus: malus,
          xp_used: used_xp ? used_xp : 0,
          cojones: bonus == "cojones"? true : false,
          stress : dataset.stress ? true : false,
          stressDifficulty : malus.stressDifficulty
          });
        
        const myMessage = await ChatMessage.create({
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          roll: roll,
          user: this._id,
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: templateRendered,
          rollMode: game.settings.get("core", "rollMode"),
        });
    }

    async reRoll(joker, used_xp, label) {
      var [bonusRollFormula, used_xp] = await this._bonusRollFormula(joker, used_xp);
      if(!bonusRollFormula){ return false};
      let roll = await new Roll(bonusRollFormula, {}).roll();
      const results = this._parseRollResult(roll);
      const template = "systems/zcorps/templates/chat/reroll.hbs";
      const templateRendered = await renderTemplate(template, {
          xp: results.white,
          xp_joker: results.acid,
          total_xp: results.total_xp,
          actor: this.data,
          label: label
        });
        
        const myMessage = await ChatMessage.create({
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          roll: roll,
          user: this._id,
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: templateRendered,
          rollMode: game.settings.get("core", "rollMode"),
        });
        return true;
    }
    
    //######## ALWAYS USED? #######
    _getMalus(caracteristic) {
        const health = this._calculateHealthMalus(
            this.data.data.attributes.health
        );
        const stressTest = this._checkStressMalus(caracteristic, this.data.data.attributes.stress)
        return {
            health: health,
            stressValue: stressTest.value,
            stressDifficulty: stressTest.difficulty
        };
    }

    _calculateHealthMalus(level) {
        switch (parseInt(level)) {
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
    }
    
    _checkStressMalus(caracteristic, level) {
      const knowledge = game.i18n.localize(ZCORPS.caracteristics["knowledge"]);
      const agility = game.i18n.localize(ZCORPS.caracteristics["agility"]);
      const deftness = game.i18n.localize(ZCORPS.caracteristics["deftness"]);
      const presence = game.i18n.localize(ZCORPS.caracteristics["presence"]);
      const perception = game.i18n.localize(ZCORPS.caracteristics["perception"]);

      if(level == 5) { return {value: -1, difficulty: false }};
      const malus = [
        {difficulty: 8, malus: false},
        {difficulty: 10, malus: {[knowledge]: 1}},
        {difficulty: 10, malus: {[knowledge]: 1, [agility]: 1}},
        {difficulty: 12, malus: {[knowledge]: 1, [agility]: 1, [deftness]: 1, [presence]: 1}},
        {difficulty: 12, malus: {[knowledge]: 1, [agility]: 2, [deftness]: 1, [presence]: 1, [perception]: 1}},
      ];
      
      if(malus[level].malus){
        if(malus[level].malus[caracteristic]){
          return {value: malus[level].malus[caracteristic], difficulty: malus[level].difficulty}
        }
        else {
          return {value: 0, difficulty: malus[level].difficulty};
        }
      }
      else {
        return {value: 0, difficulty: malus[level].difficulty};
      }
    }
    //######## ############ #######

    /**
     * @param {Array} dice
     * @returns calculated results for roll
     * @private
     */
    _parseRollResult(roll) {
      const result = {
        black: [],
        bloodmoon: [],
        white: [],
        acid: [],
        tier : 0,
        total: roll.total
      }
      roll.terms.forEach(term => {
        if(term.flavor) {
          switch(term.flavor) {
            case "black":
              result.black.push(...term.values);
              break;
            case "bloodmoon":
              result.bloodmoon.push(...term.values);
              break;
            case "white":
              result.white.push(...term.values);
              break;
            case "bronze":
              result.acid.push(...term.values);
              break;
            default:
              break;
          }
        }
        else {
          if(!term.operator) {
            result.tier = term.total;
          }
        }
      })
      result.fail = result.bloodmoon[0] == 1 ? true : false;
      if(result.fail){
        if(result.black[0]){
          let biggerDice = result.black.sort((a, b) => b - a)[0];
          result.total_fail = result.total - biggerDice;
        }
        else {
          result.total_fail = 0;
        }
      }
      result.black.length ? result.total_black = result.black.reduce((init, cur) => init + cur) : result.total_black = 0;
      result.bloodmoon.length ? result.total_base =  result.total_black + result.bloodmoon.reduce((init, cur) => init + cur) + result.tier : result.total_base = result.total_black;
      
      
      
        result.white.length ? result.total_white = result.white.reduce((init, cur) => init + cur) : result.total_white = 0;
        result.total_xp =  result.acid.length ? result.total_white + result.acid.reduce((init, cur) => init + cur) : result.total_white;
      
      return result;
    }

    async _standardRollFormula(formula, cojones, malus) {
        let [dice, tier] = formula.split("D+");
        if (cojones) {
            dice *= 2;
            tier *= 2;
        }
        dice = dice - malus.health - malus.stressValue;
        if(dice <= 0) {
          return false;
        }
        const finalFormula = `${dice - 1}D6[black] + 1D6x[bloodmoon] + ${tier}`;
        return finalFormula;
    }

    async _bonusRollFormula(joker, used) {
        
        const template = `systems/zcorps/templates/actor/parts/bonusSelection.hbs`;
        const available = this.data.data.attributes.xp.value;
        const html = await renderTemplate(template, {
            available: available,
            limit: game.settings.get("zcorps", "XPPointPerRollMax") - used,
        });

        const bonusValue = await new Promise((resolve) => {
            const data = {
                title: "Points de personnage à utiliser",
                content: html,
                buttons: {
                    normal: {
                        label: "Valider",
                        callback: (html) =>
                            resolve(
                                parseInt(html[0].querySelector("form")[0].value)
                            ),
                    },
                    cancel: {
                        label: "Annuler",
                        callback: (html) => resolve(false),
                    },
                },
                default: "normal",
                close: () => resolve(false),
            };

            new Dialog(data, {
                with: 500,
                classes: ["bonus"],
            }).render(true);
        });
        //If player prefere not to use bonus points, just return
        if (!bonusValue) {
            return [false, 0];
        }
        this.data.data.attributes.xp.value -= bonusValue;
        this.update({ data: this.data.data });

        if (joker) {
            var finalFormula = `${bonusValue - 1}D6[white] + 1D6x[bronze]`;
        } else {
            var finalFormula = `${bonusValue}D6[white]`;
        }
      
        return [finalFormula, bonusValue];
    }

    async addSkillToActor(skill) {
        const data = {
          "name": skill.name,
          "owned": true,
          "value": 0,
          "tiers": {
            "carac_1": 0,
            "carac_2": 0,
            "skill_1": 0,
            "skill_2": 0
          }, 
          "added": true
        }
        this.setFlag("zcorps", "addedSkill", {[skill.caracteristic] : {[skill.id]: data} });
    }
    
    async deleteSkillFromActor(info) {
      this.unsetFlag("zcorps", `addedSkill.${info.caracteristic}.${info.skill}`);
    }

    async addSpecToSkill(specialisation, skill, caracteristic){
      const data = {
        "name": specialisation,
        "skill": skill,
        "carac": caracteristic,
        "value": 0,
        "tiers": {
          "spec_1": 0,
          "spec_2": 0
        }
      }
      this.setFlag("zcorps", "addedSpec", {[skill]: { [specialisation.toLowerCase().replace(" ", "_")] : data}});
    }
    async deleteSpecFromSkill(specialisation, skill){
      this.unsetFlag("zcorps", `addedSpec.${skill}.${specialisation}`);
    }
    _getSkillsList(){
      let skills = {};
      for(let [key, carac] of Object.entries(this.data.data.caracs)){
        for(let [key, skill] of Object.entries(carac.skills)){
          skills[key] = {name: skill.name, added: false, caracteristic: key};
        }
      }
      if(this.data.flags.zcorps && this.data.flags.zcorps.addedSkill){
        for(let [key, carac] of Object.entries(this.data.flags.zcorps.addedSkill)){
          for(let [skillKey, skill] of Object.entries(carac)){
            skills[skillKey] = {name: skill.name, added: true, caracteristic: key};
          }
        }  
      }
      return skills;
    }
}
