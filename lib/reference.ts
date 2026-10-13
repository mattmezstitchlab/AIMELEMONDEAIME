import { customAlphabet } from "nanoid";

const alphabet = "0123456789";
const nano = customAlphabet(alphabet, 6);

export function generateCaseReference() {
  const year = new Date().getFullYear();
  return `DOS-${year}-${nano()}`;
}

export function generatePaymentReference() {
  const nano8 = customAlphabet(alphabet, 8);
  return `VRS-${nano8()}`;
}
