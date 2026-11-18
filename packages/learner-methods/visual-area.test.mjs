import test from "node:test";
import assert from "node:assert/strict";
import { areaPicturePlan } from "./visual-area.mjs";

test("Grade 4 rectangle diagram is correct, legible and descriptive", () => {
  const p=areaPicturePlan(23,14,true);
  assert.equal(p.total,322);
  assert.deepEqual(p.cells.map(c=>c.value),[200,30,80,12]);
  assert.ok(p.cells.every(c=>c.w>=45 && c.h>=45));
  assert.ok(p.accessibleDescription.includes("equals"));
  assert.ok(p.note.includes("Schematic"));
});

test("Independent diagram has no visible answers or answer leaks in accessible description", () => {
  const p=areaPicturePlan(23,14,false);
  assert.deepEqual(p.cells.map(c=>c.answerText),["?","?","?","?"]);
  assert.ok(!p.accessibleDescription.includes("200"));
  assert.ok(!p.accessibleDescription.includes("322"));
});

test("Geometry remains nonnegative across all two-digit factors", () => {
  for(let a=10;a<=99;a++){
    for(let b=10;b<=99;b++){
      const p=areaPicturePlan(a,b,true);
      assert.equal(p.cells.length,4);
      assert.equal(p.cells.reduce((v,c)=>v+c.value,0),a*b);
      assert.ok(p.cells.every(c=>c.w>0 && c.h>0));
    }
  }
});
