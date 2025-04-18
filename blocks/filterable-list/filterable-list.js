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
  SORT_ORDER: {
    ASC: 'asc',
    DESC: 'desc',
  },
  CLASSES: {},
  ATTRIBUTES: {
    FILTER_GROUP_ID: 'data-filter-group-id',
    FILTER_GROUP_OPERATION: 'data-filter-group-operation',
    FILTER_SORT_BY: 'data-filter-sort-by',
    FILTER_SORT_ORDER: 'data-filter-sort-order',
  },
};
const currentConfigs = {
  sort: {},
  filters: {},
};
let originalItems = [];
let currentItems = [];

const filterItems = items => {
  return items.filter(item => {
    for (const value of Object.values(currentConfigs.filters)) {
      let hasMatchingFilter = true;
      if (value.items.size !== 0) {
        if (value.operation === CONSTANTS.FILTER_OPERATION.OR) {
          hasMatchingFilter = item.implicitTags.some((tag) => value.items.has(tag.id));
        } else if (value.operation === CONSTANTS.FILTER_OPERATION.AND) {
          hasMatchingFilter = item.implicitTags.every((tag) => value.items.has(tag.id));
        }
      }
      if (hasMatchingFilter === false) {
        return false;
      }
    }
    return true;
  });
};

const sortItems = (items, sortBy, sortOrder) => {
  return items.sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];

    if (sortBy === 'publishdate') {
      const dateA = new Date(valueA);
      const dateB = new Date(valueB);
      return sortOrder === CONSTANTS.SORT_ORDER.ASC ? dateA - dateB : dateB - dateA;
    } if (sortBy === 'title') {
      const titleA = valueA.toLowerCase();
      const titleB = valueB.toLowerCase();
      return sortOrder === CONSTANTS.SORT_ORDER.ASC ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    }
    return 0;
  });
};

function renderItems(items, block) {
  const buildTag = (tag) => {
    return `<a href='${window.location.pathname}topics/${tag.name}'>${tag.title}</a>`;
  };
  block.innerHTML = '';
  items.forEach(({
    path, title, description, image, author, tags, publishdate,
  }) => {
    const filterCard = document.createElement('div');
    const filterCardTemplate = `<div class='filterable-list-item-picture'><picture/></div>
    <div class='filterable-list-item-content'><h3 class='filterable-list-item-title'>${title}</h3>
    <p class='filterable-list-item-desc'>${description}</p>
    <div class='filterable-list-item-authors'><b>Authors: </b><a href="${window.location.pathname}authors/${dashCase(author)}">${author}</a></div>
    <div class='filterable-list-item-tags'><b>Tags: </b>${tags.map((tag) => buildTag(tag)).join(', ')}</div>
    <div class='filterable-list-item-publishdate'><b>Publish Date: </b>${publishdate}</div>
    <a class='filterable-list-item-cta' href='${path}'>Learn More</a></div>`;

    filterCard.className = 'filterable-list-item';
    filterCard.innerHTML = filterCardTemplate;
    filterCard.querySelector('picture').replaceWith(createOptimizedPicture(image, title, false, [{
      width: '750',
      height: '750',
    }]));
    block.appendChild(filterCard);
  });
}

function handleFilterUpdate(block) {
  currentItems = filterItems(originalItems);
  currentItems = sortItems(currentItems, currentConfigs.sort.sortBy, currentConfigs.sort.sortOrder);
  renderItems(currentItems, block);
}

function handleSortUpdate(block) {
  currentItems = sortItems(currentItems, currentConfigs.sort.sortBy, currentConfigs.sort.sortOrder);
  renderItems(currentItems, block);
}

function handleSelect(event, block) {
  const { value } = event.target;
  const filterGroupElm = event.target.closest('.filter-checkbox');
  const groupId = filterGroupElm.getAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_ID);
  const groupOperation = filterGroupElm.getAttribute(CONSTANTS.ATTRIBUTES.FILTER_GROUP_OPERATION);

  if (!groupId) return;

  if (event.target.checked) {
    if (!currentConfigs.filters[`${groupId}`]) {
      currentConfigs.filters[`${groupId}`] = {
        id: groupId,
        operation: groupOperation,
        items: new Set(),
      };
    }
    currentConfigs.filters[`${groupId}`].items.add(value);
  } else {
    currentConfigs.filters[`${groupId}`]?.items.delete(value);
  }

  handleFilterUpdate(block);
}

