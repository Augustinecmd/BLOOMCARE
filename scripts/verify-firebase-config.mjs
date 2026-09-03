import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const fail = (message) => {
  console.error(`Firebase configuration error: ${message}`);
  process.exit(1);
};

const rootProject = readJson(".firebaserc")?.projects?.default;
const appProject = readJson("BLOOMCARE-main/.firebaserc")?.projects?.default;
const deployment = readJson("firebase.json");
const appDeployment = readJson("BLOOMCARE-main/firebase.json");
const firebaseSource = readFileSync(resolve(root, "BLOOMCARE-main/firebase.js"), "utf8");
const sourceProject = firebaseSource.match(/projectId:\s*["']([^"']+)["']/)?.[1];

if (!rootProject || rootProject !== appProject || rootProject !== sourceProject) {
  fail("the root deploy target, app deploy target, and browser client must use the same Firebase project.");
}
if (deployment.hosting?.public !== "BLOOMCARE-main/dist") {
  fail("the root Hosting target must be BLOOMCARE-main/dist.");
}
if (deployment.firestore?.rules !== "firestore.rules" || deployment.firestore?.indexes !== "firestore.indexes.json") {
  fail("the root deploy config must include Firestore rules and indexes.");
}
if (appDeployment.firestore?.rules !== "../firestore.rules" || appDeployment.firestore?.indexes !== "../firestore.indexes.json") {
  fail("the app deploy config must include the shared Firestore rules and indexes.");
}

console.log(`Firebase configuration verified for ${rootProject}.`);
