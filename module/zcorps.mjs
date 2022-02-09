// Import document classes.
import { zcorpsActor } from "./documents/actor.mjs";
import { zcorpsItem } from "./documents/item.mjs";
// Import sheet classes.
import { zcorpsActorSheet } from "./sheets/actor-sheet.mjs";
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
    formula: "1d20",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = zcorpsActor;
  CONFIG.Item.documentClass = zcorpsItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zcorps", zcorpsActorSheet, { makeDefault: true });
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

Handlebars.registerHelper("checkSpecialisation", function(spec, skill) {
  
  if(spec.data.skill === skill) {
    return true;
  } else {
    return false;
  }
});

Handlebars.registerHelper("getSkillValuefromActor", (caracs, carac, skill) => {
  //console.log("get skill value");
  //console.log(caracs[carac].skills[skill].total);
  const value = `${caracs[carac].skills[skill].total}D+${caracs[carac].skills[skill].tier}`;
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

Handlebars.registerHelper("createRange", (rangeName, max) => {
  let list = `<datalist id="${rangeName}-list">`;
  for(let i = 0; i <= max; i++) {
    list += `<option value="${i}" label="${i}">${i}</option>`
  }
  list += '</datalist>'
  return new Handlebars.SafeString(`<input list="${rangeName}-list" class="bonus-range" name="${rangeName}" type="range" min="0" max="${max}" step="0" value="0"/>${list}`);
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
/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.on("renderPlayerList", async function(playerList, html) {
  
  const loggedInUser = html.find(`[data-user-id="${game.userId}"]`);
  const tooltip = game.i18n.localize('ZCORPS.gamemaster.title');
  loggedInUser.append(`<button type="button" class="gamemaster_button flex0" title="${tooltip}"><i class="fas fa-dungeon"></i></button>`);

  html.on('click', '.gamemaster_button', event => {
    openGamemasterToolsDialog();
  });
  
})

Hooks.once("ready", async function() {
  $("#logo").attr('src', "systems/zcorps/ui/zc_logo.png");
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.on("renderDialog", (dialog, id, context) => {
  
  if(document.querySelector(".gamemaster_tools_dialog")) {
    document.querySelectorAll('.gm_validate_value').forEach(el =>{
      el.addEventListener("click", ev => {
        const input_value = ev.target.parentNode.children[1].value;
        const actor_id = ev.target.parentNode.children[1].dataset.actor_id;
        const value = ev.target.parentNode.children[1].dataset.value;
        console.log(input_value, actor_id, value);
        const actor = game.actors.get(actor_id);
        actor.data.data.attributes[value].value = input_value;
        actor.update({data: actor.data.data});
      })
    });
    console.log(dialog);
  }

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

async function openGamemasterToolsDialog() {
  const template = "systems/zcorps/templates/gamemaster/tools-dialog.hbs";
  const actors = getActorsList();
  console.log(actors);
  const renderedTemplate = await renderTemplate(template, {actors: actors});
  const data = {
    title: game.i18n.localize('ZCORPS.gamemaster.title'),
    content: renderedTemplate,
    buttons: {}
}

new Dialog(data, {
    with: 500,
    classes: ["gamemaster_tools_dialog"],
}).render(true);
}

function getActorsList() {
  const actors = [];
  game.actors.forEach(actor => {
    if(actor.data.type == "character"){
      actors.push(actor.data);
    }
  });
  return actors;
}