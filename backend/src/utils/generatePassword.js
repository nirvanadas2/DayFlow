import crypto from "crypto";

// Excludes visually ambiguous characters (0/O, 1/I/l) since this is read off
// a screen and relayed to the employee by hand — no email delivery in v1.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// System-generated first password for a new employee account — see
// docs/dayflow-spec.md → Auth ("First password is system-generated; employee
// logs in and can change it").
export function generateTempPassword(length = 10) {
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += CHARS[bytes[i] % CHARS.length];
  }
  return password;
}
