import { request } from './http.js';
import { presentPiece } from './presentPiece.js';

export async function getGallery({ page = 1, pageSize = 12 } = {}) {
  const data = await request(`/api/gallery?page=${page}&page_size=${pageSize}`);
  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    page,
    pageSize,
    results: (data.results ?? []).map(presentPiece),
  };
}
