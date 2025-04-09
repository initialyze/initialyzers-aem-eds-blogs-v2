import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { camelCase, dashedText, formattedTagsArray } from '../../scripts/utils.js';

const selectedfilters = new Set();

const EVENTS = {
  FILTER_UPDATED: 'events.filterable-list.filters.updated'
}

function handleSelect(e, filterVal, checked) {
  checked
    ? selectedfilters.add(filterVal)
    : selectedfilters.delete(filterVal);

  window.dispatchEvent(new CustomEvent(EVENTS.FILTER_UPDATED, {
    detail: {
      filters: selectedfilters
    }
  }));
}

function handleFilterUpdate(e, block) {
  const updatedfilters = e.detail?.filters;
  const items = block.querySelectorAll(".filter-card");

  items.forEach((item) => {
    const filterIds = JSON.parse(item.getAttribute("data-filter-ids"));
    if (updatedfilters.size === 0) {
      // If no filters are selected, show all items
      item.classList.remove("hide");
      return;
    }

    const hasMatchingFilter = filterIds.some((filterId) => updatedfilters.has(filterId));

    (hasMatchingFilter)
      ? item.classList.remove("hide")
      : item.classList.add("hide");
  });
}

function decorateCheckboxFilter(filterLabel, filterArray, filteableListWrapper) {
  const checkboxFilter = document.createElement('div');
  const filterHtmlArray = filterArray.map((filter, index) => {
    if (filter !== '') {
      return `<div class='filter-item'><input type='checkbox' id='${filterLabel}-${index}' value='${filterLabel}:${dashedText(filter)}'/>
      <label for='${filterLabel}-${index}'>${camelCase(filter)}</label>
      </div>`;
    }
    return null;
  });
  const checkboxFilterTemplate = `<div class='filter-label capitalised'>${filterLabel}</div><div class='filter-container'>${filterHtmlArray.join('')}</div></div>`;
  checkboxFilter.className = 'filter-checkbox';
  checkboxFilter.innerHTML = checkboxFilterTemplate;
  checkboxFilter.querySelectorAll('.filter-item [type=checkbox]').forEach((filterItem) => {
    filterItem.addEventListener('click', (e) => (handleSelect(e, filterItem.value, filterItem.checked)));
  });
  filteableListWrapper.appendChild(checkboxFilter);
}

export default async function decorate(block) {
  const a = block.querySelector('a');
  const filterDataURL = a.href;
  const dataReq = await fetch(filterDataURL);
  const { data } = await dataReq.json();
  const currentLocale = getMetadata('locale');
  const filteredData = data.filter((filterData) => filterData.path.includes(currentLocale));

  block.innerHTML = '';
  [...filteredData].forEach(({
    path, title, description, image, author, tags, locale
  }) => {
    const filterCard = document.createElement('a');
    const filterCardTemplate = `<div class='filter-card-picture'><picture/></div>
    <div class='filter-card-content'><h3 class='filter-card-title'>${title}</h3>
    <p class='filter-card-desc'>${description}</p></div>`;
    const tagsArr = formattedTagsArray(tags);
    const tagIdsArr = tagsArr.map((tag) => `tags:${dashedText(tag)}`);
    const filterIds = [`authors:${dashedText(author)}`, ...tagIdsArr];

    filterCard.className = 'filter-card';
    filterCard.href = path;
    filterCard.setAttribute('data-filter-ids', JSON.stringify(filterIds));
    filterCard.innerHTML = filterCardTemplate;
    filterCard.querySelector('picture').replaceWith(createOptimizedPicture(image, title, false, [{ width: '750', height: '750' }]));
    block.appendChild(filterCard);
  });

  const filteableListWrapper = block.parentElement;
  if (filteableListWrapper.classList.contains('filterable-list-wrapper')) {
    const authors = filteredData.map((blog) => blog.author);
    const tags = filteredData.reduce((allTags, blog) => {
      if (blog.tags) {
        const tagsArr = formattedTagsArray(blog.tags);
        return allTags.concat(tagsArr);
      }
      return allTags;
    }, []);
    const uniqueTags = [...new Set(tags)];

    const filteableListFilters = document.createElement('div');
    filteableListFilters.className = 'filters';
    filteableListWrapper.appendChild(filteableListFilters);
    decorateCheckboxFilter('authors', authors, filteableListFilters);
    decorateCheckboxFilter("tags", uniqueTags, filteableListFilters);

  }

  window.addEventListener(EVENTS.FILTER_UPDATED, (e) => handleFilterUpdate(e, block));
}
