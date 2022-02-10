/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/zcorps/templates/actor/parts/actor-caracs.html",
    "systems/zcorps/templates/actor/parts/actor-items.html",
    "systems/zcorps/templates/actor/parts/actor-effects.html",
    "systems/zcorps/templates/actor/parts/bonusSelection.hbs",
    "systems/zcorps/templates/chat/actions.hbs",
    "systems/zcorps/templates/gamemaster/tools-dialog.hbs",
  ]);
};
