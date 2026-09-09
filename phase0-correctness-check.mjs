import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const adminJs = read("admin.js");
const appJs = read("app.js");
const acquisitionJs = read("acquisition.js");
const rules = read("firestore.rules");

const ok = (value, message) => {
  if (!value) throw new Error(message);
  console.log(`✓ ${message}`);
};

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed function ${name}`);
}

// Google Auth: SDK 12.15.0 intentionally uses popup-only auth after the 2026-09-03 migration.
ok(adminJs.includes('firebasejs/12.15.0/firebase-auth.js'), "admin auth stays on Firebase SDK 12.15.0");
ok(adminJs.includes('await signInWithPopup(auth, googleProvider)'), "Google login executes popup sign-in");
ok(!adminJs.includes("signInWithRedirect") && !adminJs.includes("getRedirectResult"), "Google login does not silently reintroduce the retired redirect lifecycle");
ok(adminJs.includes('error.code === "auth/popup-blocked"') && adminJs.includes('"auth/internal-error"'), "popup-blocked and internal-error have explicit handling");

// Registration contracts are intentionally characterized, not consolidated in Phase 0.
ok(appJs.includes("fullName.length < 3") && appJs.includes("const cooldown = 60 * 60 * 1000"), "main form keeps its 3-char / 60-minute baseline");
ok(appJs.includes('createSubmissionToken("main-assessment", fingerprint)') && appJs.includes('doc(db, "assessment_requests", submissionToken.id)'), "main form keeps retry-idempotent assessment document IDs");
ok(acquisitionJs.includes("fullName.length < 2") && acquisitionJs.includes("15 * 60 * 1000"), "acquisition form keeps its 2-char / 15-minute baseline");
ok(acquisitionJs.includes("if (!whatsapp && !email)") && acquisitionJs.includes('createSubmissionToken(`acquisition-${track}-${persona}`, fingerprint)'), "acquisition contact and idempotency scopes remain funnel-specific");
ok(rules.includes("data.fullName.size() >= 2") && rules.includes("hasUsableLeadContact(data)"), "Firestore remains the shared minimum schema, not a client-form copy");

// Request ordering: protect the current within-page descending sort while documenting the unresolved fetch-limit risk.
ok(adminJs.includes("return bd - ad;"), "admin keeps descending timestamp sort for the documents it fetched");
ok(adminJs.includes('collection(db, "assessment_requests"), limit(1000)') && !adminJs.includes('collection(db, "assessment_requests"), orderBy('), "known Phase-0 pagination limitation remains explicit until product/data migration is approved");

// Contact normalization: run the requested nine behavior cases against the actual pure helpers extracted from admin.js.
const normalizeRequestContactFields = Function(`return (${extractNamedFunction(adminJs, "normalizeRequestContactFields")});`)();
const requestWhatsappDigits = Function(`return (${extractNamedFunction(adminJs, "requestWhatsappDigits")});`)();
const cases = [
  ["phone only", { phone: "+20 101 111 2222" }, "201011112222"],
  ["WhatsApp only", { whatsapp: "+1 (555) 123-4567" }, "15551234567"],
  ["email only", { email: "student123456@example.com" }, ""],
  ["phone + email", { phone: "+20 1011112222", email: "a@example.com" }, "201011112222"],
  ["WhatsApp + email", { whatsapp: "+44 7700 900123", email: "a@example.com" }, "447700900123"],
  ["phone + WhatsApp", { phone: "+20 1011112222", whatsapp: "+1 5551234567" }, "15551234567"],
  ["malformed phone", { phone: "abc123456def" }, ""],
  ["empty contact fields", {}, ""],
  ["legacy email-only record", { email: "legacy987654@example.com", submissionDate: "legacy" }, ""]
];
for (const [name, input, expected] of cases) {
  const normalized = { ...input, ...normalizeRequestContactFields(input) };
  const actual = requestWhatsappDigits(normalized);
  ok(actual === expected, `contact case: ${name}`);
  if (input.email && !input.phone) ok(normalized.phone === "", `email does not populate phone: ${name}`);
}

console.log("PHASE 0 CORRECTNESS CHECK PASSED");