// Function to build the sorting controls
const renderSortControls = (element, block) => {
  const sortContainer = document.createElement('div');
  sortContainer.classList.add('sort-controls');
  element.appendChild(sortContainer);

  const sortByContainer = document.createElement('div');
  const sortByLabel = document.createElement('label');
  sortByLabel.textContent = 'Sort: ';
  sortByContainer.appendChild(sortByLabel);

  const sortBySelect = document.createElement('select');
  sortBySelect.innerHTML = `
    <option value="title">Title</option>
    <option value="publishdate">Publish Date</option>
  `;
  sortByContainer.appendChild(sortBySelect);
  sortContainer.appendChild(sortByContainer);

  const sortOrderContainer = document.createElement('div');
  const sortOrderLabel = document.createElement('label');
  sortOrderLabel.textContent = 'Order: ';
  sortOrderContainer.appendChild(sortOrderLabel);

  const sortOrderSelect = document.createElement('select');
  sortOrderSelect.innerHTML = `
    <option value="asc">Ascending</option>
    <option value="desc">Descending</option>
  `;
  sortOrderContainer.appendChild(sortOrderSelect);
  sortContainer.appendChild(sortOrderContainer);

  [sortBySelect, sortOrderSelect].forEach((selector) => {
    selector.addEventListener('change', () => {
      const sortBy = sortBySelect.value;
      const sortOrder = sortOrderSelect.value;
      let isSortConfigChange = false;

      if (currentConfigs.sort.sortBy !== sortBy) {
        currentConfigs.sort.sortBy = sortBy;
        isSortConfigChange = true;
      }

      if (currentConfigs.sort.sortOrder !== sortOrder) {
        currentConfigs.sort.sortOrder = sortOrder;
        isSortConfigChange = true;
      }

      if (isSortConfigChange) {
        handleSortUpdate(block);
      }
    });

    return sortContainer;
  });
};

function decorateCheckboxFilter(filterLabel, filterArray, filteableListWrapper, block) {
  const checkboxFilter = document.createElement('div');
  const filterHtmlArray = filterArray.map((filter, index) => {
    if (filter !== '') {
      return `<div class='filter-item'><input type='checkbox' id='${filterLabel}-${index}' value='${filter.id}'/>
      <label for='${filterLabel}-${index}'>${filter.title}</label>
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
    filterItem.addEventListener('click', (e) => handleSelect(e, block));
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

  filteredData.forEach(data => {
    const tags = formattedTagsArray(data.tags);
    data.tags = tags.map(tag => {
      const tagName = dashCase(tag);
      return {
        id: `tags:${tagName}`,
        name: tagName,
        title: tag,
      };
    });
    data.implicitTags = [...data.tags];
  });

  originalItems = filteredData;
  currentItems = filteredData;

  const tagsId = new Map();
  const allTags = [];

  originalItems.forEach(({ tags }) => {
    tags.forEach((tag) => {
      if (!tagsId.has(tag.id)) {
        allTags.push(tag);
        tagsId.set(tag.id, true);
      }
    });
  });

  const authorsId = new Map();
  const allAuthors = [];

  originalItems.forEach(({ author }, index) => {
    const name = dashCase(author);
    const id = `authors:${name}`;
    const authorObj = {
      id: id,
      name: name,
      title: author,
    };
    originalItems[index].implicitTags.push(authorObj);
    if (!authorsId.has(id)) {
      allAuthors.push(authorObj);
      authorsId.set(id, true);
    }
  });

  const uniqueAuthors = allAuthors.sort((c, d) => c.title.toLowerCase().localeCompare(d.title.toLowerCase()));
  const uniqueTags = allTags.sort((e, f) => e.title.toLowerCase().localeCompare(f.title.toLowerCase()));

  const filteableListWrapper = block.parentElement;
  if (filteableListWrapper.classList.contains('filterable-list-wrapper')) {
    const filterableListFilters = document.createElement('div');
    filterableListFilters.className = 'filterable-list-filters';
    filteableListWrapper.appendChild(filterableListFilters);

    renderItems(filteredData, block);
    renderSortControls(filterableListFilters, block);
    decorateCheckboxFilter('authors', uniqueAuthors, filterableListFilters, block);
    decorateCheckboxFilter('tags', uniqueTags, filterableListFilters, block);
  }

  window.addEventListener(CONSTANTS.EVENTS.FILTER_UPDATED, (e) => handleFilterUpdate(e, block));
}
