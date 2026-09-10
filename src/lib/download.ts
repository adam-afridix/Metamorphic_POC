/** Fetch an image URL and trigger a browser download. Pure client-side. */
export async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    // fall back to opening in a new tab
    window.open(url, "_blank");
  }
}
