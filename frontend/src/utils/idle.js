const hasIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window;
const nativeRequestIdleCallback = hasIdleCallback ? window.requestIdleCallback.bind(window) : null;
const nativeCancelIdleCallback = hasIdleCallback ? window.cancelIdleCallback.bind(window) : null;

const fallbackRequestIdle = (callback, options = {}) => {
  const timeout = options.timeout || 200;
  return setTimeout(() => callback({
    didTimeout: true,
    timeRemaining: () => 0
  }), timeout);
};

const fallbackCancelIdle = (handle) => clearTimeout(handle);

export const scheduleIdleCallback = (callback, options) => {
  if (nativeRequestIdleCallback) {
    const handle = nativeRequestIdleCallback(callback, options);
    return () => nativeCancelIdleCallback?.(handle);
  }
  const handle = fallbackRequestIdle(callback, options);
  return () => fallbackCancelIdle(handle);
};
