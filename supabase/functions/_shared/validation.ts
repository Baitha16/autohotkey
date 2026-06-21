export function isValidLicenseCode(code: string): boolean {
  const wlCode = /^WL-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
  const mlCode = /^ML-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
  const ylCode = /^YL-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
  const ltCode = /^LT-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
  const vip = /^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const trial = /^TRIAL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const ez = /^EZ-\d{9,15}(-[A-Z0-9]{4}-[A-Z0-9]{4})?$/;
  return vip.test(code) || trial.test(code) || wlCode.test(code) || mlCode.test(code) || ylCode.test(code) || ltCode.test(code) || ez.test(code);
}

export function isValidPhone(phone: string): boolean {
  return /^\d{9,15}$/.test(phone);
}

export function isValidMembershipType(type: string): boolean {
  return ["monthly", "weekly", "yearly", "trial", "lifetime"].includes(type);
}

export function isValidDuration(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= 3650;
}
