import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { dashCase, formattedTagsArray } from '../../scripts/utils.js';

const CONSTANTS = {
  EVENTS: {
    FILTER_UPDATED: 'events.filterable-list.filters.updated',
  },
  FILTER_OPERATION: {
    OR: 'or',
    AND: 'and',
  },
};
const selectedfilters = {};

function handleSelect(event) {
  const {value} = event.target;
  const filterGroupElm = event.target.closest('.filter-checkbox');
  const groupId = filterGroupElm.getAttribute('data-filter-group-id');
  const groupOperation = filterGroupElm.getAttribute('data-filter-group-operation');

  if (!groupId) return;

  if (event.target.checked) {
    if (!selectedfilters[`${groupId}`]) {
      selectedfilters[`${groupId}`] = {
        id: groupId,
        operation: groupOperation,
        items: new Set(),
      };
    }
    selectedfilters[`${groupId}`].items.add(value);
  } else {
    selectedfilters[`${groupId}`]?.items.delete(value);
  }

  window.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.FILTER_UPDATED, {
    detail: {
      filters: selectedfilters,
    },
  }));
};

function handleFilterUpdate(event, block) {
  const updatedfilters = event.detail?.filters;
  const items = block.querySelectorAll('.filterable-list-item');

  items.forEach((item) => {
    const filterIds = JSON.parse(item.getAttribute('data-filter-ids'));
    let hasAllMatchingFilter = true;

    for (const key in updatedfilters) {
      let hasMatchingFilter = true;
      const filters = updatedfilters[`${key}`];
      if (filters.items.size !== 0) {
        if (filters.operation === CONSTANTS.FILTER_OPERATION.OR) {
          hasMatchingFilter = filterIds.some((filterId) => filters.items.has(filterId));
        } else if (filters.operation === CONSTANTS.FILTER_OPERATION.AND) {
          hasMatchingFilter = filterIds.every((filterId) => filters.items.has(filterId));
        }
      }
      if (hasMatchingFilter === false) {
        hasAllMatchingFilter = false;
        break;
      }
    };

    if (hasAllMatchingFilter) {
      item.classList.remove('hide');
    } else {
      item.classList.add('hide');
    }
  });
}

function decorateCheckboxFilter(filterLabel, filterArray, filteableListWrapper) {
  const checkboxFilter = document.createElement('div');
  const filterHtmlArray = filterArray.map((filter, index) => {
    if (filter !== '') {
      return `<div class='filter-item'><input type='checkbox' id='${filterLabel}-${index}' value='${filterLabel}:${dashCase(filter)}'/>
      <label for='${filterLabel}-${index}'>${filter}</label>
      </div>`;
    }
    return null;
  });
  const checkboxFilterTemplate = `<div class='filter-label capitalised'>${filterLabel}</div><div class='filter-container'>${filterHtmlArray.join('')}</div></div>`;
  checkboxFilter.className = 'filter-checkbox';
  checkboxFilter.setAttribute('data-filter-group-id', filterLabel);
  checkboxFilter.setAttribute('data-filter-group-operation', CONSTANTS.FILTER_OPERATION.OR);
  checkboxFilter.innerHTML = checkboxFilterTemplate;
  checkboxFilter.querySelectorAll('.filter-item [type=checkbox]').forEach((filterItem) => {
    filterItem.addEventListener('click', (e) => handleSelect(e));
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
    path, title, description, image, author, tags,
  }) => {
    const filterCard = document.createElement('a');
    const filterCardTemplate = `<div class='filterable-list-item-picture'><picture/></div>
    <div class='filterable-list-item-content'><h3 class='filterable-list-item-title'>${title}</h3>
    <p class='filterable-list-item-desc'>${description}</p></div>`;
    const tagsArr = formattedTagsArray(tags);
    const tagIdsArr = tagsArr.map((tag) => `tags:${dashCase(tag)}`);
    const filterIds = [`authors:${dashCase(author)}`, ...tagIdsArr];

    filterCard.className = 'filterable-list-item';
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
    filteableListFilters.className = 'filterable-list-filters';
    filteableListWrapper.appendChild(filteableListFilters);
    decorateCheckboxFilter('authors', authors, filteableListFilters);
    decorateCheckboxFilter('tags', uniqueTags, filteableListFilters);
  }

  window.addEventListener(CONSTANTS.EVENTS.FILTER_UPDATED, (e) => handleFilterUpdate(e, block));
}
