import { request } from './http.js';
import { presentPiece } from './presentPiece.js';

export async function getGalleryPiece(id) {
  const data = await request(`/api/gallery/${id}`);
  return presentPiece(data);
}
