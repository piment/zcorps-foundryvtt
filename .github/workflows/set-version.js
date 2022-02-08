var fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('system.json', 'utf8'));
// first argument is node, second is the filename of the script, third is the version we pass in our workflow.
// expected tag format is 'refs/tags/v{major}.{minor}.{patch}"
const tagVersion = process.argv[2].split('/').slice(-1)[0]; 
console.log(`${tagVersion}`);
if (!tagVersion || !tagVersion.startsWith('v')) {
  console.error(`Invalid version specified: ${tagVersion}`);
  process.exitCode = 1;
} else {
  manifest.version = tagVersion.substring(1); // strip the 'v'-prefix
  fs.writeFileSync('system.json', JSON.stringify(manifest, null, 2)); // pretty print JSON back to module.json
  console.log(tagVersion);
}