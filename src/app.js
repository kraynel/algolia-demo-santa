const { algoliasearch, instantsearch } = window;

const searchClient = algoliasearch(
  'latency',
  '059c79ddd276568e990286944276464a'
);

const renderRangeInput = (renderOptions, isFirstRender) => {
  const { start, range, refine, widgetParams } = renderOptions;
  const [min, max] = start;

  if (isFirstRender) {
    const form = document.createElement('form');

    form.addEventListener('submit', event => {
      event.preventDefault();

      const rawMinInputValue = new Date(
        event.target.elements.min.value
      ).getTime();
      const rawMaxInputValue = new Date(
        event.target.elements.max.value
      ).getTime();

      refine([
        Number.isFinite(rawMinInputValue) ? rawMinInputValue : undefined,
        Number.isFinite(rawMaxInputValue) ? rawMaxInputValue : undefined,
      ]);
    });

    widgetParams.container.appendChild(form);

    return;
  }

  widgetParams.container.querySelector('form').innerHTML = `
    <input
      type="date"
      name="min"
      placeholder="${range.min}"
      value="${
        Number.isFinite(min) ? new Date(min).toISOString().split('T')[0] : ''
      }"
    />
    <span>to</span>
    <input
      type="date"
      name="max"
      placeholder="${range.max}"
      value="${
        Number.isFinite(max) ? new Date(max).toISOString().split('T')[0] : ''
      }"
    />
    <input type="submit" hidden />
  `;
};

// Create the custom widget
const customRangeInput = instantsearch.connectors.connectRange(
  renderRangeInput
);

const search = instantsearch({
  indexName: 'concert_events_instantsearchjs',
  searchClient,
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    transformItems(items) {
      return items.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString(),
      }));
    },
    templates: {
      item: `
<article>
  <h1>{{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}</h1>
  <span>{{ location }}</span>
  <span>{{ formattedDate }}</span>
</article>
`,
    },
  }),
  instantsearch.widgets.configure({
    facets: ['*'],
    maxValuesPerFacet: 20,
  }),
  instantsearch.widgets.dynamicWidgets({
    container: '#dynamic-widgets',
    fallbackWidget({ container, attribute }) {
      return instantsearch.widgets.refinementList({
        container,
        attribute,
      });
    },
    widgets: [],
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
  instantsearch.widgets.clearRefinements({
    container: '#clear-refinements',
  }),

  instantsearch.widgets.refinementList({
    container: '#city-list',
    attribute: 'location',
    searchable: true,
  }),
  customRangeInput({
    container: document.querySelector('#date-input'),
    attribute: 'date',
  }),
]);

search.start();
