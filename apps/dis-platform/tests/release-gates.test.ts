import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import { productionIdentityBlocked, trustedProductionUploader } from "../lib/release-gates";

const prod = { VERCEL_ENV: "production" };
const live = {
  ...prod,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_fixture",
  CLERK_SECRET_KEY: "sk_live_fixture",
};

test("production declines Clerk development credentials and mixed key pairs", () => {
  assert.equal(productionIdentityBlocked({ ...prod, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture" }), true);
  assert.equal(productionIdentityBlocked({ ...live, CLERK_SECRET_KEY: "sk_test_fixture" }), true);
  assert.equal(productionIdentityBlocked({ ...live, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture" }), true);
  assert.equal(productionIdentityBlocked(prod), true);
  assert.equal(productionIdentityBlocked(live), false);
});

test("preview identity rules do not block separate test configuration", () => {
  assert.equal(productionIdentityBlocked({ VERCEL_ENV: "preview", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture" }), false);
});

test("production document ingestion is denied unless user is explicitly trusted", () => {
  assert.equal(trustedProductionUploader("user_a", live), false);
  assert.equal(trustedProductionUploader("user_a", { ...live, DIS_TRUSTED_UPLOAD_SUBJECTS: "user_b" }), false);
  assert.equal(trustedProductionUploader("user_a", { ...live, DIS_TRUSTED_UPLOAD_SUBJECTS: "user_a, user_b" }), true);
  assert.equal(trustedProductionUploader("", { ...live, DIS_TRUSTED_UPLOAD_SUBJECTS: "user_a" }), false);
  assert.equal(trustedProductionUploader("user_a", { ...prod, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture", DIS_TRUSTED_UPLOAD_SUBJECTS: "user_a" }), false);
});

test("production public page does not initialize a Clerk browser SDK on test credentials",()=>{
 const layout=readFileSync("app/layout.tsx","utf8");
 assert.match(layout,/productionIdentityBlocked\(process\.env\)/);
 assert.match(layout,/publicOnly\?children:<ClerkProvider>/);
});
