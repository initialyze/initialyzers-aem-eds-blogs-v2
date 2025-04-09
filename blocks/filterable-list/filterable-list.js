import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { dashedText } from '../../scripts/utils.js';

const selectedfilters = new Set();

function handleSelect(e, filterVal, checked) {
  checked
    ? selectedfilters.add(filterVal)
    : selectedfilters.delete(filterVal);
  
  window.dispatchEvent(new CustomEvent("filters.updated", {
    detail: {
      filters: selectedfilters
    }
  }));
}

function decorateCheckboxFilter(filterLabel, filterArray, filteableListWrapper) {
  const checkboxFilter = document.createElement('div');
  const filterHtmlArray = filterArray.map((filter, index) => {
    if (filter !== '') {
      return `<div class='filter-item'><input type='checkbox' id='${filterLabel}-${index}' value='${filterLabel}:${dashedText(filter)}'/>
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
  console.log("locale", currentLocale);
  const filteredData = data.filter((filterData) => filterData.path.includes(currentLocale));

  elm.innerHTML = '';
  [...filteredData].forEach(({
    path, title, description, image, author, tags, locale
  }) => {
    const filterCard = document.createElement('a');
    const filterCardTemplate = `<div class='filter-card-picture'><picture/></div>
    <div class='filter-card-content'><h3 class='filter-card-title'>${title}</h3>
    <p class='filter-card-desc'>${description}</p></div>`;
    
    const cleanedTagsString = String(tags)
        .replace(/^\["|"\]$/g, '') // Remove leading [" and trailing "]
        .replace(/"\s*,\s*"/g, ','); // Remove quotes around comma and any surrounding whitespace

    const blogTags = cleanedTagsString.split(',').map(tag => tag.trim());

    const blogTagsArr = [];
    blogTags.forEach((tag) => {
      blogTagsArr.push(`tags:${dashedText(tag)}`);
    })
      
    const filterIds = [`authors:${dashedText(author)}`, ...blogTagsArr];

    filterCard.className = 'filter-card';
    filterCard.href = path;
    filterCard.setAttribute('data-filter-ids', JSON.stringify(filterIds));
    filterCard.innerHTML = filterCardTemplate;
    filterCard.querySelector('picture').replaceWith(createOptimizedPicture(image, title, false, [{ width: '750', height: '750' }]));
    elm.appendChild(filterCard);
  });

  const filteableListWrapper = elm.parentElement;
  if (filteableListWrapper.classList.contains('filterable-list-wrapper')) {
    const authors = filteredData.map((blog) => blog.author);
    decorateCheckboxFilter('authors', authors, filteableListWrapper);

    const tags = filteredData.reduce((allTags, blog) => {
      if (blog.tags) {
        const cleanedTagsString = String(blog.tags)
          .replace(/^\["|"\]$/g, '') // Remove leading [" and trailing "]
          .replace(/"\s*,\s*"/g, ','); // Remove quotes around comma and any surrounding whitespace
  
        const blogTags = cleanedTagsString.split(',').map(tag => tag.trim());
        return allTags.concat(blogTags);
      }
      return allTags;
    }, []);
    const uniqueTags = [...new Set(tags)];  
    decorateCheckboxFilter("tags", uniqueTags, filteableListWrapper);  
    
  }

  window.addEventListener("filters.updated", (e) => {
    const filters = e.detail?.filters;
    console.log("filters", filters);
    const items = elm.querySelectorAll(".filter-card");

    items.forEach((item) => {
      const filterIds = JSON.parse(item.getAttribute("data-filter-ids"));
      console.log("filters", filters)
      console.log("filterIds", filterIds)
      if (filters.size === 0) {
        item.classList.remove("hide");
      } else {
        let isHide = true;
        let i = 0;
        while (isHide && i < filterIds.length) {
          item.classList.add("hide");
          if (filters.has(filterIds[i++])) {
            item.classList.remove("hide");
            isHide = false;
          } 
        }
      }
    });
  });
}
