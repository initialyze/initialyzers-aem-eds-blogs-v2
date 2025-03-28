import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

function handleSelect(e, filterVal, checked) {
  // TODO filtering
  console.log(e, filterVal, checked);
}

function decorateCheckboxFilter(filterLabel, filterArray, filteableListWrapper) {
  const checkboxFilter = document.createElement('div');
  const filterHtmlArray = filterArray.map((filter, index) => {
    if (filter !== '') {
      return `<div class='filter-item'><input type='checkbox' id='${filterLabel}-${index}' value='${filter}'/>
      <label for='${filterLabel}-${index}'>${filter}</label>
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

export default async function decorate(elm) {
  const a = elm.querySelector('a');
  const filterDataURL = a.href;
  const dataReq = await fetch(filterDataURL);
  const { data } = await dataReq.json();
  const currentLocale = getMetadata('locale');
  const filteredData = data.filter((filterData) => filterData.path.includes(currentLocale));

  elm.innerHTML = '';
  [...filteredData].forEach(({
    path, title, description, image, author,
  }) => {
    const filterCard = document.createElement('a');
    const filterCardTemplate = `<div class='filter-card-picture'><picture/></div>
    <div class='filter-card-content'><h3 class='filter-card-title'>${title}</h3>
    <p class='filter-card-desc'>${description}</p></div>`;

    filterCard.className = 'filter-card';
    filterCard.href = path;
    filterCard.setAttribute('data-filter-by-author', author);
    filterCard.innerHTML = filterCardTemplate;
    filterCard.querySelector('picture').replaceWith(createOptimizedPicture(image, title, false, [{ width: '750', height: '750' }]));
    elm.appendChild(filterCard);
  });

  const filteableListWrapper = elm.parentElement;
  if (filteableListWrapper.classList.contains('filterable-list-wrapper')) {
    const authors = filteredData.map((blog) => blog.author);
    decorateCheckboxFilter('authors', authors, filteableListWrapper);
  }
}
