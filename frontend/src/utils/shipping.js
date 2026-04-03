const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

export const determineShippingZone = (origin = {}, address = {}) => {
  const normalizedOrigin = {
    country: normalize(origin.country),
    state: normalize(origin.state),
    city: normalize(origin.city)
  };
  const normalizedAddress = {
    country: normalize(address.country),
    state: normalize(address.state),
    city: normalize(address.city)
  };

  if (!normalizedAddress.country) {
    return 'outOfState';
  }

  if (normalizedOrigin.country && normalizedOrigin.country !== normalizedAddress.country) {
    return 'international';
  }

  if (normalizedOrigin.state && normalizedOrigin.state === normalizedAddress.state) {
    if (normalizedOrigin.city && normalizedOrigin.city === normalizedAddress.city) {
      return 'sameCity';
    }
    return 'sameState';
  }

  return 'outOfState';
};

const getShippingRate = (shippingSettings = {}, zone) => {
  const rates = (shippingSettings.rates && typeof shippingSettings.rates === 'object')
    ? shippingSettings.rates
    : {};
  const zoneValue = Number(rates[zone] ?? NaN);
  if (!Number.isNaN(zoneValue) && zoneValue >= 0) {
    return zoneValue;
  }
  const fallback = Number(shippingSettings.flatShippingFee ?? 0);
  return Number.isNaN(fallback) ? 0 : Math.max(0, fallback);
};

export const calculateShippingFee = ({ shippingSettings = {}, address = {}, cartTotal = 0 }) => {
  const threshold = Math.max(0, Number(shippingSettings.freeShippingThreshold ?? 0));
  if (threshold > 0 && cartTotal > threshold) {
    return 0;
  }
  const zone = determineShippingZone(shippingSettings.origin || {}, address);
  return getShippingRate(shippingSettings, zone);
};

export const shippingZoneLabels = {
  sameCity: 'Same city',
  sameState: 'Same state',
  outOfState: 'Other state',
  international: 'International'
};

export const describeShippingZone = (zone) => shippingZoneLabels[zone] || 'Shipping';
