export class skillHelper {
    
    //Add "skill" Item to the context as a normal skill
    static addItemToSkill(context) {
        for(let skill of context.skillsAdded) {
            context.caracs[skill.carac].skills[skill.name] = skill;
        }
    };
};

export const caracHelper = () => {

};

export const attrHelper = () => {

};