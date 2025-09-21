/**
 * Gets a nested value from an object using a path string.
 * @param {object} obj The object to query.
 * @param {string} path The path to the value (e.g., 'a.b.c').
 * @param {any} defaultValue The value to return if the path is not found.
 * @returns {any} The found value or the default value.
 */
export function get(obj, path, defaultValue = undefined) {
  if (typeof path !== 'string') return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

/**
 * Sets a nested value in an object using a path string.
 * @param {object} obj The object to modify.
 * @param {string} path The path to the value (e.g., 'a.b.c').
 * @param {any} value The value to set.
 */
export function set(obj, path, value) {
  if (typeof path !== 'string') return;
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
