export function isValidLicenseCode(code: string): boolean {
  const vip = /^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const trial = /^TRIAL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const ez = /^EZ-\d{9,15}$/;
  return vip.test(code) || trial.test(code) || ez.test(code);
}

export function isValidPhone(phone: string): boolean {
  return /^\d{9,15}$/.test(phone);
}

export function isValidMembershipType(type: string): boolean {
  return ["monthly", "weekly", "trial", "lifetime"].includes(type);
}

export function isValidDuration(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= 3650;
}
