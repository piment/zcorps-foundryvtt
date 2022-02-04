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
  
  game.settings.register("zcorps", "test", {
    name: `ZCORPS.settings.test.name`,
    default: true,
    type: Boolean,
    scope: 'world',
    config: true,
    hint: `ZCORPS.settings.test.hint`,
  });
 
  // Add custom constants for configuration.
  CONFIG.ZCORPS = ZCORPS;
  CONFIG.debug.hooks = false;
  console.log(CONFIG);
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
/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  $("#logo").attr('src', "systems/zcorps/img/DiscordServerIMG.jpg");
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
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