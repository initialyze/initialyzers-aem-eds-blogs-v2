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
  CLASSES: {
    
  },
  ATTRIBUTES: {
    FILTER_GROUP_ID: 'data-filter-group-id',
    FILTER_GROUP_OPERATION: 'data-filter-group-operation',
    FILTER_SORT_BY: 'data-filter-sort-by',
    FILTER_SORT_ORDER: 'data-filter-sort-order',
  },
};
const activeFilters = {};

function handleSelect(event) {
  const { value } = event.target;
  const filterGroupElm = event.target.closest('.filter-checkbox');
  const groupId = filterGroupElm.getAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_ID);
  const groupOperation = filterGroupElm.getAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_OPERATION);

  if (!groupId) return;

  if (event.target.checked) {
    if (!activeFilters[`${groupId}`]) {
      activeFilters[`${groupId}`] = {
        id: groupId,
        operation: groupOperation,
        items: new Set(),
      };
    }
    activeFilters[`${groupId}`].items.add(value);
  } else {
    activeFilters[`${groupId}`]?.items.delete(value);
  }

  window.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.FILTER_UPDATED, {
    detail: {
      filters: activeFilters,
    },
  }));
}

function handleFilterUpdate(event, block) {
  const updatedfilters = event.detail?.filters;
  const items = block.querySelectorAll('.filterable-list-item');

  items.forEach((item) => {
    const filterIds = JSON.parse(item.getAttribute('data-filter-ids'));
    let hasAllMatchingFilter = true;
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const value of Object.values(updatedfilters)) {
      let hasMatchingFilter = true;
      if (value.items.size !== 0) {
        if (value.operation === CONSTANTS.FILTER_OPERATION.OR) {
          hasMatchingFilter = filterIds.some((filterId) => value.items.has(filterId));
        } else if (value.operation === CONSTANTS.FILTER_OPERATION.AND) {
          hasMatchingFilter = filterIds.every((filterId) => value.items.has(filterId));
        }
      }
      if (hasMatchingFilter === false) {
        hasAllMatchingFilter = false;
        break;
      }
    }

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
  checkboxFilter.setAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_ID, filterLabel);
  checkboxFilter.setAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_OPERATION, CONSTANTS.FILTER_OPERATION.OR);
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
    const tagsArr = formattedTagsArray(tags);
    const filterCardTemplate = `<div class='filterable-list-item-picture'><picture/></div>
    <div class='filterable-list-item-content'><h3 class='filterable-list-item-title'>${title}</h3>
    <p class='filterable-list-item-desc'>${description}</p><div class='filterable-list-item-authors'><b>Authors: </b>${author}</div><div class='filterable-list-item-tags'><b>Tags: </b>${tagsArr.join(', ')}</div></div>`;
    const tagIdsArr = tagsArr.map((tag) => `tags:${dashCase(tag)}`);
    const filterIds = [`authors:${dashCase(author)}`, ...tagIdsArr];

    filterCard.className = 'filterable-list-item';
    filterCard.href = path;
    filterCard.setAttribute('data-filter-ids', JSON.stringify(filterIds));
    filterCard.innerHTML = filterCardTemplate;
    filterCard.querySelector('picture').replaceWith(createOptimizedPicture(image, title, false, [{
      width: '750',
      height: '750',
    }]));
    block.appendChild(filterCard);
  });

  const filteableListWrapper = block.parentElement;
  if (filteableListWrapper.classList.contains('filterable-list-wrapper')) {
    const authors = [...new Set(filteredData.map((blog) => blog.author))]
      .sort((i, j) => i.toLowerCase().localeCompare(j.toLowerCase()));

    const tags = [...new Set(filteredData.reduce((allTags, blog) => {
      if (blog.tags) {
        const tagsArr = formattedTagsArray(blog.tags);
        return allTags.concat(tagsArr);
      }
      return allTags;
    }, []))].sort((m, n) => m.toLowerCase().localeCompare(n.toLowerCase()));

    const filterableListFilters = document.createElement('div');
    filterableListFilters.className = 'filterable-list-filters';
    filteableListWrapper.appendChild(filterableListFilters);
    decorateCheckboxFilter('authors', authors, filterableListFilters);
    decorateCheckboxFilter('tags', tags, filterableListFilters);
  }

  window.addEventListener(CONSTANTS.EVENTS.FILTER_UPDATED, (e) => handleFilterUpdate(e, block));
}
