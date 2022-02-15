export class skillHelper {
    //Add "skill" Item to the context as a normal skill
    static addItemToSkill(context) {
        for (let skill of context.skillsAdded) {
            context.caracs[skill.carac].skills[skill.name] = skill;
        }
    }
    //Calculate the final value for a skill, depending on the caracteristic value, skill value and tiers
    static getFinalValueForSkill(skill) {
        if (skill.owned) {
            let totalTiers = 0;
            for (const [key, tier] of Object.entries(skill.tiers)) {
                totalTiers += tier;
            }
            let tierKeep = totalTiers % 3;
            let diceValue = (totalTiers - tierKeep) / 3;
            skill.value_augmented = +skill.total + +diceValue;
            if (tierKeep == 1) {
                skill.tiers.skill_1_augmented = 1;
                skill.tiers.skill_2_augmented = 0;
            } else if (tierKeep == 2) {
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
        skill.formula = `${skill.value_augmented}D+${
            +skill.tiers.skill_1_augmented + +skill.tiers.skill_2_augmented
        }`;
        return skill;
    }

    static calculateSkillValues(caracteristic, context) {
        for (const skill of Object.values(caracteristic.skills)) {
            if (!skill.owned) { 
                skill.total = caracteristic.value - 1;
                skill.tiers.skill_1 = caracteristic.tiers.carac_1;
                skill.tiers.skill_2 = caracteristic.tiers.carac_2;
            } else {
                skill.total = +skill.value + +caracteristic.value;
                skill.tiers.carac_1 = caracteristic.tiers.carac_1;
                skill.tiers.carac_2 = caracteristic.tiers.carac_2;
                context.skillsOwned = context.skillsOwned + 1;
            }
            /*
             * TO BE REMOVE ON 0.0.8
             * => this.actor._calculateTotalValueForSkill(skillItem); 
            */
            skillHelper.getFinalValueForSkill(skill);
        }
    }
}

export class caracHelper {
    //Get the roll formula formatted
    static getFormula(caracteristic){
        const value = parseInt(caracteristic.value);
        const tier_1 = parseInt(caracteristic.tiers.carac_1);
        const tier_2 = parseInt(caracteristic.tiers.carac_2);
        return `${value}D+${tier_1 + tier_2}`;
    }
};

export const attrHelper = () => {};
