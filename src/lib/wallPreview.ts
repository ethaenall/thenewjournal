// Use small derivatives only while their original published media still matches.
const previews: Record<string, string> = {
  "published/issue-01/images/preview-8bd3629b-ef08-4704-ac18-be480201b6a2-96ac4b5ead.png": "family-study.webp",
  "https://www.image2url.com/r2/default/videos/1793242393329-5f7802f0-5577-4ea9-94c2-502a4f0968e1.mp4": "please-understand.webp",
};
export function wallPreview(src?: string) {
  const base = import.meta.env.BASE_URL;
  const file = src && previews[src.startsWith(base) ? src.slice(base.length) : src];
  return file ? base + "gallery/" + file : undefined;
}
