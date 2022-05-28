// Import document classes.
import { zcorpsActor } from "./documents/actor.mjs";
import { zcorpsItem } from "./documents/item.mjs";
// Import sheet classes.
import { zcorpsSurvivorSheet } from "./sheets/survivor-sheet.mjs";
import { zcorpsControlerSheet } from "./sheets/controler-sheet.mjs";
import { zcorpsItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { ZCORPS } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  console.log("Z-Corps | initialisation");
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.zcorps = {
    zcorpsActor,
    zcorpsItem,
    rollItemMacro
  };
  
  game.settings.register("zcorps", "XPPointPerRollMax", {
    name: `Points de personnage Max`,
    default: "3",
    type: String,
    choices: {"0":"0", "1":"1", "2":"2", "3":"3", "4":"4", "5":"5"},
    scope: 'world',
    config: true,
    hint: `Points de personnage maximum utilisable par jet de dé`,
    onChange: value => game.settings.set("zcorps", "XPPointPerRollMax", value)
  });
 
  // Add custom constants for configuration.
  CONFIG.ZCORPS = ZCORPS;
  CONFIG.debug.hooks = false;
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@caracs.agility.roll",
    decimals: 2
  };
  console.info(CONFIG.Combat.initiative)

  // Define custom Document classes
  CONFIG.Actor.documentClass = zcorpsActor;
  CONFIG.Item.documentClass = zcorpsItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zcorps", zcorpsSurvivorSheet, { makeDefault: true });
  Actors.registerSheet("zcorps", zcorpsControlerSheet);
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("zcorps", zcorpsItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('showTotalForSkill', function(str) {
  if(!str) {
    return str;
  }
  else {
    return `${str}D`;
  }
});

Handlebars.registerHelper("getSkillValuefromActor", (caracs, carac, skill) => {
  //console.log("get skill value");
  //console.log(caracs[carac].skills[skill].total);
//  const value = `${caracs[carac].skills[skill].total}D+${caracs[carac].skills[skill].tier}`;
  const value = `${caracs[carac].skills[skill].formula}`;
  return value;
});

Handlebars.registerHelper("getHealthStatus", level => {
  switch(parseInt(level)) {
    case 0: 
      return "Pas de blessure";
      break;
    case 1: 
      return "Sonné";
      break;
    case 2: 
      return "Blessé";
      break;
    case 3: 
      return "Gravement Blessé";
      break;
    case 4: 
      return "Handicapé";
      break;
    case 5: 
      return "Mortellement blessé";
      break;
    case 6: 
      return "Mort";
      break;
    default:
      return "Pas de blessure"
      break;
  }
});

Handlebars.registerHelper("createRange", (limit, available) => {
  let list = `<datalist id="xp-list">`;
  limit = limit > available ? available : limit;
  for(let i = 0; i <= limit; i++) {
    list += `<option value="${i}" label="${i}">${i}</option>`
  }
  list += '</datalist>'
  return new Handlebars.SafeString(`<input list="xp-list" class="bonus-range" name="xp" type="range" min="0" max="${limit}" step="0" value="0"/>${list}`);
});

Handlebars.registerHelper("getDiceByColor", (dice, color) => {
  return dice.filter(die => die.flavor == color);
})

Handlebars.registerHelper("parseResults", (results) => {
  Object.entries(results).forEach((el, key) => {
      console.log("EL[0] => ", el[0]);
      if(el[0] == "results") {
        console.log("el[0] == results");
        console.log("RESULTS :");
        console.log(results["faces"]);
      }
      

  })
});

Handlebars.registerHelper("getTotalForDiceSet", (diceSet) => {
  return diceSet.reduce((init, cur) => init + cur);
})
/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */



Hooks.once("ready", async function() {
  $("#logo").attr('src', "systems/zcorps/ui/zc_logo.png");
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.on("renderPlayerList", async function(playerList, html) {
  
  if(game.user.data.role == 4){
    const loggedInUser = html.find(`[data-user-id="${game.userId}"]`);
    const tooltip = game.i18n.localize('ZCORPS.gamemaster.title');
    loggedInUser.append(`<button type="button" class="gamemaster_button flex0 gm_tool" title="${tooltip}"><i class="fas fa-dungeon"></i></button>`);
    loggedInUser.append(`<button type="button" class="gamemaster_button flex0 gm_infect" title="${tooltip}"><i class="fas fa-radiation"></i></button>`);

    html.on('click', '.gm_tool', event => {
      openGamemasterToolsDialog("tools");
    });
    html.on('click', '.gm_infect', event => {
      openGamemasterToolsDialog("infect");
    });

  }
  
  
});

Hooks.on("renderDialog", (dialog, id, context) => {
  
  if(document.querySelector(".gamemaster_tools_dialog")) {
    document.querySelectorAll('.gm_validate_value').forEach(el =>{
      el.addEventListener("click", ev => {
        const input_value = ev.target.parentNode.querySelector('input').value;
        const actor_id = ev.target.parentNode.children[0].dataset.actor_id;
        const value = ev.target.parentNode.children[0].dataset.value;
        const actor = game.actors.get(actor_id);
//        console.log(input_value, actor_id, value, actor);
        actor.data.data.attributes[value].value = parseInt(actor.data.data.attributes[value].value) + parseInt(input_value);;
        actor.data.data.attributes[value].total = parseInt(actor.data.data.attributes[value].total) + parseInt(input_value);
        actor.update({data: actor.data.data});
        ev.target.parentNode.children[0].value = 0;
      })
    });
    if (document.querySelector(".gm_tools")){
	    document.querySelector(".gm_add_skill").addEventListener("click", async ev => {
	      ev.preventDefault();
	      const table = document.querySelector("#addSkillToActor");
	      const actorId = table.querySelector("#selectedActorForCarac").value;
	      const caracteristic = table.querySelector("#caracteristic").value;
	      const skill = table.querySelector("#skillToAdd").value;
	      const actor = game.actors.get(actorId);
//	      console.log(actorId, caracteristic, skill, actor);
	      table.querySelector("#skillToAdd").value = "";
	      await actor.addSkillToActor({caracteristic: caracteristic, id: skill.toLowerCase().replace(" ", "_"), name: skill})
	      
	    });
	    document.querySelector(".gm_add_spec").addEventListener("click", async ev => {
	      ev.preventDefault();
	      const actorId = ev.target.parentNode.querySelector(".actor_name").dataset.actor_id;
	      const skill = ev.target.parentNode.querySelector("#skill").value;
	      const caracteristic = ev.target.parentNode.querySelector("#skill").options[ev.target.parentNode.querySelector("#skill").selectedIndex].dataset.caracteristic;
	      const spec = ev.target.parentNode.querySelector("#specToAdd").value;
	      const actor = game.actors.get(actorId);
	      ev.target.parentNode.querySelector("#specToAdd").value = "";
	      await actor.addSpecToSkill(spec, skill, caracteristic);
	    });
	}else if (document.querySelector(".gm_infect")){
	    document.querySelectorAll(".gm_add_infect").forEach(el =>{el.addEventListener("click", async ev => {
	      ev.preventDefault();
//	      console.info(ev.target.parentNode.parentNode.parentNode)
		  const cont = ev.target.parentNode.parentNode.parentNode
	      const actorId  = cont.querySelector(".actor_name").dataset.actor_id;
	      const pourcent = cont.querySelector("#infectPourcentToAdd_"+actorId).value;
	      const time     = cont.querySelector("#infectTimeToAdd_"+actorId).value;
	      const infect = {pourcent: pourcent, time:time}
	      const actor = game.actors.get(actorId);
	      cont.querySelector("#infectPourcentToAdd_"+actorId).value = 0;
	      cont.querySelector("#infectTimeToAdd_"+actorId).value = 0;
	      await actor.addInfect(infect);
	      openGamemasterToolsDialog("infect");
		  const dialog = document.getElementById("InfectFormGm").parentNode.parentNode.parentNode;
	      dialog.parentNode.removeChild(dialog)
	    });
	   })
	    document.querySelectorAll(".gm_supp_infect").forEach(el =>{el.addEventListener("click", async ev => {
	      ev.preventDefault();
		  const cont = ev.target.parentNode.parentNode.parentNode.parentNode
	      const actorId  = cont.querySelector(".actor_name").dataset.actor_id;
	      const infect = ev.target.parentNode.dataset.key ;
	      const actor = game.actors.get(actorId);
	      await actor.deleteInfect(infect);
	      openGamemasterToolsDialog("infect");
	      const dialog = document.getElementById("InfectFormGm").parentNode.parentNode.parentNode;
	      dialog.parentNode.removeChild(dialog)
	    });
	   })
  }}

  if(document.querySelector(".formula_bonus")) {
    const formula_bonus_input = document.querySelector(".formula_bonus")
  formula_bonus_input.classList.add("hidden");
  document.querySelectorAll(".bonus-range").forEach(el => {

    el.addEventListener("input", ev => {
      const label = document.querySelector(`#${ev.target.name}-range-value`);
      if(ev.target.name == "xp") {
        formula_bonus_input.value = ev.currentTarget.value;
      }
      label.innerHTML = ev.currentTarget.value;
    })
  })
  }
  
});

Hooks.on("renderChatMessage", (msg, html, data) => {
  //Type 5 = Roll
  if(msg.data.type == 5) {
    const message = html.find(`[data-message-id="${msg.id}"]`);
    message.prevObject[0].classList.add("actions-message");

    html.find(".rerollXP_btn").click(async ev => {
      ev.preventDefault();
      const actor = game.actors.get(data.message.speaker.actor);
      const use_joker = ev.currentTarget.dataset.jokerUsed ? false : true;
      const use_xp = parseInt(ev.currentTarget.dataset.xpUsed);
      const xpFormula = await actor.reRoll(use_joker, use_xp, ev.currentTarget.dataset.label);
      if(xpFormula) {
        const msgCard = document.querySelector(`[data-message-id="${msg.id}"]`);
        const btn = msgCard.querySelector(".rerollXP_btn");
        msgCard.querySelector(".rerollXP").removeChild(btn);
      }
      
    });
  }
})

Hooks.on("createItem", (item, info, tempData, actorId) => {
//  console.log("preCreateItem : ", item);
  if(item.data.type === "skill"){
    item.data.img = "systems/zcorps/ui/icons/vial-solid.svg";
  }
})

Hooks.on('renderItemSheet', (item, sheet, option) => {
  if(item.type === "skill") {
    sheet[0].classList.add("item-skill");
    const resizeIcon = sheet[0].querySelector(".window-resizable-handle");
    if(resizeIcon) {sheet[0].removeChild(resizeIcon)};
  }
  
})
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.zcorps.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "zcorps.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

async function openGamemasterToolsDialog(env) {
  const template = "systems/zcorps/templates/gamemaster/"+env+"-dialog.hbs";
  const actors = getActorsList();
  const caracteristics = {};
  for(let [key, value] of Object.entries(ZCORPS.caracteristics)) {
    caracteristics[key] = game.i18n.localize(value);
  }
  
  if(env == "infect"){
  }else{
  }
  
  const renderedTemplate = await renderTemplate(template, {actors: actors, caracteristics: caracteristics });
  const data = {
    title: game.i18n.localize('ZCORPS.gamemaster.title'),
    content: "<style>.gamemaster_tools_dialog{width:600px}</style>"+renderedTemplate,
    buttons: {}
  }

  new Dialog(data, {
	width: "100px",
	classes: ["gamemaster_tools_dialog gm_"+env],
    }).render(true);
}

function getActorsList() {
	var actors = {};
	actors["survivor"] = [];
	actors["controler"] = [];
	actors["zombie"] = [];
	actors["npc"] = [];
    game.actors.forEach(actor => {
    if(actor.data.type == "survivor" || actor.data.type == "controler"){
	  console.info(actor.data.flags)
	  var Tinfect = 0
	  if("zcorps" in actor.data.flags && "addedInfect" in actor.data.flags.zcorps){
		actor.data.flags.zcorps.addedInfect.forEach(infect =>{
			Tinfect += Number(infect.pourcent)
        	}
		)
	  }
	    var color = "black";
	    if (Tinfect <= 10){
			color = "lightgreen"
		}else if(Tinfect <= 20){
			color = "yellow"
		}else if(Tinfect <= 30){
			color = "orange"
		}else if(Tinfect <= 40){
			color = "darkorange"
		}else if(Tinfect < 49){
			color = "lightcoral"
		}else if(Tinfect >= 49){
			color = "red"
		}else{
			color = "black";
		}
      actors[actor.data.type].push({data: actor.data, skills: actor._getSkillsList(), infect: Tinfect, color: color});
    }
  });
  console.info(actors)
  return actors;
}

var img = document.getElementById('logo')
//img.style.display="none";
img.parentElement.removeChild(img)