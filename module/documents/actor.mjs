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
    if (actorData.type !== "character") return;

    // Make modifications to data here. For example:
    const data = actorData.data;
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
    const caracObject = { carac_1: 0, carac_2: 0 };
    const skillObject = { skill_1: 0, skill_2: 0 };

    if (data.value == 1) {
      data.skill
        ? (data.skill.array.skill_1 = 1)
        : (data.carac.array.carac_1 = 1);
        data.skill ? (data.skill.array.skill_2 = 0) : (data.carac.array.carac_2 = 0);
    } else if (data.value == 2) {
      data.skill
        ? (data.skill.array.skill_1 = 1)
        : (data.carac.array.carac_1 = 1);
      data.skill
        ? (data.skill.array.skill_2 = 1)
        : (data.carac.array.carac_2 = 1);
    }
    else {
      data.skill ? (data.skill.array.skill_1 = 0) : (data.carac.array.carac_1 = 0);
      data.skill ? (data.skill.array.skill_2 = 0) : (data.carac.array.carac_2 = 0);
    }
    
    return data;
  }

  _calculateTotalValueForSkill(skill) {
    if(skill.owned) {
      let totalTiers = 0;
      for(const [key, tier] of Object.entries(skill.tiers)) {
        totalTiers += tier;
      }
      let tierKeep = totalTiers % 3;
      let diceValue = (totalTiers - tierKeep) / 3;
      skill.value_augmented = +skill.total + +diceValue;
      if(tierKeep == 1) {
        skill.tiers.skill_1_augmented = 1;
        skill.tiers.skill_2_augmented = 0;
      } else if(tierKeep == 2) {
        skill.tiers.skill_1_augmented = 1;
        skill.tiers.skill_2_augmented = 1;
      } else {
        skill.tiers.skill_1_augmented = 0;
        skill.tiers.skill_2_augmented = 0;
      }
    } else {
      skill.tiers.skill_1_augmented = skill.tiers.skill_1;
      skill.tiers.skill_2_augmented = skill.tiers.skill_2;
      skill.value_augmented = +skill.total;
    }
    skill.formula = `${skill.value_augmented}D+${+skill.tiers.skill_1_augmented + +skill.tiers.skill_2_augmented}`;
    return skill;  
  }
  
  _parseRollFormula(formula) {
    formula = formula.split("D+");
    return formula;
  }
  _parseRollFormulaWithMalus(formula, malus) {
    console.log("##parse with malus");
    const [die, tier] = this._parseRollFormula(formula);
    console.log(die);
    if(die - malus <= 0) {
      return 0;
    }
    return `${(die - malus) - 1}D6[black] + 1D6x[bloodmoon] + ${tier}`;
  }
}
