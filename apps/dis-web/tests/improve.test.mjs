import test from "node:test";import assert from "node:assert/strict";import {plan} from "../api/improve.js";
test("quick scales investigation",()=>{const p=plan({question:"Improve the platform",depth:"Quick"});assert.equal(p.dimensions.length,2);assert.equal(p.gates.length,5)});
test("research covers all enterprise dimensions",()=>{const p=plan({question:"Improve the company",depth:"Research"});assert.equal(p.dimensions.length,6)});
test("no invented evidence or completion",()=>{const p=plan({question:"Improve the platform"},[{title:"A",url:"https://example.org"}]);assert.equal(p.evidence[0].claimStatus,"NOT APPRAISED");assert.ok(p.gates.every(x=>!x.pass));assert.match(p.conclusion,/No validated solution/)});
test("missing questions include stakeholder and falsification",()=>{const p=plan({question:"Improve the platform"});assert.ok(p.missing.some(x=>x.includes("not been considered")));assert.ok(p.missing.some(x=>x.includes("falsify")))});
