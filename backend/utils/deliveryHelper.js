'use strict';

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const matchesLocation = (address, location) => {
  if (!location || !address) return false;
  if (location.country && normalize(location.country) !== normalize(address.country)) {
    return false;
  }

  if (location.state && normalize(location.state) !== normalize(address.state)) {
    return false;
  }

  if (location.city && normalize(location.city) !== normalize(address.city)) {
    return false;
  }

  if (location.postalCodes && Array.isArray(location.postalCodes) && location.postalCodes.length > 0) {
    if (!address.postalCode) return false;
    const postal = normalize(address.postalCode);
    if (!location.postalCodes.some((code) => normalize(code) === postal)) {
      return false;
    }
  }

  return true;
};

const findRegionForAddress = (address, regions = []) => {
  if (!address || !regions.length) return null;

  return regions.find((region) => {
    const locations = Array.isArray(region.locations) ? region.locations : [];
    if (!locations.length) {
      return true;
    }
    return locations.some((loc) => matchesLocation(address, loc));
  }) || null;
};

const buildRestrictionMap = (restrictions = []) => {
  return restrictions.reduce((acc, item) => {
    if (item.productId) {
      acc[`product:${item.productId}`] = item;
    }
    if (item.category) {
      acc[`category:${item.category.toLowerCase()}`] = item;
    }
    return acc;
  }, {});
};

const getRestrictionForProduct = (map, productId, category) => {
  if (!map) return null;
  const productKey = `product:${productId}`;
  if (map[productKey]) return map[productKey];
  if (category) {
    const categoryKey = `category:${category.toLowerCase()}`;
    if (map[categoryKey]) return map[categoryKey];
  }
  return null;
};

module.exports = {
  findRegionForAddress,
  buildRestrictionMap,
  getRestrictionForProduct,
  matchesLocation,
};
