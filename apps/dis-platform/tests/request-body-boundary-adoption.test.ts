import test from "node:test";import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";import {join} from "node:path";
/** Source-regression check; runtime byte-limit behavior is tested separately. */
test("registered API routes do not reintroduce unbounded direct JSON or text parsing",()=>{
 const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.name==="route.ts"?[join(dir,e.name)]:[]);
 const offenders=walk("app/api").filter(path=>/\b(?:request|req)\.(?:json|text|arrayBuffer)\s*\(/.test(readFileSync(path,"utf8")));
 assert.deepEqual(offenders,[],"Request bodies must pass the bounded reader before parsing; this source check does not certify authentication or live deployment.");
});
