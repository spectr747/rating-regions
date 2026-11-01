// Шифрует dashboard.html и собирает index.html со страницей входа.
// Запуск: DASH_USER=... DASH_PASS=... node tools/encrypt.mjs путь/к/dashboard.html
// Логин и пароль в репозиторий не попадают: в index.html только соль, вектор и шифротекст.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
const [src = "dashboard.html", out = "index.html"] = process.argv.slice(2);
const user = process.env.DASH_USER, pass = process.env.DASH_PASS;
if (!user || !pass) { console.error("Задайте DASH_USER и DASH_PASS"); process.exit(1); }
const ITER = 310000;
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(user + "\n" + pass), "PBKDF2", false, ["deriveBits"]);
const raw = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, 256);
const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, readFileSync(src));
const b = u => Buffer.from(u).toString("base64");
const tpl = readFileSync(new URL("./login.tpl.html", import.meta.url), "utf8");
writeFileSync(out, tpl.replace("__SALT__", b(salt)).replace("__IV__", b(iv)).replace("__ITER__", String(ITER)).replace("__CT__", b(new Uint8Array(ct))));
console.log("Готово:", out);
