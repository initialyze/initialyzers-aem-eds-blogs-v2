function dashedText(text) {
  return text.toLowerCase().split(" ").join("-");
}


function formattedTagsArray(tags) {
  return String(tags)
    .replace(/^\["|"\]$/g, '') // Remove leading [" and trailing "]
    .replace(/"\s*,\s*"/g, ',') // Remove quotes around comma and any surrounding whitespace
    .split(',').map(tag => tag.trim())
}

export {
  dashedText,
  formattedTagsArray,
};