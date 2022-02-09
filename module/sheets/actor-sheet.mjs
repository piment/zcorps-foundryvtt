import { diceRollHelper } from "../helpers/diceRollHelper.mjs";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class zcorpsActorSheet extends ActorSheet {
  

  chatTemplate = {
    "character": "systems/zcorps/templates/chat/actions.hbs"
  };

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
      //this.totalSkill = 0;
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();


    context.genderType = {"homme": "homme", "femme": "femme"};
    context.stressLevel = {0: "Calme", 1: "Enervé", 2: "Stressé", 3: "Angoissé", 4: "Paniqué", 5: "Choqué"};
    context.healthLevel = {0: "Pas de blessure", 1: "Sonné", 2: "Blessé", 3: "Gravement blessé", 4: "Handicapé", 5: "Mortellement blessé", 6: "Mort"};

    this.actor.context = context;
    this.actor.useBonus = false;
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
    
    context.skillsOwned = 0;
    //Calculate the skills base on the caracteristic
    
    
    for (const [caracKey, caracItem] of Object.entries(context.caracs)) {
      for (const [skillKey, skillItem] of Object.entries(caracItem.skills)) {
        if (!skillItem.owned) { 
          skillItem.total = caracItem.value - 1;
          skillItem.tiers.skill_1 = caracItem.tiers.carac_1;
          skillItem.tiers.skill_2 = caracItem.tiers.carac_2;
        } else {
          skillItem.total = +skillItem.value + +caracItem.value;
          skillItem.tiers.carac_1 = caracItem.tiers.carac_1;
          skillItem.tiers.carac_2 = caracItem.tiers.carac_2;
          context.skillsOwned = context.skillsOwned + 1;
        }
        this.actor._calculateTotalValueForSkill(skillItem);
      }
      caracItem.formula = `${caracItem.value}D+${+caracItem.tiers.carac_1 + +caracItem.tiers.carac_2}`;
    }
    context.attributes = context.data.attributes;
    context.attributes.movement = +context.caracs.strength.value + +context.caracs.agility.value;
    context.attributes.dammageBonus = parseInt(Math.ceil(context.caracs.strength.value / 2));
    
    
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

    // Render the Actor sheet for viewing/editing prior to the editable check.
    html.find(".edit-sheet-btn").click((ev) => {
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

    html.find(".tiers-editable").click(ev => {
      const tier =  ev.target;
      const tierClicked = tier.dataset.tier;
      let tierValue = 0;
      let click = "CLICK TIER INFO => ";
      if(tierClicked == 1) {
        click += "Tier 1 ("
        if(tier.classList.contains("checked")) {
          click += "checked)";
          if(tier.nextElementSibling.classList.contains("checked")) {
              tier.nextElementSibling.classList.toggle("checked");
              tierValue = 1;
              click += " [tier 2 checked]";
          }
          else {
            tier.classList.toggle("checked");
            tierValue = 0;
            click += " [tier 2 unchecked]"
          }
        }
        else {
          tier.classList.toggle("checked");
          tierValue = 1;
          click += "unchecked) [tier 2 unchecked]";
        }
      }
      else {
        if(tier.classList.contains("checked")) {
            tier.classList.toggle("checked");
            tierValue = 1;
          }
        else {
          if(tier.previousElementSibling.classList.contains("checked")) {
            tier.classList.toggle("checked");
            tierValue = 2;
          }
          else {
            tier.previousElementSibling.classList.toggle("checked");
            tierValue = 1;
          }
        }
      }
      //console.log(tierValue);
      const tiersData = {
        value : tierValue,
        carac : {
          "name": tier.dataset.carac,
          "array": this.actor.data.data.caracs[tier.dataset.carac].tiers
        },
        skill : 
          tier.dataset.skill ? {
            "name": tier.dataset.skill,
            "array": this.actor.data.data.caracs[tier.dataset.carac].skills[tier.dataset.skill].tiers
          } : null
      };
      
      const dataFormatted = this.actor._getFormattedTiersData(tiersData, this.actor);
      console.log(click);
      console.log(dataFormatted);
      dataFormatted.skill ? this.actor.data.data.caracs[tier.dataset.carac].skills[tier.dataset.skill].tiers = dataFormatted.skill.array : this.actor.data.data.caracs[tier.dataset.carac].tiers = dataFormatted.carac.array;
      this.actor.update({"data": this.actor.data.data});
      this.actor.sheet.render(true);
    })
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

    html.find("#getHits").click(ev => {
      const hitsActual = html.find("#hitsActual")[0].dataset.level;
      const hitsReceived = html.find("#hitsReceived")[0].value;
      let hitsLevel = this._getHitsLevel(parseInt(hitsReceived));
      if(hitsLevel <= hitsActual){
        this.actor.data.data.attributes.health++;
      } else {
        this.actor.data.data.attributes.health = hitsLevel;
      }
      // if(hitsActual === 2 && hitsLevel === 2) {
      //   this.actor.data.data.attributes.health = 3;
      // }
      // else {
        
      // }
      
      this.actor.sheet.render(true);
      //console.log(this.actor);
      //console.log(hitsLevel);
      html.find("#hitsReceived")[0].value = "";
    });

    html.find(".stress_radio").change(ev => {
      ev.currentTarget.classList.add("owned");
    });

    html.find(".checkbox").click(ev => {
      const checkbox = ev.currentTarget;
      const checked = checkbox.classList.contains("checked");

      console.log("## BEFORE CHECKED ",  this.actor.context.skillsOwned);

      if(this.actor.context.skillsOwned >= 12 && !checked){
        ui.notifications.warn("Vous ne pouvez posséder que 12 compétences maximum!");
      }
      else {
        this.actor.data.data.caracs[checkbox.dataset.carac].skills[checkbox.dataset.skill].owned = checkbox.classList.contains("checked");
        checkbox.classList.toggle("checked");
        
        if(checkbox.classList.contains("checked")) {
          this.actor.context.skillsOwned = this.actor.context.skillsOwned + 1 
        }
        else { 
          this.actor.context.skillsOwned = this.actor.context.skillsOwned - 1
        }; 

        console.log("## WHEN CHECKED ",  this.actor.context.skillsOwned);
        this.actor.data.data.caracs[checkbox.dataset.carac].skills[checkbox.dataset.skill].owned = checkbox.classList.contains("checked");
        this.actor.sheet.render(true);
        const temp = JSON.parse(`{"data" : {"caracs" : { "${checkbox.dataset.carac}" : {"skills" : { "${checkbox.dataset.skill}" : {"owned" : ${checkbox.classList.contains("checked")}}}}}}}`);
        console.log(this.actor.data);
        return this.actor.update({"data": this.actor.data.data});
      }
    });

    html.find(".bonus-icon").click(ev => {
      const bonus = ev.target;
      const bonusId = bonus.id;
      if(bonusId == "bonus_xp") {
        if(bonus.classList.contains("fa-check-circle")) {
          bonus.classList.replace("fa-check-circle", "fa-dot-circle");
          bonus.dataset.bonus = false;
          this.actor.useBonus = false;
          html.find("#bonus_cojones")[0].classList.replace("fa-times-circle", "fa-dot-circle");
          html.find("#bonus_cojones")[0].dataset.bonus = false;
        }
        else {
          bonus.classList.replace("fa-dot-circle", "fa-check-circle");
          bonus.dataset.bonus = true;
          this.actor.useBonus = "xp";
          html.find("#bonus_cojones")[0].classList.replace("fa-dot-circle", "fa-times-circle");
          html.find("#bonus_cojones")[0].dataset.bonus = false;
        }
      }
      else {
        if(bonus.classList.contains("fa-check-circle")) {
          bonus.classList.replace("fa-check-circle", "fa-dot-circle");
          bonus.dataset.bonus = false;
          this.actor.useBonus = false;
          html.find("#bonus_xp")[0].classList.replace("fa-times-circle", "fa-dot-circle");
          html.find("#bonus_xp")[0].dataset.bonus = false;
        }
        else {
          bonus.classList.replace("fa-dot-circle", "fa-check-circle");
          bonus.dataset.bonus = true;
          this.actor.useBonus = "cojones";
          html.find("#bonus_xp")[0].classList.replace("fa-dot-circle", "fa-times-circle");
          html.find("#bonus_xp")[0].dataset.bonus = false;
        }
      }
    })
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
  async _onRoll(event) {
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
      
      
      const bonus = this.actor.useBonus;
      const healthStatus = this.actor.data.data.attributes.health;
      //const malus = parseInt(this._getMalus(+healthStatus));
      let label = dataset.label ? `[lance] ${dataset.label} (${dataset.roll}) (Malus: ${this.actor.context.healthLevel[healthStatus]})` : "";

      const dicePool = new diceRollHelper({actor: this.actor, formula: dataset.roll});
      console.log("dicepool health statuts", dicePool.getHealthStatus())
      if(dicePool.getHealthStatus() == -1) {
        ui.notifications.error("Le personnage est mort, désolé!..");
        return;
      }
    
      //If the player choose to use character or cojones points
      if(!dicePool.canAct){
        ui.notifications.warn("Le personnage n'est pas en capacité d'agir");
        return;
      }
      if(bonus) {
        await dicePool.useBonus(bonus);
      }
      
      //BUG Use health/stress malus
      let roll = await new Roll(dicePool.getFinalFormula(), this.actor.getRollData()).roll();
      const template = "systems/zcorps/templates/chat/actions.hbs";
      const templateRendered = await renderTemplate(template, {data : roll});
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          rollMode: game.settings.get("core", "rollMode"),
          content: templateRendered
          
      })
      document.querySelectorAll(".bonus-icon").forEach(el => {
        el.classList.remove("fa-check-circle", "fa-times-circle");
        el.classList.add("fa-dot-circle");
      })
      this.actor.useBonus = false;
        // if(bonus == "xp"){ //Use of character point
        //   const bonusAvailable = this.actor.data.data.attributes[bonus].value; //We get the available character point.
        //   const numberOfPoints = await game.zcorps.rollWithBonus(dataset.roll, bonus, bonusAvailable);
        //   if(!numberOfPoints) {
        //     return;
        //   }
        //   formula = this.actor._parseRollFormulaWithMalus(numberOfPoints, malus);
        // }
        // else {
        //   console.log("Player choosed to use COJONES");
        //   return;
        // }

      
      // else {
      //   formula = this.actor._parseRollFormulaWithMalus(dataset.roll, malus);
      // }
      
      
      // if(!formula) {
      //   ui.notifications.error("Le personnage n'est pas en capacité d'agir");
      //   return;
      // }
      
      // let roll = await new Roll(formula, this.actor.getRollData()).roll();
      // const rollResult = this._parseRollResult(roll.terms, 'bonus');
      // //console.log(rollResult);
      // //console.log(rollResult.terms[0].results[0].result);
      // // const message = ChatMessage.create({
      // //   speaker: ChatMessage.getSpeaker({actor: this.actor}),
      // //   flavor: "test",
      // //   content: await renderTemplate(this.chatTemplate["character"], roll.terms)
      // // });
      // // roll.toMessage({
      // //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      // //   flavor: label,
      // //   rollMode: game.settings.get("core", "rollMode"),
      // //   content : await renderTemplate(this.chatTemplate["character"], roll.terms)
      // // })
      // return roll;
    }

    
  }
  _parseRollResult(terms, bonus) {
    //console.log("Use Bonus ? => ", this.actor.useBonus);
    //console.log(terms);
    const diePool = {};
    terms.forEach(el => {
      if(el.results)
        if(el.modifiers[0] == "x") {
          if(el.flavor == "bloodmoon") {
            diePool["joker"] = el.results.map(dice => dice.result);
          }
          else {
            diePool["joker_xp"] = diePool["joker"] = el.results.map(dice => dice.result);
          }
        }
        else {
          diePool["diceBase"] = el.results.map(dice => dice.result);
        }
    })
    console.log(diePool);
      return "result du parse";
  }

}
