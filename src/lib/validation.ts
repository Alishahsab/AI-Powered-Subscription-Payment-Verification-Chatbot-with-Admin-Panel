import type { StoreConfig } from "./types";

export const limits = {
  nameMin: 2,
  nameMax: 40,
  pinLength: 6,
  passwordMin: 6,
  messageMax: 500,
  issueMin: 10,
  adminMessageMax: 1000,
  accountNumberMin: 8,
  accountNumberMax: 20,
  priceMax: 999_999,
  planNameMax: 20,
  shortTextMax: 40,
  longTextMax: 800,
  questionMax: 150,
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const LETTERS_ONLY = /^[A-Za-z]+( [A-Za-z]+)*$/;
const LETTERS_AND_DIGITS = /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/;

export function cleanLetters(value: string, max = limits.nameMax) {
  return value.replace(/[^A-Za-z ]/g, "").replace(/^\s+/, "").replace(/\s{2,}/g, " ").slice(0, max);
}

export function cleanLettersAndDigits(value: string, max = limits.planNameMax) {
  return value.replace(/[^A-Za-z0-9 ]/g, "").replace(/^\s+/, "").replace(/\s{2,}/g, " ").slice(0, max);
}

export function cleanDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function cleanAccountNumber(value: string) {
  const digits = cleanDigits(value, limits.accountNumberMax);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function cleanEmail(value: string) {
  return value.replace(/\s/g, "").slice(0, 80);
}

export function validateName(name: string, label = "Name") {
  const value = name.trim();
  if (value.length < limits.nameMin) return `${label} must be at least ${limits.nameMin} letters.`;
  if (value.length > limits.nameMax) return `${label} can be at most ${limits.nameMax} letters.`;
  if (!LETTERS_ONLY.test(value)) return `${label} can only contain letters and spaces.`;
  return null;
}

export function validateEmail(email: string) {
  if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePin(pin: string) {
  if (!/^\d{6}$/.test(pin)) return "Your PIN must be exactly 6 digits.";
  if (/^(\d)\1{5}$/.test(pin) || pin === "123456" || pin === "654321") return "This PIN is too easy to guess. Please choose another.";
  return null;
}

export function validateMessage(text: string, min = 1, max = limits.messageMax) {
  const value = text.trim();
  if (value.length < min) return min > 1 ? `Please write at least ${min} characters.` : "Please write a message.";
  if (value.length > max) return `Please keep it under ${max} characters.`;
  return null;
}

export function validateConfig(config: StoreConfig) {
  const errors: string[] = [];
  const { settings, plans, methods, faqs } = config;

  if (!LETTERS_ONLY.test(settings.storeName.trim()) || settings.storeName.trim().length > limits.shortTextMax) {
    errors.push("Store name can only contain letters and spaces.");
  }
  if (!settings.welcome.trim()) errors.push("Welcome message cannot be empty.");
  if (!settings.howItWorks.trim()) errors.push("\"How does it work\" answer cannot be empty.");
  if (!settings.codeInstructions.trim()) errors.push("Code instructions cannot be empty.");

  const longTexts = [settings.welcome, settings.howItWorks, settings.codeInstructions, ...Object.values(settings.statusMessages)];
  if (longTexts.some((text) => text.length > limits.longTextMax)) errors.push(`Messages can be at most ${limits.longTextMax} characters.`);
  if (Object.values(settings.statusMessages).some((text) => !text.trim())) errors.push("Status messages cannot be empty.");

  const { bankName, accountTitle, accountNumber } = settings.bank;
  if (validateName(bankName, "Bank name")) errors.push("Bank name can only contain letters and spaces.");
  if (validateName(accountTitle, "Account title")) errors.push("Account title can only contain letters and spaces.");
  const digits = accountNumber.replace(/\s/g, "");
  if (digits.length < limits.accountNumberMin || digits.length > limits.accountNumberMax) {
    errors.push(`Account number must be ${limits.accountNumberMin} to ${limits.accountNumberMax} digits.`);
  }

  for (const plan of plans) {
    if (!LETTERS_AND_DIGITS.test(plan.name.trim())) errors.push(`Plan name "${plan.name || "empty"}" can only contain letters and numbers.`);
    if (plan.price < 1 || plan.price > limits.priceMax) errors.push(`Price for ${plan.name || "a plan"} must be between 1 and ${limits.priceMax.toLocaleString()}.`);
  }
  if (!plans.some((plan) => plan.active)) errors.push("At least one plan must be visible.");

  for (const method of methods) {
    if (!LETTERS_ONLY.test(method.name.trim())) errors.push(`Payment method "${method.name || "empty"}" can only contain letters and spaces.`);
    if (method.steps.length > limits.longTextMax) errors.push(`Steps for ${method.name} are too long.`);
  }
  if (!methods.some((method) => method.active)) errors.push("At least one payment method must be shown.");

  for (const faq of faqs) {
    if (faq.question.length > limits.questionMax) errors.push(`FAQ question is too long: "${faq.question.slice(0, 30)}…"`);
    if (faq.answer.length > limits.longTextMax) errors.push(`FAQ answer is too long for "${faq.question.slice(0, 30)}…"`);
  }

  return errors;
}
