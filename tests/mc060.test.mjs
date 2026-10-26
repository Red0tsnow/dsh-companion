// Added with 0.6.0; execution intentionally deferred at the user's request.
import test from 'node:test';
import assert from 'node:assert/strict';
import {decideReflex} from '../lib/core/mc-reflex.js';
const position={x:0,y:64,z:0},now=10000;
test('a creeper within four blocks requests a seven-block retreat',()=>{const r=decideReflex({position,health:20,now,entities:[{name:'creeper',position:{x:4,y:64,z:0}}]});assert.equal(r.reason,'creeper');assert.deepEqual(r.target,{x:-7,y:64,z:0});});
test('low health with a hostile within ten blocks requests an eight-block retreat',()=>{const r=decideReflex({position,health:6,now,entities:[{name:'zombie',position:{x:0,y:64,z:10}}]});assert.equal(r.reason,'low_health');assert.deepEqual(r.target,{x:0,y:64,z:-8});});
test('low health without a hostile does not flee',()=>{assert.equal(decideReflex({position,health:2,now,entities:[{name:'cow',position}]}),null);});
test('full health near a non-creeper hostile does not flee',()=>{assert.equal(decideReflex({position,health:20,now,entities:[{name:'zombie',position}]}),null);});
test('survival decisions remain suppressed during the four-second cooldown',()=>{assert.equal(decideReflex({position,health:2,now,lastAt:7000,entities:[{name:'creeper',position}]}),null);});
