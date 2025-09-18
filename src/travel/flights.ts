const backgroundImage = "https://t3.ftcdn.net/jpg/02/91/60/90/360_F_291609042_wBT8QL5iSzK3cCGyUVNy4PZSsyhejG8V.jpg";
const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getCardHtml = (flight: any) => {
  const imageUrl = flight?.airline_logo ? flight.airline_logo : imageComingSoon;
  const departureTime = flight?.departuredatetime ? new Date(flight.departuredatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const arrivalTime = flight?.arrivaldatetime ? new Date(flight.arrivaldatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const durationFormatted = typeof flight?.totalduration === 'number' ? formatDuration(flight.totalduration) : '';
  const airlineLogo = imageUrl;
  const travelClass = flight?.travelclass || 'Economy';

  return `
    <div class="travel-card flex-none snap-center">
      <img class="travel-card-image" src="${backgroundImage}" alt="Flight Background">
      <div class="travel-card-info-top">
        <div class="flight-logo-container">
          <img src="${airlineLogo}" alt="${flight?.airline || ''} logo">
        </div>
        <div class="attraction-icon bg-gray-900 text-white flex items-center">
          <span class="currency-symbol">₹</span>
          <span>${flight?.price ?? ''}</span>
        </div>
        <div class="attraction-rating flex items-center space-x-1">
          <span>${travelClass}</span>
          <i class="fas fa-plane text-yellow-400"></i>
        </div>
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold mb-1 flex items-center space-x-2">
          <span>${flight?.airline || ''}</span>
        </h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          <div class="flex justify-between items-center text-sm font-medium text-gray-200">
            <span>${flight?.departureairportcode || ''}</span>
            <i class="fas fa-arrow-right"></i>
            <span>${flight?.arrivalairportcode || ''}</span>
          </div>
          <div class="flex justify-between text-xs text-gray-300">
            <span>${departureTime}</span>
            <span>${arrivalTime}</span>
          </div>
          <div class="text-xs text-gray-300 mt-2">${durationFormatted ? `Duration: ${durationFormatted}` : ''}</div>
        </div>
      </div>
    </div>
  `;
};

const renderFlightsInPlace = (filteredData: any[]) => {
  const flightsContainer = document.getElementById('flights-container');
  if (flightsContainer) {
    flightsContainer.innerHTML = filteredData.map(getCardHtml).join('');
  }
};

const renderFiltersAndSorts = (container: HTMLElement, data: any[]) => {
  const allAirlines = Array.from(new Set((data || []).map(flight => flight?.airline).filter(Boolean))).sort();
  // compute per-airline minimum price to show as starting price
  const airlineMinMap: Record<string, number> = {};
  allAirlines.forEach(al => {
    const prices = (data || []).filter(f => f?.airline === al).map(f => parseFloat((f?.price || '').toString().replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
    airlineMinMap[al] = prices.length ? Math.floor(Math.min(...prices)) : 0;
  });

  const airlineOptionsHtml = allAirlines.map(airline => `
    <label class="amenity-option flex items-center gap-2 text-gray-700">
      <input type="checkbox" name="airline-filter" value="${airline}" class="form-checkbox h-4 w-4 text-blue-600 rounded">
      <span class="flex-1">${airline}</span>
      <input type="number" class="airline-start-price ml-2 w-20 p-1 border rounded text-sm" data-airline="${airline}" value="${airlineMinMap[airline]}" min="0">
    </label>
  `).join('');

  // determine min/max price from data
  const numericPrices = (data || []).map(h => parseFloat((h?.price || '').toString().replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
  const globalMin = numericPrices.length ? Math.min(...numericPrices) : 0;
  const globalMax = numericPrices.length ? Math.max(...numericPrices) : 1000;
  const MIN_VAL = Math.floor(globalMin);
  const MAX_VAL = Math.ceil(globalMax);

  const filtersHtml = `
    <div class="p-4 space-y-4">
      <div>
        <h4 class="text-lg font-bold mb-2">Filter by Airline</h4>
        <div class="amenity-grid mt-1 max-h-32 overflow-y-auto" id="airline-filters">
          ${airlineOptionsHtml}
        </div>
      </div>
      <div>
        <h4 class="text-lg font-bold mb-2">Filter by Price</h4>
        <div class="slider-wrapper relative h-12">
          <div class="slider-track"></div>
          <div id="flight-slider-range" class="slider-range"></div>

          <input id="flight-min-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MIN_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="flight-min-thumb" class="slider-thumb" style="left:0%;"></div>
          <div id="flight-min-value-display" class="value-display">₹${MIN_VAL}</div>

          <input id="flight-max-slider" type="range" min="${MIN_VAL}" max="${MAX_VAL}" value="${MAX_VAL}" step="1" class="absolute w-full h-12 top-0 left-0 bg-transparent z-10 opacity-0 cursor-pointer">
          <div id="flight-max-thumb" class="slider-thumb" style="left:100%;"></div>
          <div id="flight-max-value-display" class="value-display">₹${MAX_VAL}</div>
        </div>
        <div class="text-center font-medium text-sm text-gray-700 mt-2"><p id="flight-current-range-text">₹${MIN_VAL} - ₹${MAX_VAL}</p></div>
      </div>
      <div>
        <h4 class="text-lg font-bold mb-2">Sort by:</h4>
        <div class="amenity-grid" id="flight-sorts">
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="price-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Price (Low to High)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="price-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Price (High to Low)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="duration-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Duration (Shortest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="duration-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Duration (Longest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="departure-asc" class="form-radio h-4 w-4 text-blue-600">
            <span>Departure (Earliest)</span>
          </label>
          <label class="amenity-option flex items-center gap-2 text-gray-700">
            <input type="radio" name="flight-sort" value="departure-desc" class="form-radio h-4 w-4 text-blue-600">
            <span>Departure (Latest)</span>
          </label>
        </div>
      </div>
      <div class="flex justify-end">
        <button id="apply-filters-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">Apply Filters</button>
      </div>
    </div>
  `;
  container.innerHTML = filtersHtml;
};

const attachEventListeners = (chatMessages: HTMLElement, flightData: any[]) => {
  const filterBtn = chatMessages.querySelector('.filter-btn') as HTMLElement | null;
  const modal = chatMessages.querySelector('.filter-modal') as HTMLElement | null;
  const closeBtn = chatMessages.querySelector('.close-modal') as HTMLElement | null;
  const applyBtn = chatMessages.querySelector('#apply-filters-btn') as HTMLElement | null;

  if (filterBtn && modal && closeBtn && applyBtn) {
    filterBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // wire up flight price slider
    try {
      const minSlider = modal.querySelector('#flight-min-slider') as HTMLInputElement | null;
      const maxSlider = modal.querySelector('#flight-max-slider') as HTMLInputElement | null;
      const rangeEl = modal.querySelector('#flight-slider-range') as HTMLElement | null;
      const minThumb = modal.querySelector('#flight-min-thumb') as HTMLElement | null;
      const maxThumb = modal.querySelector('#flight-max-thumb') as HTMLElement | null;
      const minValueDisplay = modal.querySelector('#flight-min-value-display') as HTMLElement | null;
      const maxValueDisplay = modal.querySelector('#flight-max-value-display') as HTMLElement | null;
      const currentRangeText = modal.querySelector('#flight-current-range-text') as HTMLElement | null;

      if (minSlider && maxSlider && rangeEl && minThumb && maxThumb && minValueDisplay && maxValueDisplay && currentRangeText) {
        const MIN = parseFloat(minSlider.min);
        const MAX = parseFloat(minSlider.max);
        const update = () => {
          const minVal = Math.min(parseFloat(minSlider.value), parseFloat(maxSlider.value));
          const maxVal = Math.max(parseFloat(minSlider.value), parseFloat(maxSlider.value));
          const minPercent = ((minVal - MIN) / (MAX - MIN)) * 100;
          const maxPercent = ((maxVal - MIN) / (MAX - MIN)) * 100;
          rangeEl.style.left = `${minPercent}%`;
          rangeEl.style.width = `${maxPercent - minPercent}%`;
          minThumb.style.left = `${minPercent}%`;
          maxThumb.style.left = `${maxPercent}%`;
          minValueDisplay.textContent = `₹${minVal}`;
          minValueDisplay.style.left = `${minPercent}%`;
          maxValueDisplay.textContent = `₹${maxVal}`;
          maxValueDisplay.style.left = `${maxPercent}%`;
          currentRangeText.textContent = `₹${minVal} - ₹${maxVal}`;
        };
        minSlider.addEventListener('input', update);
        maxSlider.addEventListener('input', update);
        update();
      }
    } catch (e) { console.warn('Failed to init flight slider', e); }

    applyBtn.addEventListener('click', () => {
      const selectedAirlines = Array.from(modal.querySelectorAll('#airline-filters input[type="checkbox"]:checked')).map((cb: any) => cb.value);
      const sortOption = (modal.querySelector('#flight-sorts input[type="radio"]:checked') as HTMLInputElement | null)?.value || 'none';

      let minPrice = 0, maxPrice = Infinity;
      const minEl = modal.querySelector('#flight-min-slider') as HTMLInputElement | null;
      const maxEl = modal.querySelector('#flight-max-slider') as HTMLInputElement | null;
      if (minEl) minPrice = parseFloat(minEl.value) || 0;
      if (maxEl) maxPrice = parseFloat(maxEl.value) || Infinity;

      // collect per-airline starting prices (if user edited them)
      const airlineStartInputs = Array.from(modal.querySelectorAll('.airline-start-price')) as HTMLInputElement[];
      const airlineStartMap: Record<string, number> = {};
      airlineStartInputs.forEach(inp => {
        const key = inp.getAttribute('data-airline');
        if (!key) return;
        const v = parseFloat(inp.value);
        if (!isNaN(v)) airlineStartMap[key] = v;
      });

      let filteredData = (flightData || []).filter((flight: any) => {
        const flightAirline = flight?.airline;
        const priceNum = parseFloat((flight?.price || '').toString().replace(/[^0-9.]/g, ''));
        const airlineMin = (flightAirline && airlineStartMap[flightAirline] != null) ? airlineStartMap[flightAirline] : minPrice;
        const inPriceRange = !isNaN(priceNum) ? (priceNum >= airlineMin && priceNum <= maxPrice) : false;
        const airlineMatch = selectedAirlines.length === 0 || (flightAirline && selectedAirlines.includes(flightAirline));
        return airlineMatch && inPriceRange;
      });

      if (sortOption === 'price-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sortOption === 'price-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sortOption === 'duration-asc') {
        filteredData.sort((a: any, b: any) => parseFloat(a.totalduration) - parseFloat(b.totalduration));
      } else if (sortOption === 'duration-desc') {
        filteredData.sort((a: any, b: any) => parseFloat(b.totalduration) - parseFloat(a.totalduration));
      } else if (sortOption === 'departure-asc') {
        filteredData.sort((a: any, b: any) => new Date(a.departuredatetime as any as string).getTime() - new Date(b.departuredatetime as any as string).getTime());
      } else if (sortOption === 'departure-desc') {
        filteredData.sort((a: any, b: any) => new Date(b.departuredatetime as any as string).getTime() - new Date(a.departuredatetime as any as string).getTime());
      }

      renderFlightsInPlace(filteredData);
      modal.classList.add('hidden');
    });
  }
};

export const renderFlights = (data: any[], isMobile: boolean, chatMessages: HTMLElement) => {
  const mainHtml = `
    <h3 class="text-xl font-bold mb-2 text-gray-800 flex items-center justify-between">
      Found Flights
      <button class="filter-btn text-gray-600 hover:text-gray-900 transition-colors">
        <i class="fas fa-filter"></i>
      </button>
    </h3>
    <div id="flights-container" class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
      ${(data || []).map(getCardHtml).join('')}
    </div>
    <div class="filter-modal absolute inset-0 modal-backdrop z-50 hidden">
      <div class="modal-panel w-full h-full p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full h-full overflow-hidden flex flex-col">
          <div class="modal-header sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white">
            <h3 class="text-lg font-semibold">Filters & Sorts</h3>
            <button class="close-modal text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
          </div>
          <div class="modal-body flex-1 overflow-y-auto px-4 py-4" id="filter-modal-content"></div>
        </div>
      </div>
    </div>
  `;

  const bubble = document.createElement('div');
  bubble.className = `flex justify-start my-4 ${isMobile ? '' : 'w-full'}`;
  bubble.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-md w-full relative">${mainHtml}</div>`;
  chatMessages.appendChild(bubble);

  const filterModalContent = bubble.querySelector('#filter-modal-content') as HTMLElement | null;
  if (filterModalContent) renderFiltersAndSorts(filterModalContent, data || []);
  attachEventListeners(bubble, data || []);
};
