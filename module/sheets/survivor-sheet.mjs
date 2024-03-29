import { diceRollHelper } from "../helpers/diceRollHelper.mjs";
import { skillHelper, caracHelper } from "../helpers/characterHelper.mjs";
import { ZCORPS } from "../helpers/config.mjs";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class zcorpsSurvivorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["zcorps", "sheet", "actor", "survivor"],
            width: 600, height: 850,
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
        return `systems/zcorps/templates/actor/actor-${this.actor.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.

        const context = super.getData();

        console.info(context);
        console.info(this.actor);
        context.isGM= game.user.isGM;


        // Use a safe clone of the actor data for further operations.
        const actorData = this.actor.toObject(false);
        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData.system;
        context.flags = actorData.flags.zcorps || {};
        // Prepare character data and items.
        if (actorData.type == "survivor" || actorData.type == "controler") {
            //this.totalSkill = 0;

            this._prepareItems(context);
            this._prepareCharacterData(context);
        }
        if(actorData.type =="zombie"){
		    this._prepareItems(context);
            this._prepareCharacterData(context);
		}

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        context.genderType = { homme: "homme", femme: "femme" };
        context.stressLevel = {
            0: "Calme",
            1: "Enervé",
            2: "Stressé",
            3: "Angoissé",
            4: "Paniqué",
            5: "Choqué",
        };
        context.healthLevel = {
            0: "Pas de blessure",
            1: "Sonné",
            2: "Blessé",
            3: "Gravement blessé",
            4: "Handicapé",
            5: "Mortellement blessé",
            6: "Mort",
        };
        context.modeTir = {
			0: "Tir unique",
			1: "Rafale courte (cible unique)",
			2: "Rafale totale (cible unique)",
			3: "Rafale totale (cibles multiples)",
			4: "Tir de barage"
		}

        this.actor.context = context;
        this.actor.useBonus = false;

		/* Gestion de l'initiative */
		var Dr = "";
		var tr = "";
		if(this.actor.system.caracs.agility.roll){
			[Dr, tr] = this.actor.system.caracs.agility.roll.split('d6')
		}
		if(Dr !== this.actor.system.caracs.agility.value){
			this.actor.system.caracs.agility.roll = this.actor.system.caracs.agility.value+"d6"
			this.actor.update({"system.caracs.agility.roll": this.actor.system.caracs.agility.roll})
		}

        
        /* Gestion de l'infectation */
        const infest = context.flags.addedInfect
        var TotalInfest = 0;
        if(infest){
	        infest.forEach((item) => {
				TotalInfest = Number(item.pourcent) + Number(TotalInfest)
	        });
	        var color = "black";
	        if (TotalInfest <= 10){
				color = "lightgreen"
			}else if(TotalInfest <= 20){
				color = "yellow"
			}else if(TotalInfest <= 30){
				color = "orange"
			}else if(TotalInfest <= 40){
				color = "darkorange"
			}else if(TotalInfest < 49){
				color = "lightcoral"
			}else if(TotalInfest >= 49){
				color = "red"
			}else{
				color = "black";
			}
        	context.totalInfest = {color: color, infest: TotalInfest};
		}else{
        	context.totalInfest = {color: "lightgreen", infest: 0};
		}
        
        if(game.user.roll == 4){
			context.gm = true
		}else{
			context.gm = false
		}
//        console.info(context);
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
        if (context.flags.addedSkill) {
            for (let [caracteristic, skills] of Object.entries(context.flags.addedSkill)) {
                if (Object.keys(context.flags.addedSkill[caracteristic]).length > 0) {
                    for (let [skill, data] of Object.entries(skills)) {
                        context.caracs[caracteristic].skills[skill] = data;
                    }
                }
            }
        }
        if(context.flags.addedSpec){
            for(let [carac_name, carac_info] of Object.entries(context.caracs)){
                for(let [skill_name, skill_info] of Object.entries(carac_info.skills)){
                    if(context.flags.addedSpec[skill_name] && Object.keys(context.flags.addedSpec[skill_name].length > 0)){
                        context.caracs[carac_name].skills[skill_name].specialisations = {};
                        for(let [spec_name, spec_info] of Object.entries(context.flags.addedSpec[skill_name])){
                            context.caracs[carac_name].skills[skill_name].specialisations[spec_name] = spec_info;
                        }
                        
                    }
                }
            }
            // for(let [skill, specialisations] of Object.entries(context.flags.addedSpec)){
            //     if(Object.keys(context.flags.addedSpec[skill].length > 0)){
                   
            //         for(let specialisation of Object.values(specialisations)){
            //             context.caracs[specialisation.carac].skills[specialisation.skill].specialisations[specialisation.name.toLowerCase().replace(" ", "_")] = specialisation; 
            //         }
            //     }
            // }
        }
        //For each Caracteristic :
        for (const caracteristic of Object.values(context.caracs)) {
            //We calculate the skills values
            skillHelper.calculateSkillValues(caracteristic, context);
            caracteristic.formula = caracHelper.getFormula(caracteristic);
        }

        //Calculate devired data
        context.attributes = context.data.attributes;
//        console.info(context)
        context.attributes.movement =
            +context.caracs.strength.value + +context.caracs.agility.value;
        context.attributes.dammageBonus = parseInt(
            Math.ceil(context.caracs.strength.value / 2)
        );

        //Localize the caracteristic name
        for (let [key, carac] of Object.entries(context.caracs)) {
            carac.name = game.i18n.localize(ZCORPS.caracteristics[key]);
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
        const arme = [], ammo = [], gear = [], skills = [], specialisations = [], otherItems = [];
        arme.range = []; arme.cac   = []; arme.jet   = []; arme.explo = [];
        
        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            switch (i.type) {
				case "arme_range":
				  arme.range.push(i);
				break;
				case "arme_cac":
				  arme.cac.push(i);
				break;
				case "arme_explo":
				  arme.explo.push(i);
				break;

				case "armor":
				  gear.push(i);
				break;
				case "ammo":
				  ammo.push(i);
				break;

				case "specialisation":
				  specialisations.push(i);
				break;
				case "skill":
	                skills.push({
	                    name: i.name,
	                    carac: i.data.caracteristic,
	                    value: 0,
	                    owned: true,
	                    tiers: i.data.tiers,
	                    added: true,
	                    id: i._id,
	                });
				break;

				default:
				  otherItems.push(i);
				break;
			}
        }

        // Assign and return
        context.gear = gear;
        context.arme = arme;
        context.ammo = ammo;
        context.specialisations = specialisations;
        context.skillsAdded = skills;
        context.otherItem = otherItems;
    }

    async _onDropItem(event, data) {
        const droppedItem = await Item.implementation.fromDropData(data);
        const droppedItemData = droppedItem.toObject();

        if (droppedItemData.type === "ammo") {
            const tempAmmo = [];

            this.actor.items.forEach((item) => {
                if (
                    item.type === "ammo" &&
                    item.system.type == droppedItemData.system.type
                ) {
                    tempAmmo.push(item);
                }
            });

            if (tempAmmo.length > 0) {
                tempAmmo.forEach((item) => {
                    if (item.system.type == droppedItemData.system.type) {
                        
                        return item.update({
                            "data.quantity":
                                parseInt(item.system.quantity) +
                                parseInt(droppedItemData.system.quantity),
                        });
                    }
                });
//                this.actor.render(true);
            } else {
               
                return this._onDropItemCreate(droppedItemData);
            }
        } else {
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
            if (this.actor.editSheet === undefined) {
                this.actor.editSheet = true;
            } else {
                this.actor.editSheet = !this.actor.editSheet;
            }
            this.actor.sheet.render(true);
        });
        // Render the item sheet for viewing/editing prior to the editable check.
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("item_id"));
            item.sheet.render(true);
        });

        html.find(".tiers-editable").click((ev) => {
            const tier = ev.target;
            const tierClicked = tier.dataset.tier;
            let tierValue = 0;

            if (tierClicked == 1) {
                if (tier.classList.contains("checked")) {
                    if (tier.nextElementSibling.classList.contains("checked")) {
                        tier.nextElementSibling.classList.toggle("checked");
                        tierValue = 1;
                    } else {
                        tier.classList.toggle("checked");
                        tierValue = 0;
                    }
                } else {
                    tier.classList.toggle("checked");
                    tierValue = 1;
                }
            } else {
                if (tier.classList.contains("checked")) {
                    tier.classList.toggle("checked");
                    tierValue = 1;
                } else {
                    if (
                        tier.previousElementSibling.classList.contains(
                            "checked"
                        )
                    ) {
                        tier.classList.toggle("checked");
                        tierValue = 2;
                    } else {
                        tier.previousElementSibling.classList.toggle("checked");
                        tierValue = 1;
                    }
                }
            }

            //If skill modified is an added skill (item), we update the item directly
            // if (tier.dataset.id) {
            //     const item = this.actor.items.get(tier.dataset.id);
            //     const itemSkillValues = item.data.data.tiers;
            //     if (tierValue == 0) {
            //         itemSkillValues.skill_1 = 0;
            //         itemSkillValues.skill_2 = 0;
            //     } else if (tierValue == 1) {
            //         itemSkillValues.skill_1 = 1;
            //         itemSkillValues.skill_2 = 0;
            //     } else {
            //         itemSkillValues.skill_1 = 1;
            //         itemSkillValues.skill_2 = 1;
            //     }
            //     item.update();
            // }
            
            //Else we uptdate the actor data
           
            
            if(tier.dataset.id){
                
                if(tierValue == 1){
                    this.actor.setFlag("zcorps", `addedSkill.${tier.dataset.carac}.${tier.dataset.skill}.tiers`, {"skill_1": 1, "skill_2": 0});
                }
                else if(tierValue == 2) {
                    this.actor.setFlag("zcorps", `addedSkill.${tier.dataset.carac}.${tier.dataset.skill}.tiers`, {"skill_1": 1, "skill_2": 1});
                }
                else {
                    this.actor.setFlag("zcorps", `addedSkill.${tier.dataset.carac}.${tier.dataset.skill}.tiers`, {"skill_1": 0, "skill_2": 0});
                }
            }
            else {
                const tiersData = {
                    value: tierValue,
                    carac: {
                        name: tier.dataset.carac,
                        array: this.actor.system.caracs[tier.dataset.carac].tiers
                        },
                        skill: tier.dataset.skill
                            ? {
                                name: tier.dataset.skill,
                                array: this.actor.system.caracs[tier.dataset.carac].skills[tier.dataset.skill].tiers,
                            }
                            : null,
                };
    
                const dataFormatted = this.actor._getFormattedTiersData(tiersData);
                dataFormatted.skill
                    ? (this.actor.system.caracs[tier.dataset.carac].skills[
                          tier.dataset.skill
                      ].tiers = dataFormatted.skill.array)
                    : (this.actor.system.caracs[tier.dataset.carac].tiers =
                          dataFormatted.carac.array);
            }
            this.actor.update({ system: this.system });
            this.actor.sheet.render(true);
        });

        // Add Inventory Item
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".item")[0];
            const item = this.actor.items.get(li.dataset["item_id"]);
//            console.info(item)
	        let dialog = Dialog.confirm({
	            title: "Suppression d'élément",
	            content: "<p>Confirmer la suppression de '" + item.name + "'.</p>",
	            yes: () => item.delete(),
	            no: () => { },
	            defaultYes: false
	        });
            this.actor.sheet.render(true);
        });

        // Rollable abilities.
        html.find(".rollable").click(this._onRoll.bind(this));

        html.find(".checkbox").click((ev) => {
            const checkbox = ev.currentTarget;
            const checked = checkbox.classList.contains("checked");
            if (this.actor.context.skillsOwned >= game.settings.get("zcorps", "CompMaxNewPerso") && !checked) {
                ui.notifications.warn(
                    "Vous ne pouvez posséder que "+game.settings.get("zcorps", "CompMaxNewPerso")+" compétences maximum!"
                );
            } else {
                this.actor.system.caracs[checkbox.dataset.carac].skills[
                    checkbox.dataset.skill
                ].owned = checkbox.classList.contains("checked");
                checkbox.classList.toggle("checked");

                if (checkbox.classList.contains("checked")) {
                    this.actor.context.skillsOwned =
                        this.actor.context.skillsOwned + 1;
                } else {
                    this.actor.context.skillsOwned =
                        this.actor.context.skillsOwned - 1;
                }

                this.actor.system.caracs[checkbox.dataset.carac].skills[
                    checkbox.dataset.skill
                ].owned = checkbox.classList.contains("checked");
                this.actor.sheet.render(true);
                const temp = JSON.parse(
                    `{"data" : {"caracs" : { "${
                        checkbox.dataset.carac
                    }" : {"skills" : { "${
                        checkbox.dataset.skill
                    }" : {"owned" : ${checkbox.classList.contains(
                        "checked"
                    )}}}}}}}`
                );
                return this.actor.update({ data: this.actor.system });
            }
        });

        html.find(".bonus-icon").click((ev) => {
            const bonus = ev.target;
            const bonusId = bonus.id;
            const availablePoints =
                this.actor.system.attributes[bonusId.split("_")[1]].value;

            if (bonusId == "bonus_xp") {
                if (bonus.classList.contains("fa-check-square")) {
                    bonus.classList.replace("fa-check-square", "fa-square");
                    bonus.dataset.bonus = false;
                    this.actor.useBonus = false;
                    html.find("#bonus_cojones")[0].classList.replace(
                        "fa-minus-square",
                        "fa-square"
                    );
                    html.find("#bonus_cojones")[0].dataset.bonus = false;
                } else {
                    if (availablePoints > 0) {
                        bonus.classList.replace("fa-square", "fa-check-square");
                        bonus.dataset.bonus = true;
                        this.actor.useBonus = "xp";
                        html.find("#bonus_cojones")[0].classList.replace(
                            "fa-square",
                            "fa-minus-square"
                        );
                        html.find("#bonus_cojones")[0].dataset.bonus = false;
                    }
                }
            } else {
                if (bonus.classList.contains("fa-check-square")) {
                    bonus.classList.replace("fa-check-square", "fa-square");
                    bonus.dataset.bonus = false;
                    this.actor.useBonus = false;
                    html.find("#bonus_xp")[0].classList.replace(
                        "fa-minus-square",
                        "fa-square"
                    );
                    html.find("#bonus_xp")[0].dataset.bonus = false;
                } else {
                    if (availablePoints > 0) {
                        bonus.classList.replace("fa-square", "fa-check-square");
                        bonus.dataset.bonus = true;
                        this.actor.useBonus = "cojones";
                        html.find("#bonus_xp")[0].classList.replace(
                            "fa-square",
                            "fa-minus-square"
                        );
                        html.find("#bonus_xp")[0].dataset.bonus = false;
                    }
                }
            }
        });

        html.find(".delete_skill").click(async (ev) => {
            await this.actor.deleteSkillFromActor({
                caracteristic: ev.currentTarget.dataset.caracteristic,
                skill: ev.currentTarget.dataset.skill,
            });
            this.actor.sheet.render(true);
        });
        html.find(".addedSkill").change(ev => {
            this.actor.setFlag("zcorps", `addedSkill.${ev.currentTarget.dataset.carac}.${ev.currentTarget.dataset.skill}.value`, ev.currentTarget.value);
        })
        html.find(".set").click(async ev => {
            const dataset = ev.currentTarget.dataset;
            console.log(this.actor.system.caracs[dataset.set].tier);
            if(dataset.setLevel == "plus") {
                this.actor.system.caracs[dataset.set].tier += 1;
            }
            else {
                this.actor.system.caracs[dataset.set].tier -= 1;
            }
            this.actor.render(true);
        })
        // Drag events for macros.
        if (this.actor.owner) {
            let handler = (ev) => this._onDragStart(ev);
            html.find("li.item").each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
        
        html.find('.reloadArme').click(async ev=>{
            const li = $(ev.currentTarget).parents(".item")[0];
            const item = this.actor.items.get(li.dataset["item_id"]);
			const actor = this.actor;

			const updates = [];
			console.info(item)
			var ammoType = item.system['ammo']['type']
			
			var Mun = this.actor.items.filter(item => item.system.type == ammoType)

			var munManq = item.system['ammo']['max'] - item.system['ammo']['actual']
			console.info(ammoType)

			for(var i = 0 ; Mun.length > i ; i++){
				
				munManq = item.system['ammo']['max'] - item.system['ammo']['actual']

				var newMun = Mun[i];
				
				if(Mun[i].system.quantity > 0 && item.system['ammo']['actual'] < item.system['ammo']['max']){
					if(Mun[i].system.quantity >= munManq){
						item.system['ammo']['actual'] = item.system['ammo']['max'];
						newMun.system.quantity = Mun[i].system.quantity - munManq
					}else if (Mun[i].system.quantity < munManq){
						item.system['ammo']['actual'] = Number(item.system['ammo']['actual']) + Number(Mun[i].system.quantity);
						newMun.system.quantity = 0
					}
					updates.push({_id: Mun[i].id , data: newMun.system});
				}
			}
			updates.push({_id: item.id, data: item.system});
			await Item.updateDocuments(updates, {parent: actor});
			this.actor.sheet.render(true);
		});
        
        html.find(".item-toggle").click(async ev=>{
			const itemNode = ev.currentTarget.parentNode.parentNode;
			var item = this.actor.items.filter(item => item.id == itemNode.dataset.item_id)[0]
			console.info(itemNode, item)
			if(item.system.equipe){
				console.info(1)
				item.update({"data.equipe": false})
			}else{
				console.info(0)
				item.update({"data.equipe": true})
			}
			
		})
        
        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;
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
       
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data,
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
                item.system.formula = "2d6";
                
                if (item) return item.roll();
            } else if (dataset.rollType == "protection") {
                let label = dataset.label ? `[Protection] ${dataset.label}` : "";
                const [dice, tier] = dataset.roll.split("+");
//                console.info(dataset)

	            if(dataset.roll.substring(0,1) == "+"){
					var [d,t] = dataset.roll.split("D+");
//					console.info(this.actor.data.data.caracs)
					d = Number(this.actor.system.caracs.strength.value) + Number(d)
					dataset.roll = d+"D+"+t
				}
//                console.info(tier)

                let formula = dice.toLowerCase() + "6 + " + tier;

            } else if (dataset.rollType == "dammage") {
                let label = dataset.label ? `[Dommage] ${dataset.label}` : "";
                const [dice, tier] = dataset.roll.split("+");
//                console.info(dataset)

	            if(dataset.roll.substring(0,1) == "+"){
					var [d,t] = dataset.roll.split("D+");
					d = Number(this.actor.context.attributes.dammageBonus) + Number(d)
					dataset.roll = d+"D+"+t
				}
//                console.info(tier)

                let formula = dice.toLowerCase() + "6 + " + tier;

            } else if (dataset.rollType == "arme") {
                const itemId = element.closest(".item").dataset['item_id'];
                const item = this.actor.items.get(itemId);
                if(item.system.type !== "arme_melee"){
	                if (item.system['ammo']['actual'] <= 0) {
	                    ui.notifications.error("Pas assez de munitions");
	                    return;
	                }
	                item.system['ammo']['actual'] = item.system['ammo']['actual'] - 1;
	                item.update({"data.ammo.actual": item.system.ammo.actual })
                }

                let label = dataset.label ? `[Arme] ${dataset.label}` : "";
                const [dice, tier] = dataset.roll.split("+");
                let formula = dice.toLowerCase() + "6 + " + tier;
				
//				if(item.data.data.type !== "arme_melee"){
//                item.update({
//                    "data.ammo.actual": item.data.data['ammo']['actual'],
//                });
//				}
            }
        }
        // Handle rolls that supply the formula directly.
        if (dataset.roll) {
            this.actor.roll(dataset);
        }
    }
}
