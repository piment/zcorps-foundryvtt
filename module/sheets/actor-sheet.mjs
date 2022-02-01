import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class zcorpsActorSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["zcorps", "sheet", "actor"],
      template: "systems/zcorps/templates/actor/actor-sheet.html",
      width: 600,
      height: 850,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "features",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/zcorps/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == "character") {
      this.totalSkill = 0;
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    //console.log(context);
    return context;
  }
  
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    context.caracs = context.data.caracs;
    for (const [key, carac] of Object.entries(context.caracs)) {
      for (const [key, skill] of Object.entries(carac.skills)) {
        if (!skill.owned) {
          skill.value = carac.value - 1;
          skill.total = skill.value;
        } else {
          this.totalSkill++;
          skill.total = parseInt(carac.value) + parseInt(skill.value);
        }
      }
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const arme = [];
    const ammo = [];
    const specialisation = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === "item") {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === "arme") {
        arme.push(i);
      }
      // Append to Ammo.
      else if (i.type === "ammo") {
        ammo.push(i);
        let ammoFinal = {}
        ammo.forEach(item => {
          //console.log(item);
          if(ammoFinal[item.data.type] === undefined) {
            ammoFinal[item.data.type] = { "quantity" : +item.data.quantity, "name": item.name};
          } else {
            ammoFinal[item.data.type].quantity = ammoFinal[item.data.type].quantity + +item.data.quantity;
          }
        });
        // for (const [key, item] of Object.entries(ammoFinal)) {
        //   Item.create({name: item.name, type: "ammo", data: { type: key, quantity: item.quantity}}, { parent: this.actor })
          
        //   console.log(item);
        //  };
        //console.log(ammoFinal);
      }
      else if (i.type === "specialisation") {
        specialisation.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.arme = arme;
    context.ammo = ammo;
    context.specialisation = specialisation;
  }

  async _onDropItem(event, data) {

    const droppedItem = await Item.implementation.fromDropData(data);
    const droppedItemData = droppedItem.toObject();

    if(droppedItemData.type === "ammo"){

      const tempAmmo = [];

      this.actor.items.forEach(item => {
        if(item.type === "ammo" && item.data.data.type == droppedItemData.data.type) {
          tempAmmo.push(item);
        }
      });

      if (tempAmmo.length > 0) {
        tempAmmo.forEach(item => {
          if(item.data.data.type == droppedItemData.data.type) {
            console.log(parseInt(item.data.data.quantity) + parseInt(droppedItemData.data.quantity));
            return item.update({"data.quantity": parseInt(item.data.data.quantity) + parseInt(droppedItemData.data.quantity)});
          }
        })
        this.ActorSheet.render(true);
      }
      else {
        return this._onDropItemCreate(droppedItemData);
      } 
    }

    else {
      return this._onDropItemCreate(droppedItemData);
    }
    
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".skillCheckbox").click(ev => {
      if(this.totalSkill >= 12){
        ev.currentTarget.checked = false;
        ev.currentTarget.classList.add("error");
      }
    })
    html.find(".edit-btn").click((ev) => {
      ev.preventDefault();
      if(this.actor.editSheet === undefined) {
        this.actor.editSheet = true;
      }
      else {
        this.actor.editSheet = !this.actor.editSheet;
      }
      this.actor.sheet.render(true);
    });
    // Render the item sheet for viewing/editing prior to the editable check.
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      //console.log(item);
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    //console.log(type);
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemId = element.closest(".item").dataset.itemId;
        //const item = this.actor.items.get(itemId);
        const item = this.actor.getOwnedItem(itemId);
        item.data.data.formula = "2d6";
        //console.log(item);
        if (item) return item.roll();
      }
      else if (dataset.rollType == "dammage") {
        let label = dataset.label ? `[Dommage] ${dataset.label}` : "";
        const [dice, tier] = dataset.roll.split("+");
        let formula =  dice.toLowerCase() + "6 + " + tier; 
        let roll = new Roll(formula, this.actor.getRollData());
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          rollMode: game.settings.get("core", "rollMode"),
        });
        return roll;
      }
      else if (dataset.rollType == "arme") {
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if(item.data.data["ammo-actual"] == 0){
          ui.notifications.error('Pas assez de munitions');
          return
        }
        item.data.data["ammo-actual"] = item.data.data["ammo-actual"] - 1;
        let label = dataset.label ? `[Arme] ${dataset.label}` : "";
        const [dice, tier] = dataset.roll.split("+");
        let formula =  dice.toLowerCase() + "6 + " + tier; 
        let roll = new Roll(formula, this.actor.getRollData());
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          rollMode: game.settings.get("core", "rollMode"),
        });
        this.actor.sheet.render(true);
        return item.update({"data.ammo-actual": item.data.data["ammo-actual"]});
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[lance] ${dataset.label} (${dataset.roll})D6` : "";
      let formula = (parseInt(dataset.roll) - 1) + "d6 + 1d6x"
      let roll = new Roll(formula, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }
}
