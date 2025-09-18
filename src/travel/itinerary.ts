const imageComingSoon = "https://t4.ftcdn.net/jpg/07/91/22/59/360_F_791225926_MUEPuko0xgjKvWeAHGPdErQHY6X2ZJ1m.jpg";

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
};

const safeText = (val: any) => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
};

const getCardHtml = (item: any) => {
  const imageUrl = (item?.imageLinks && item.imageLinks.length > 0 ? item.imageLinks[0] : (item?.imagelinks && item.imagelinks[0])) || imageComingSoon;
  const ratingHtml = item?.rating ? `<div class="attraction-rating flex items-center space-x-1"><i class="fas fa-star text-yellow-400"></i><span>${item.rating}</span></div>` : '';
  const priceHtml = item?.price ? `<div class="attraction-icon bg-gray-900 text-white flex items-center space-x-1"><span class="currency-symbol">₹</span><span>${item.price}</span></div>` : '';
  const name = safeText(item?.name);
  const description = safeText(item?.description);

  return `
    <div class="travel-card flex-none snap-center">
      <img class="travel-card-image" src="${imageUrl}" alt="${name}">
      <div class="travel-card-info-top">
        ${priceHtml}
        ${ratingHtml}
      </div>
      <div class="travel-card-title text-white">
        <h4 class="text-xl font-bold">${name}</h4>
      </div>
      <div class="travel-card-overlay">
        <div class="travel-card-details text-gray-200">
          ${description ? `<p class="text-sm line-clamp-3">${description}</p>` : ''}
        </div>
      </div>
    </div>
  `;
};

const getActivityRowHtml = (activity: any) => {
  const imageUrl = (activity?.imageLinks && activity.imageLinks[0]) || (activity?.imagelinks && activity.imagelinks[0]) || imageComingSoon;
  const name = safeText(activity?.name);
  const description = safeText(activity?.description);
  const rating = safeText(activity?.rating);
  return `
    <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <img src="${imageUrl}" alt="${name}" class="w-12 h-12 rounded-md object-cover flex-shrink-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 truncate">${name}</h4>
          ${rating ? `<span class="ml-2 text-xs text-gray-700 flex items-center"><i class="fas fa-star text-yellow-400 mr-1"></i>${rating}</span>` : ''}
        </div>
        ${description ? `<p class="text-xs text-gray-500 line-clamp-2">${description}</p>` : ''}
      </div>
    </div>`;
};

