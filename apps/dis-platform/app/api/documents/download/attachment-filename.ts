export function attachmentFilename(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").slice(0, 110) || "document";
}
