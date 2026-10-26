// Verify the actual tarball against reviewed sources, installed runtime and evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { auditProvenance, forbiddenProvenanceReference, auditReleaseGuards } from './check.mjs';

const root = path.resolve(import.meta.dirname,'..'), exec = promisify(execFile);
const read = async file => JSON.parse((await fs.readFile(path.join(root,file),'utf8')).replace(/^\uFEFF/,''));
const pack = (await read('artifacts/pack.json'))[0];
const packageVersion=(await read('package.json')).version;
const installed=path.join(root,`.dev/install-${packageVersion.replaceAll('.','-')}/node_modules/dsh-companion`);
const archive = path.join(root,'artifacts/release',pack.filename);
const bytes = await fs.readFile(archive), digest = algorithm => createHash(algorithm).update(bytes).digest('hex');
assert.equal(bytes.length,pack.size); assert.equal(digest('sha1'),pack.shasum);
const {stdout} = await exec('tar',['-tzf',archive],{windowsHide:true,maxBuffer:1024*1024});
const entries = stdout.trim().split(/\r?\n/), expected = pack.files.map(f => `package/${f.path}`);
assert.deepEqual([...entries].sort(),[...expected].sort());
for (const entry of entries) {
  assert.ok(entry.startsWith('package/'));
  assert.equal(entry.includes('\\'),false);
  assert.equal(entry.split('/').some(p=>p==='..'||p==='.'),false);
  assert.equal(/(?:^|\/)(?:\.dev|node_modules|artifacts|secrets\.json|world-state\.json)(?:\/|$)|\.(?:jar|log|exe|tgz)$|tools\/xhh\//.test(entry),false,entry);
}
const unpacked = path.join(root,'.dev/final-archive'); await fs.mkdir(unpacked,{recursive:true});
await exec('tar',['-xzf',archive,'-C',unpacked],{windowsHide:true});
const provenance = JSON.parse(await fs.readFile(path.join(unpacked,'package/data/provenance.json'),'utf8'));
assert.deepEqual(auditProvenance(provenance,{rootDir:path.join(unpacked,'package')}),[],'Unpacked provenance failed release checks');
assert.equal(provenance.filter(entry=>forbiddenProvenanceReference.test(entry.source)||forbiddenProvenanceReference.test(entry.target)).length,0);
const forbiddenSourceMatches = provenance.filter(entry=>/xhh|sign|\.\.\/|plugins\//i.test(entry.source)).length;
assert.equal(forbiddenSourceMatches,0,'Unpacked provenance contains an excluded source reference');
let identicalInstalledRuntimeFiles = 0;
for (const file of pack.files) {
  const shipped = await fs.readFile(path.join(unpacked,'package',file.path));
  assert.deepEqual(shipped,await fs.readFile(path.join(root,file.path)),`${file.path} differs from reviewed source`);
  if (/^(?:lib|tools|data)\/|^(?:package\.json|cordis\.patch\.yml)$/.test(file.path)) {
    assert.deepEqual(shipped,await fs.readFile(path.join(installed,file.path)),`${file.path} differs from actual host-tested installation`);
    identicalInstalledRuntimeFiles++;
  }
}
const unit = await fs.readFile(path.join(root,'artifacts/unit-tests.tap'),'utf8');
const unitCount=Number(/# pass (\d+)/.exec(unit)?.[1]);assert.ok(unitCount>=98);assert.match(unit,/# fail 0\r?\n/);assert.match(unit,/# cancelled 0\r?\n/);
const browser = await read('artifacts/browser-panel.json'); assert.equal(browser.ok,true); assert.equal(browser.packageVersion,packageVersion);assert.equal(browser.scenarios.length,11);
const counts = {};
for (const [key,file,count] of [
  ['hostAPI','host-verification.json',15],['hostBrowser','host-panel-browser.json',5],['lifecycle','lifecycle-verification.json',11],
]) {
  const evidence = await read(`artifacts/${file}`); assert.equal(evidence.error,undefined);
  assert.equal(evidence.packageVersion,packageVersion,'Evidence is from an older package');
  assert.equal(evidence.checks.length,count); assert.ok(evidence.checks.every(c=>c.pass)); counts[key] = count;
}
const world = await read('artifacts/world-verification.json');
assert.equal(world.packageVersion,packageVersion);
assert.equal(world.result,'passed'); assert.equal(world.checks.length,18); assert.equal(world.sourceUnchanged,true);
for (const key of ['remainingListeners','remainingOwnedPids','remainingBodyPids','remainingNewSupervisors']) assert.deepEqual(world[key],[]);
const guidedBrowser=await read('artifacts/browser-onboarding.json');assert.equal(guidedBrowser.ok,true);assert.equal(guidedBrowser.packageVersion,packageVersion);assert.equal(guidedBrowser.checks.length,13);assert.ok(guidedBrowser.checks.every(c=>c.pass));
for(const [file,count] of [['030-world-verification.json',5],['030-source-verification.json',7]]){const e=await read('artifacts/'+file);assert.equal(e.result,'passed');assert.equal(e.packageVersion,packageVersion);assert.equal(e.checks.length,count);assert.ok(e.checks.every(c=>c.pass));assert.deepEqual(e.remainingListeners,[]);assert.equal(e.cleanupError,undefined);}
const portable=await read('artifacts/040-portable-verification.json');assert.equal(portable.packageVersion,packageVersion);assert.equal(portable.result,'passed');assert.equal(portable.checks.length,7);assert.ok(portable.checks.every(c=>c.pass));assert.deepEqual(portable.remainingOwnedPids,[]);
const pin=await read('tools/known-good.json');assert.deepEqual(auditReleaseGuards(pin,await fs.readFile(path.join(root,'lib/core/setup.js'),'utf8')),[]);
assert.equal(pin.paper.releaseVerified,true);assert.equal(pin.skinsrestorer.releaseVerified,true);
assert.equal(pin.paper.minecraftVersion,'1.21.8');
const skinSpike=await read('artifacts/skin-spike.json');assert.equal(skinSpike.clientVisible.status,'passed');assert.equal(skinSpike.clientVisible.clientVersion,pin.paper.minecraftVersion);
const imagePath=pin.paper.clientEvidence.path;assert.match(imagePath,/^docs\/images\/[\w.-]+\.png$/);assert.equal(skinSpike.clientVisible.screenshot,imagePath);
const imageHash=createHash('sha256').update(await fs.readFile(path.join(root,imagePath))).digest('hex');assert.equal(imageHash,pin.paper.clientEvidence.sha256);assert.equal(imageHash,skinSpike.clientVisible.sha256);assert.ok(Date.parse(skinSpike.clientVisible.observedAt));
const skinBrowser=await read('artifacts/browser-skin.json');assert.equal(skinBrowser.packageVersion,packageVersion);assert.equal(skinBrowser.ok,true);assert.equal(skinBrowser.checks.length,6);assert.ok(skinBrowser.checks.every(c=>c.pass));
const skinWorld=await read('artifacts/skin-release-verification.json');assert.equal(skinWorld.packageVersion,packageVersion);assert.equal(skinWorld.result,'passed');assert.equal(skinWorld.checks.length,9);assert.ok(skinWorld.checks.every(c=>c.pass));assert.deepEqual(skinWorld.remainingListeners,[]);assert.equal(skinWorld.cleanupError,undefined);
const protectedFiles=await read('.dev/052-protected-before.json');
for(const [file,hash] of Object.entries(protectedFiles))assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),hash,`Protected file changed: ${file}`);
const adapters=await fs.readFile(path.join(root,'lib/adapters/index.js'),'utf8');
assert.equal(adapters.slice(adapters.indexOf('  const qq ='),adapters.indexOf('  const adapters =')),await fs.readFile(path.join(root,'.dev/0.3-protected-adapter-tail.txt'),'utf8'),'Protected QQ/Bili/Heybox adapter implementations changed');
assert.equal(provenance.length,54);
for(const file of ['030-managed-actual.png','030-existing-actual.png','030-lan-actual.png','onboarding-qq.png','030-model-unconfigured.png'])assert.ok((await fs.stat(path.join(root,'artifacts',file))).size>1000);
assert.equal((await read('artifacts/lifecycle-verification.json')).packageVersion,packageVersion);
const report = { at:new Date().toISOString(),packageVersion,filename:pack.filename,bytes:bytes.length,sha256:digest('sha256'),files:entries.length,identicalInstalledRuntimeFiles,
  provenance:{entries:provenance.length,forbiddenReferences:0,forbiddenSourceMatches,targetsExist:true,excludedDirectoryAbsent:true},
  evidence:{unit:unitCount,standaloneBrowser:11,onboardingBrowser:13,skinBrowser:6,skinWorld:9,skinClientVisible:true,managedWorld26_1:5,existingAndLan:7,portableQQ:7,...counts,legacyMinecraft:18,protectedFiles:Object.keys(protectedFiles).length},
  allEvidencePassed:true,evidenceScope:'automated checks and explicitly described isolated integrations',hostModel:'local-fixture',qq:'real pinned portable startup/restart/data scope; OneBot routing simulator; real account pending',lan:'real UDP/server/body; announcement fixture, actual game client pending',
  skin:'client-visible 1.21.8, pinned Paper 60 and SkinsRestorer 15.12.6; existing supervisor command channel',acceptanceComplete:false,pending:'Other Paper versions/migration/offline spike, new Windows user, actual game client LAN and real platform accounts',
};
await fs.writeFile(path.join(root,'artifacts/release/SHA256SUMS.txt'),`${report.sha256}  ${pack.filename}\n`);
await fs.writeFile(path.join(root,'artifacts/release-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
