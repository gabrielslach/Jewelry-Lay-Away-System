export function pickImage(image, size) {
  if (!image) return undefined;
  const sized = size === 'thumb' ? image.thumb_url : image.web_url;
  return sized || image.url;
}
