// Login ID format (see docs/dayflow-spec.md → Auth):
//   [2-char company code][first 2 letters of first name][first 2 letters of last name]
//   [4-digit join year][4-digit serial number]
// e.g. "01OBOJ20260001"

export function generateCompanyCode(companyName) {
  const letters = companyName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 2) || "XX").padEnd(2, "X");
}

export function generateLoginId({ companyCode, name, joinYear, serial }) {
  const [firstName = "", lastName = ""] = name.trim().split(/\s+/);
  const nameCode = (
    firstName.slice(0, 2) + (lastName.slice(0, 2) || firstName.slice(2, 4))
  )
    .toUpperCase()
    .padEnd(4, "X");

  const year = String(joinYear).padStart(4, "0");
  const serialCode = String(serial).padStart(4, "0");

  return `${companyCode}${nameCode}${year}${serialCode}`;
}
