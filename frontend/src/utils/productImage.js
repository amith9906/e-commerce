'use strict';
export const getProductCover = (images) => {
  if (Array.isArray(images) && images.length > 0) {
    const firstImage = images[0];
    if (firstImage) return firstImage;
  }
  return '/images/default-product.png';
};
