function camelCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

function formattedTagsArray(tags) {
  return String(tags)
    .replace(/^\["|"\]$/g, '') // Remove leading [" and trailing "]
    .replace(/"\s*,\s*"/g, ',') // Remove quotes around comma and any surrounding whitespace
    .split(',')
    .map((tag) => tag.trim());
}

export {
  camelCase,
  toClassName,
  formattedTagsArray,
};