const renderOverview = (data: any) => {
  const overview = data?.overview || {};
  const { title, summary, stats = {} } = overview as any;

  const statsBoxes: string[] = [];
  const addBox = (value: any, label: string) => {
    const v = safeText(value);
    if (v !== '') {
      statsBoxes.push(`
        <div class="flex-1 min-w-[120px] bg-gray-100 p-3 rounded-lg">
          <h5 class="text-xl font-bold">${v}</h5>
          <p class="text-xs text-gray-500">${label}</p>
        </div>
      `);
    }
  };

  if (typeof stats.durationInDays === 'number' && isFinite(stats.durationInDays)) {
    addBox(stats.durationInDays, 'Days');
  } else if (safeText(stats.durationInDays)) {
    addBox(safeText(stats.durationInDays), 'Days');
  }

  if (typeof stats.placesVisited === 'number' && isFinite(stats.placesVisited)) {
    addBox(stats.placesVisited, 'Places Visited');
  } else if (safeText(stats.placesVisited)) {
    addBox(safeText(stats.placesVisited), 'Places Visited');
  }

  const checkIn = formatDate(stats.checkInDate);
  if (checkIn) addBox(checkIn, 'Check-in');
  const checkOut = formatDate(stats.checkOutDate);
  if (checkOut) addBox(checkOut, 'Check-out');

  const dailyPlan = Array.isArray(data?.dailyPlan) ? data.dailyPlan : [];
  const dailyPlanList = dailyPlan.map((day: any) => {
    const count = (day.activities || []).length;
    const activitiesHtml = (day.activities || []).map(getActivityRowHtml).join('');
    const contentId = `qs-content-${safeText(day.day)}`;
    return `
      <div class="bg-base-200 rounded-lg border border-gray-200">
        <button type="button" class="qs-toggle w-full flex items-center justify-between text-left py-3 px-4" data-target="${contentId}">
          <span class="text-lg font-semibold">Day ${safeText(day.day)}: ${safeText(day.title)}</span>
          <span class="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">${count} activities <i class="fas fa-chevron-down ml-2 text-gray-400"></i></span>
        </button>
        <div id="${contentId}" class="qs-content hidden px-4 pb-4 space-y-2">
          ${activitiesHtml}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-800">${safeText(title)}</h2>
      ${safeText(summary) ? `<p class="text-sm text-gray-600 mb-4">${safeText(summary)}</p>` : ''}
      ${statsBoxes.length ? `<div class="flex flex-wrap gap-4 text-center mb-6">${statsBoxes.join('')}</div>` : ''}
      ${dailyPlan.length ? `
        <h3 class="text-xl font-bold mb-2 text-gray-800">Quick Daily Summary</h3>
        <div class="space-y-2">
          ${dailyPlanList}
        </div>` : ''}
    </div>
  `;
};

const renderDailyPlan = (dailyPlan: any[]) => {
  const days = Array.isArray(dailyPlan) ? dailyPlan : [];
  const dailyCards = days.map(day => `
    <div class="p-6 border-b border-gray-200 last:border-b-0">
      <h3 class="text-lg font-bold mb-2 text-gray-800">Day ${safeText(day.day)}: ${safeText(day.title)}</h3>
      <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
        ${(day.activities || []).map(getCardHtml).join('')}
      </div>
    </div>
  `).join('');
  return `<div class="p-4 space-y-4">${dailyCards}</div>`;
};

const renderExploreMore = (exploreMoreData: any[]) => {
  const cards = (exploreMoreData || []).map(getCardHtml).join('');
  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Explore More</h3>
      <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
        ${cards}
      </div>
    </div>
  `;
};

const backgroundImage = "https://t3.ftcdn.net/jpg/02/91/60/90/360_F_291609042_wBT8QL5iSzK3cCGyUVNy4PZSsyhejG8V.jpg";
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getFlightCardHtml = (flight: any) => {
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

const renderFlightsSection = (flightSuggestions: any) => {
  const cheapest = flightSuggestions?.cheapest?.[0];
  const shortestDuration = flightSuggestions?.shortestDuration?.[0];

  const flightCards: string[] = [];
  if (cheapest) flightCards.push(getFlightCardHtml(cheapest));
  if (shortestDuration) flightCards.push(getFlightCardHtml(shortestDuration));

  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Flight Suggestions</h3>
      <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
        ${flightCards.join('')}
      </div>
    </div>
  `;
};

const renderHotelsSection = (hotelRecommendations: any) => {
  const cheapestHotels = hotelRecommendations?.cheapest || [];
  const highestRatedHotels = hotelRecommendations?.highestRated || [];

  const hotelCard = (hotel: any) => {
    const imageUrl = hotel?.imageLinks && hotel.imageLinks.length > 0 ? hotel.imageLinks[0] : imageComingSoon;
    return `
      <div class="travel-card flex-none snap-center">
        <img class="travel-card-image" src="${imageUrl}" alt="${hotel?.name || ''}">
        <div class="travel-card-info-top">
          <div class="attraction-icon bg-gray-900 text-white flex items-center space-x-1">
            <span class="currency-symbol">₹</span><span>${hotel?.price ?? ''}</span>
          </div>
          <div class="attraction-rating flex items-center space-x-1">
            <i class="fas fa-star text-yellow-400"></i><span>${hotel?.rating || 'N/A'}</span>
          </div>
        </div>
        <div class="travel-card-title text-white">
          <h4 class="text-xl font-bold">${hotel?.name || ''}</h4>
        </div>
      </div>
    `;
  };

  return `
    <div class="p-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Hotel Recommendations</h3>
      <div class="space-y-6">
        <div>
          <h4 class="font-bold text-gray-700 mb-2">Cheapest Options</h4>
          <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
            ${cheapestHotels.map(hotelCard).join('')}
          </div>
        </div>
        <div>
          <h4 class="font-bold text-gray-700 mb-2">Highest Rated</h4>
          <div class="carousel flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
            ${highestRatedHotels.map(hotelCard).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
};

export const renderItinerary = (itineraryData: any, isMobile: boolean, chatMessages: HTMLElement) => {
  const sections: { id: string; title: string; content: string }[] = [
    { id: 'overview-page', title: 'Overview', content: renderOverview(itineraryData) },
    { id: 'daily-plan-page', title: 'Daily Plan', content: renderDailyPlan(itineraryData?.dailyPlan || []) },
    ...(itineraryData?.exploreMore ? [{ id: 'explore-more-page', title: 'Explore More', content: renderExploreMore(itineraryData.exploreMore) }] : []),
    ...(itineraryData?.hotelRecommendations ? [{ id: 'hotels-page', title: 'Hotels', content: renderHotelsSection(itineraryData.hotelRecommendations) }] : []),
    ...(itineraryData?.flightSuggestions ? [{ id: 'flights-page', title: 'Flights', content: renderFlightsSection(itineraryData.flightSuggestions) }] : [])
  ];

  const tabsHtml = sections.map((section, index) => `
    <button class="tab-button ${index === 0 ? 'tab-active' : ''}" data-target="${section.id}">
      ${section.title}
    </button>
  `).join('');

  const pagesHtml = sections.map((section, index) => `
    <div id="${section.id}" class="itinerary-page ${index === 0 ? 'page-active' : ''}">
      ${section.content}
    </div>
  `).join('');

  const mainHtml = `
    <div class="itinerary-tabs-container">
      <div class="tabs-header">
        ${tabsHtml}
      </div>
      <div class="tabs-content">
        ${pagesHtml}
      </div>
    </div>
  `;

  const bubble = document.createElement('div');
  bubble.className = `flex justify-start my-4 ${isMobile ? '' : 'w-full'}`;
  bubble.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-md w-full">${mainHtml}</div>`;
  chatMessages.appendChild(bubble);

  const tabButtons = bubble.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const button = btn as HTMLElement;
      const targetId = button.getAttribute('data-target');
      if (!targetId) return;
      tabButtons.forEach(b => b.classList.remove('tab-active'));
      const allPages = bubble.querySelectorAll('.itinerary-page');
      allPages.forEach(page => page.classList.remove('page-active'));
      button.classList.add('tab-active');
      const page = bubble.querySelector(`#${targetId}`);
      if (page) page.classList.add('page-active');
    });
  });

  const setupSummaryToggles = () => {
    const toggles = bubble.querySelectorAll('.qs-toggle');
    toggles.forEach(btn => {
      const button = btn as HTMLElement;
      const targetId = button.getAttribute('data-target');
      if (!targetId) return;
      const panel = bubble.querySelector(`#${targetId}`) as HTMLElement | null;
      if (!panel) return;
      button.addEventListener('click', () => {
        const isHidden = panel.classList.contains('hidden');
        if (isHidden) {
          panel.classList.remove('hidden');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = '0px';
          panel.classList.add('hidden');
        }
      });
    });
  };
  setupSummaryToggles();
};
