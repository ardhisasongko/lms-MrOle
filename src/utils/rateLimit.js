export function createRateLimit(maxCalls, windowMs) {
  const calls = [];
  return function allow() {
    const now = Date.now();
    while (calls.length && calls[0] < now - windowMs) calls.shift();
    if (calls.length >= maxCalls) return false;
    calls.push(now);
    return true;
  };
}
