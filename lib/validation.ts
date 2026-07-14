import { z } from "zod";

export const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL"),
});

export const tagNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(40);
