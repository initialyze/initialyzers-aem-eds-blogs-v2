function camelCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function dashCase(str) {
  return str.toLowerCase().split(' ').join('-');
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
  dashCase,
  formattedTagsArray,
};
