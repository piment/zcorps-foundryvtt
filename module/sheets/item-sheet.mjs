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
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    const itemType = context.item.type;

    const typeCollection = ["arme_cac", "arme_range", "arme_explo"]

    if(typeCollection.includes(context.item.type) && context.item.system.use.skill == ""){
      var use = {"skill": "","carac":""};
      var item = context.item.system;
      // console.info(item)
      switch(context.item.type){
        case 'arme_cac':
          item.type = "arme_melee"
          item.use.carac = "agility";
          item.use.skill = "melee";
          console.log('CAC');
          break;
        case 'arme_range':
          item.type = "arme_a_feu"
          item.use.carac = "deftness";
          item.use.skill = "armeafeu";
          console.log('RANGE');
          break;
        case 'arme_explo':
          item.type = "arme_explosive"
          item.use.carac = "deftness";
          item.use.skill = "armedejet";
          console.log('EXPLO');
          break;
        default:
          // console.log(`Sorry, we are out of ${expr}.`);
      }
      context.item.update({'system': item});
      // html.find(".data-skill")[0].value = item.use.skill;
      // html.find(".data-carac")[0].value = item.use.carac;
    }

    //SKILL PART
    if(itemType == "skill"){
      context.caracteristics = {}
      for(let [key, skill] of Object.entries(ZCORPS.caracteristics)) {
        context.caracteristics[key] = game.i18n.localize(ZCORPS.caracteristics[key]);
      }
    }
    

    context.ammoType = {0: ".38", 1: "9mm", 2: ".22"};
    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }
    context.actor = this.actor ? this.actor.system : {};
    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.system;
    context.flags = itemData.flags;
    context.armeType = {"arme_a_feu": "armes à feu", "arme_de_jet": "arme de jet", "arme_explosive" : "Explosif", "arme_melee": "arme de mêlée"};
    context.munType = {
			"Arme de jet": "",
	        "9mm": "9mm",
			".357":".357",
			".38":".38",
			".45":".45",
			".50":".50",
			".270":".270",
			".30-30":".30-30",
			".30-06":".30-06",
			"Cal .12":"Cal .12",
			"Cal .50":"Cal .50",
			"7.62":"7.62",
			"X-26":"X-26"
	};
	
	//Diff dans l'affichage des items de type arme
	// console.info(context)
	context.affichageArme = true;
	if (context.data.type == "arme_melee"){
		context.affichageArme = false;
	}
	
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
      let item = this.object.system;
      let skill = ev.currentTarget.value;
      if(skill == "arme_a_feu") {
        item.use.carac = "deftness";
        item.use.skill = "armeafeu";
      }
      else if(skill == "arme_de_jet" || skill == "arme_explosive") {
        item.use.carac = "deftness";
        item.use.skill = "armedejet";
      } else {
        item.use.carac = "agility";
        item.use.skill = "melee";
      }
      html.find(".data-skill")[0].value = item.use.skill;
      html.find(".data-carac")[0].value = item.use.carac;
    });
  }

  
}
