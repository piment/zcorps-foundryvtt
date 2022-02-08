var fs = require('fs');
console.log("Lecture du fichier system.json");
const manifest = JSON.parse(fs.readFileSync('system.json', 'utf8'));
// first argument is node, second is the filename of the script, third is the version we pass in our workflow.
// expected tag format is 'refs/tags/v{major}.{minor}.{patch}"
console.log("Lecture du numéro de version");
const tagVersion = process.argv[2].split('/').slice(-1)[0]; 
console.log("Lecture du numéro de version = > ", tagVersion);

if (!tagVersion || !tagVersion.startsWith('v')) {
  console.error(`Invalid version specified: ${tagVersion}`);
  process.exitCode = 1;
} else {
    console.log("Application des nouvelles variables...");
  manifest.version = tagVersion.substring(1); // strip the 'v'-prefix
  manifest.manifest = `https://github.com/piment/zcorps-foundryvtt/releases/download/${tagVersion.substring(1)}/system.json`;
  manifest.download = `https://github.com/piment/zcorps-foundryvtt/releases/download/${tagVersion.substring(1)}/archive.zip`;
  manifest.workflow = true;
  console.log("Fin d'pplication des nouvelles variables...");
  fs.writeFileSync('system.json', JSON.stringify(manifest, null, 2)); // pretty print JSON back to module.json
  console.log("Ecriture du fichier réussi");
  console.log("Fin du programme");
}