'use strict';

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const collectPostalCodes = (location) => {
  if (!location) return [];
  const codes = [];
  if (Array.isArray(location.postalCodes)) {
    codes.push(...location.postalCodes);
  }
  if (location.postalCode) {
    codes.push(location.postalCode);
  }
  return codes
    .map((code) => normalize(code))
    .filter((code) => code);
};

const matchesLocation = (address, location, validationMode = 'postal') => {
  console.log('matching address', normalize(address.city), normalize(address.state), normalize(address.country), normalize(address.postalCode));
console.log('against location', normalize(location.city), normalize(location.state), normalize(location.country), collectPostalCodes(location));

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

  const postalCodes = collectPostalCodes(location);
  if (validationMode === 'country' && location.country) {
    return true;
  }
  if (validationMode === 'state' && location.state) {
    return true;
  }
  if (validationMode === 'city' && location.city) {
    return true;
  }
  if (postalCodes.length > 0) {
    if (!address.postalCode) return false;
    const postal = normalize(address.postalCode);
    if (!postalCodes.includes(postal)) {
      return false;
    }
    return true;
  }

  return true;
};

const findRegionForAddress = (address, regions = [], validationMode = 'postal') => {
  if (!address || !regions.length) return null;

  return regions.find((region) => {
    const locations = Array.isArray(region.locations) ? region.locations : [];
    if (!locations.length) {
      return true;
    }
    console.log('locations', locations);
    return locations.some((loc) => matchesLocation(address, loc, validationMode));
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
