import { ZCORPS } from "../helpers/config.mjs";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class zcorpsItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["zcorps", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/zcorps/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    const itemType = context.item.type;
    //SKILL PART
    if(itemType == "skill"){
      context.caracteristics = {}
      for(let [key, skill] of Object.entries(ZCORPS.caracteristics)) {
        context.caracteristics[key] = game.i18n.localize(ZCORPS.caracteristics[key]);
      }
    }
    

    context.ammoType = {0: ".38", 1: "9mm", 2: ".22"};
    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }
    context.actor = this.actor ? this.actor.data : {};
    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;
    context.armeType = {"armedepoing": "arme de poing", "armedejet": "arme de jet", "armedepaule" : "arme d'épaule", "armecontandante": "arme contandante"};
    //console.log(Object.keys(context))
    //console.log(context.item.data);
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
    html.find(".arme-type").change(ev => { 
      let item = this.object.data.data;
      let skill = ev.currentTarget.value;
      if(skill ==="armedepoing" || skill === "armedepaule") {
        item.carac = "deftness";
        item.skill = "armeafeu";
      }
      else if(skill === "armedejet") {
        item.carac = "deftness";
        item.skill = "armedejet";
      } else {
        item.carac = "agility";
        item.skill = "melee";
      }
      html.find(".data-skill")[0].value = item.skill;
      html.find(".data-carac")[0].value = item.carac;
    });
  }

  
}
