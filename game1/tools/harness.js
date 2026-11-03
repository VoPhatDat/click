// Headless harness: loads the simulation (no canvas/audio) into Node.
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const SIM_FILES = fs.readdirSync(SRC).filter(f => /^0[0-5]_/.test(f) || /^06_story/.test(f)).sort();
function load() {
  delete globalThis.PZ;
  for (const f of SIM_FILES) vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f });
  return globalThis.PZ;
}
module.exports = { load, SIM_FILES };
