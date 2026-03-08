import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env";

const algorithm = "aes-256-gcm";
const prefix = "enc:v1";

export const createSecretCodec = (secretEncryptionKey: string) => {
  const deriveKey = (): Buffer => createHash("sha256").update(secretEncryptionKey).digest();

  const encryptSecret = (plaintext: string): string => {
    const value = plaintext.trim();
    if (!value) {
      return value;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv(algorithm, deriveKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [prefix, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
  };

  const decryptSecret = (value: string): string => {
    const input = value.trim();
    if (!input || !input.startsWith(`${prefix}:`)) {
      return input;
    }

    const [, , ivBase64, tagBase64, encryptedBase64] = input.split(":");
    const decipher = createDecipheriv(algorithm, deriveKey(), Buffer.from(ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, "base64")),
      decipher.final()
    ]);
    return decrypted.toString("utf8");
  };

  return {
    encryptSecret,
    decryptSecret
  };
};

const getRuntimeCodec = () => createSecretCodec(env.SECRET_ENCRYPTION_KEY);

export const encryptSecret = (plaintext: string): string => getRuntimeCodec().encryptSecret(plaintext);

export const decryptSecret = (value: string): string => getRuntimeCodec().decryptSecret(value);
