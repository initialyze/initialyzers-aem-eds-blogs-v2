# Steps for initial setup

## Update Document url

1. Update fstab.yaml file

```yaml
mountpoints:
  /: https://drive.google.com/drive/folders/folder_number
```

## Add support for richtext in Hero component

1. In file ```scripts/scripts.js```, update buildHeroBlock function.

```js
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  const paragraph = main.querySelector('p');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1, paragraph] }));
    main.prepend(section);
  }
}
```

2. Update hero css in ```blocks/hero/hero.css```

```css
.hero h1, .hero p {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  color: var(--background-color);
}
```

## Add new component by creating js and css file under ```/blocks```

1. Add css under ```blocks/filterable-list/filterable-list.css```

```css
.filter-card {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 2rem;
    overflow: hidden;
    margin-bottom: 1rem;
    color: var(--black, black) !important;
    border: .5px solid gray;
    padding: 1rem;
}

.filter-card.hide {
    display: none;
}

@media (width <= 900px) {
    .filter-card {
        flex-direction: column;
    }
}

.filter-card-picture img{
    aspect-ratio: 4 / 3;
    max-width: 350px;
    height: 100%;
}

.filterable-list-wrapper {
    display: flex;
    gap: 2rem;
}

.filter-checkbox .filter-label {
    text-transform: uppercase;
    font-weight: bold;
}

.filterable-list {
    width: 80%;
}

.filter-checkbox {
    width: 20%;
}
```

2. Add js under ```blocks/filterable-list/filterable-list.js```

```js
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
```
## Add support for assets

Create a new config file under ```tools/sidekick/config.json```

```json
{
	"id": "asset-library",
	"title": "My Assets",
	"environments": [
	  "edit"
	],
	"url": "https://experience.adobe.com/solutions/CQ-assets-selectors/static-assets/resources/franklin/asset-selector.html",
	"isPalette": true,
	"includePaths": [ "*" ],
	"passConfig": true,
	"paletteRect": "top: 50px; bottom: 10px; right: 10px; left: auto; width:400px; height: calc(100vh - 60px)"
}

```