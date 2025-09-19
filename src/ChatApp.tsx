import React, { useEffect } from 'react';
import './index.css';
import { renderFlights } from './travel/flights';
import { renderHotels } from './travel/hotels';
import { renderAttractions } from './travel/attractions';
import { renderItinerary } from './travel/itinerary';

const ChatApp: React.FC = () => {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container') as HTMLElement | null;
    const introSection = document.getElementById('intro-section') as HTMLElement | null;
    const toggleButton = document.getElementById('toggle-view') as HTMLElement | null;
    const chatMessages = document.getElementById('chat-messages') as HTMLElement | null;
    const chatForm = document.getElementById('chat-form') as HTMLFormElement | null;
    const userPromptInput = document.getElementById('user-prompt') as HTMLInputElement | null;
    const overflowButton = document.getElementById('overflow-button') as HTMLElement | null;
    const overflowMenu = document.getElementById('overflow-menu') as HTMLElement | null;
    const restartBtn = document.getElementById('restart-convo') as HTMLElement | null;
    const downloadPdfBtn = document.getElementById('download-pdf') as HTMLElement | null;

    let isDesktopView = false;
    let sessionId = localStorage.getItem('tapasSessionId');
    if (!sessionId) {
      sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tapasSessionId', sessionId);
    }

    const showModal = (text: string) => {
      const mt = document.getElementById('modal-text');
      const modal = document.getElementById('modal');
      if (mt && modal) {
        mt.innerText = text;
        modal.classList.remove('hidden');
      }
    };

    const addWelcomeMessage = () => {
      if (!chatMessages) return;
      // Avoid adding duplicate welcome message if static or previously added
      const existing = chatMessages.querySelector('.welcome-message') || Array.from(chatMessages.querySelectorAll('div')).find(d => d.textContent && d.textContent.trim().includes('Hello! How can I help you plan your next trip'));
      if (existing) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-start welcome-message';
      wrapper.innerHTML = `
        <div class="bg-white p-3 rounded-2xl shadow-sm max-w-[80%]">
          <p class="text-gray-800 text-sm">Hello! How can I help you plan your next trip today?</p>
        </div>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const restartConversation = () => {
      if (!chatMessages) return;
      chatMessages.innerHTML = '';
      sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('tapasSessionId', sessionId);
      addWelcomeMessage();
      if (userPromptInput) userPromptInput.value = '';
    };

    const downloadChatPdf = async () => {
      try {
        const w: any = window as any;
        if (!w.html2pdf) throw new Error('html2pdf not available');
        if (!chatMessages) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'print-transcript-wrapper';
        wrapper.style.background = '#ffffff';
        wrapper.style.padding = '24pt';
        wrapper.style.maxWidth = '800px';
        wrapper.style.margin = '0 auto';
        wrapper.innerHTML = `
          <style>
            .pt-header{display:flex;align-items:center;gap:12pt;margin-bottom:12pt}
            .pt-title{font-size:16pt;font-weight:700;color:#111827;margin:0}
            .pt-meta{font-size:9pt;color:#6b7280;margin:2pt 0 0}
            .pt-logo{height:36pt;width:auto}
            .pt-bubble{margin:10pt 0;padding:10pt 12pt;border-radius:12pt;box-shadow:0 1px 2px rgba(0,0,0,.05)}
            .pt-bot{background:#ffffff;border:1px solid #e5e7eb}
            .pt-user{background:#3b82f6;color:#ffffff}
            .pt-bubble img{max-width:100%;border-radius:8pt}
          </style>
          <div class="pt-header">
            <img class="pt-logo" src="https://cdn.builder.io/api/v1/image/assets%2F82c0001c5b3640cb80e6ddfae3607779%2Fc6120727ebef4118a2235d13cbf9dfcb?format=webp&width=400" crossorigin="anonymous"/>
            <div>
              <h1 class="pt-title">AI⚡Hutech – Chat Transcript</h1>
              <p class="pt-meta">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>`;

        const content = document.createElement('div');
        content.className = 'pt-content';

        Array.from(chatMessages.children).forEach((row) => {
          const firstDiv = row.querySelector('div');
          if (!firstDiv) return;
          const isUser = row.classList.contains('justify-end');
          const clone = firstDiv.cloneNode(true) as HTMLElement;
          clone.style.overflow = 'visible';
          clone.querySelectorAll('*').forEach(el => { (el as HTMLElement).style.overflow = 'visible'; });
          clone.querySelectorAll('img').forEach(img => { img.setAttribute('crossorigin','anonymous'); (img as HTMLImageElement).style.maxWidth = '100%'; });

          const wrap = document.createElement('div');
          wrap.className = `pt-bubble ${isUser ? 'pt-user' : 'pt-bot'}`;
          wrap.appendChild(clone);
          content.appendChild(wrap);
        });

        wrapper.appendChild(content);
        document.body.appendChild(wrapper);

        const opt = {
          margin: [20, 15, 20, 15],
          filename: 'chat-transcript.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };

        await w.html2pdf().from(wrapper).set(opt).save();
        document.body.removeChild(wrapper);
      } catch (e) {
        console.error('PDF generation failed', e);
        alert('Unable to generate PDF automatically in this browser.');
      }
    };

    const markdownToHtml = (markdown: string) => {
      const w: any = window as any;
      if (w.marked && typeof w.marked.parse === 'function') {
        return w.marked.parse(markdown);
      }
      return markdown;
    };

    const createMessageBubble = (text: string, isUser: boolean) => {
      if (!chatMessages) return;
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
      const messageDiv = document.createElement('div');
      if (isUser) {
        messageDiv.className = 'bg-blue-500 text-white p-3 rounded-2xl shadow-md max-w-[80%]';
        messageDiv.textContent = text;
      } else {
        messageDiv.className = 'bg-white text-gray-800 p-3 rounded-2xl shadow-md max-w-[80%] markdown-body';
        messageDiv.innerHTML = markdownToHtml(text);
      }
      bubbleDiv.appendChild(messageDiv);
      chatMessages.appendChild(bubbleDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const createLoadingIndicator = () => {
      if (!chatMessages) return null as unknown as HTMLElement;
      const loaderDiv = document.createElement('div');
      loaderDiv.className = 'chat-loader-row flex items-start';
      // reserve space for the gif animation so layout doesn't jump
      loaderDiv.innerHTML = `
        <div class="chat-loader-wrapper">
          <img class="chat-loader-image" src="https://cdn.builder.io/o/assets%2F6f93519000c74ba084c4626024227ad2%2Ff83c3507982c402ca39ea41163f1b897?alt=media&token=5afa3666-cc67-4932-aebc-b625d1beb44b&apiKey=6f93519000c74ba084c4626024227ad2" alt="loading" />
        </div>
      `;
      chatMessages.appendChild(loaderDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      return loaderDiv;
    };

    const processMessage = (jsonResponse: string) => {
      const data = JSON.parse(jsonResponse);
      const placeholderRegex = /\[(flightData|hotelData|attractionsData|itineraryData)\]/g;
      const text = typeof data.text === 'string' ? data.text : '';
      const cleanedText = text ? text.replace(placeholderRegex, '').trim() : '';
      if (cleanedText) createMessageBubble(cleanedText, false);
      if ((data.dbData || data.itineraryData) && chatMessages) {
        if (text.includes('[flightData]') && data.dbData) {
          renderFlights(data.dbData, !isDesktopView, chatMessages);
        } else if (text.includes('[hotelData]') && data.dbData) {
          renderHotels(data.dbData, !isDesktopView, chatMessages);
        } else if (text.includes('[attractionsData]') && data.dbData) {
          renderAttractions(data.dbData, !isDesktopView, chatMessages);
        } else if (data.itineraryData) {
          renderItinerary(data.itineraryData, !isDesktopView, chatMessages);
        }
      }
    };

    const closeOverflow = () => {
      if (overflowMenu) overflowMenu.classList.add('hidden');
      if (overflowButton) overflowButton.setAttribute('aria-expanded', 'false');
    };

    if (overflowButton && overflowMenu) {
      overflowButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = overflowMenu.classList.contains('hidden');
        if (isHidden) {
          overflowMenu.classList.remove('hidden');
          overflowButton.setAttribute('aria-expanded', 'true');
        } else {
          closeOverflow();
        }
      });
      const docClick = (e: any) => {
        if (!overflowMenu.contains(e.target) && e.target !== overflowButton) closeOverflow();
      };
      document.addEventListener('click', docClick);
    }

    if (restartBtn) restartBtn.addEventListener('click', () => { closeOverflow(); restartConversation(); });
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => { closeOverflow(); downloadChatPdf(); });

    if (chatForm && userPromptInput && chatMessages) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userPrompt = userPromptInput.value.trim();
        if (userPrompt === '') return;
        createMessageBubble(userPrompt, true);
        userPromptInput.value = '';
        const loader = createLoadingIndicator();
        try {
          const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userPrompt })
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const responseData = await response.json();
          loader.remove();
          processMessage(JSON.stringify(responseData));
        } catch (error) {
          console.error('API call failed:', error);
          loader.remove();
          createMessageBubble('Oops! Something went wrong. Please try again later.', false);
        }
      });

      // Delegate clicks inside chat messages to handle external links reliably
      const delegatedClickHandler = (evt: MouseEvent) => {
        try {
          const target = evt.target as HTMLElement | null;
          if (!target) return;
          // Find nearest anchor element from the click target
          const anchor = (target.closest && (target.closest('a') as HTMLAnchorElement | null)) || null;
          if (!anchor || !anchor.href) return;

          // Only handle external links (absolute URLs) or links inside attractions/hotels containers
          const href = anchor.getAttribute('href') || '';
          const isExternal = /^https?:\/\//i.test(href);
          const inAttractions = !!anchor.closest('#attractions-container');
          const inHotels = !!anchor.closest('#hotels-container');

          if (isExternal || inAttractions || inHotels) {
            evt.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        } catch (err) {
          // ignore
        }
      };
      chatMessages.addEventListener('click', delegatedClickHandler);
    }

    if (toggleButton && chatContainer && introSection && chatMessages) {
      toggleButton.addEventListener('click', () => {
        if (window.innerWidth < 768 && !isDesktopView) {
          showModal('The desktop view is available on larger screens.');
          return;
        }
        isDesktopView = !isDesktopView;
        if (isDesktopView) {
          chatContainer.classList.add('desktop-view', 'chat-centered');
          chatContainer.classList.remove('phone-view', 'chat-right-align');
          introSection.classList.add('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-mobile-alt text-sm"></i>';
        } else {
          chatContainer.classList.remove('desktop-view', 'chat-centered');
          chatContainer.classList.add('phone-view', 'chat-right-align');
          introSection.classList.remove('hide-intro');
          toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
        }
        const messages = Array.from(chatMessages.children);
        chatMessages.innerHTML = '';
        messages.forEach(msg => chatMessages.appendChild(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }

    const onLoad = () => {
      if (!chatContainer || !introSection || !toggleButton) return;
      if (window.innerWidth >= 768) {
        chatContainer.classList.add('transition-width');
        introSection.classList.add('transition-all');
        isDesktopView = false;
        chatContainer.classList.add('phone-view', 'chat-right-align');
        chatContainer.classList.remove('desktop-view', 'chat-centered');
        introSection.classList.remove('hide-intro');
        toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
      } else {
        isDesktopView = false;
        chatContainer.classList.add('phone-view');
        introSection.classList.add('hide-intro');
        toggleButton.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
      }

      const createInlineFlightForm = () => {
        if (!chatMessages) return;
        const existing = chatMessages.querySelector('.inline-flight-form-row');
        if (existing) existing.remove();
        const uid = String(Date.now());
        const row = document.createElement('div');
        row.className = 'inline-flight-form-row flex items-start w-full';
        row.innerHTML = `
          <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-[90%] w-full border border-gray-200">
            <h3 class="text-2xl font-bold mb-4 text-center text-gray-800">Find Your Flight</h3>
            <form class="flight-form space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input type="text" id="source-${uid}" name="source" value="JFK" placeholder="Source" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                  <div id="source-suggestions-${uid}" class="autocomplete-list hidden"></div>
                  <div id="source-popular-${uid}" class="popular-cities-list hidden"></div>
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input type="text" id="destination-${uid}" name="destination" value="LAX" placeholder="Destination" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                  <div id="destination-suggestions-${uid}" class="autocomplete-list hidden"></div>
                  <div id="destination-popular-${uid}" class="popular-cities-list hidden"></div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                  <div id="date-picker-input-${uid}" class="mt-1 flex items-center justify-between cursor-pointer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    <span id="display-date-${uid}" class="text-gray-700"></span>
                    <i class="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input type="hidden" id="departureDate-${uid}" name="departureDate" />

                  <div id="date-picker-modal-${uid}" class="absolute z-10 mt-2 left-0 right-0 p-4 bg-yellow-400 rounded-2xl shadow-lg transition-all duration-300 scale-95 opacity-0 pointer-events-none origin-top">
                    <div class="flex justify-center mb-2"><div class="h-1 w-10 bg-yellow-600 rounded-full"></div></div>
                    <div id="calendar-view-${uid}" class="transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto">
                      <div class="flex justify-between items-center text-sm font-medium text-yellow-800 mb-2">
                        <span class="w-1/3 text-center">Day</span>
                        <span class="w-1/3 text-center">Month</span>
                        <span class="w-1/3 text-center">Year</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 h-48 overflow-hidden relative">
                        <div id="selection-highlight-${uid}" class="absolute h-10 w-full bg-yellow-600 rounded-full transition-transform duration-200 ease-in-out pointer-events-none z-0"></div>
                        <ul id="day-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="month-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                        <ul id="year-list-${uid}" class="calendar-scroller text-center space-y-2 text-yellow-800 text-lg overflow-y-scroll snap-y snap-mandatory py-10 z-10"></ul>
                      </div>
                    </div>
                    <div id="final-date-view-${uid}" class="absolute inset-0 flex flex-col justify-center items-center text-center opacity-0 pointer-events-none transition-opacity duration-300">
                      <p class="text-4xl font-bold text-yellow-800" id="final-date-display-${uid}"></p>
                      <button type="button" id="change-date-button-${uid}" class="mt-4 px-6 py-2 bg-yellow-600 text-yellow-900 font-semibold rounded-full text-sm">Change Date</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                  <input type="number" id="adults-${uid}" name="adults" value="1" min="1" class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                </div>
              </div>

              <div class="pt-2 flex flex-col sm:flex-row-reverse justify-end items-center gap-3">
                <button type="submit" class="submit-flight w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">Search Flights</button>
                <button type="button" class="cancel-flight w-full sm:w-auto px-6 py-2 text-gray-700 bg-gray-200 font-semibold rounded-xl shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition">Cancel</button>
              </div>
              <div id="message-box-${uid}" class="mt-2 p-3 text-center rounded-xl transition-opacity duration-300 opacity-0 hidden"></div>
            </form>
          </div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Helpers and constants
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const AIRPORT_API_URL = 'http://localhost:8000/tools/searchAirport';
        const FLIGHTS_API_URL = 'http://localhost:8000/tools/fetchFlights';

        const qs = (sel: string) => row.querySelector(sel) as HTMLElement | null;
        const qsi = (sel: string) => row.querySelector(sel) as HTMLInputElement | null;

        const dateInput = qs(`#date-picker-input-${uid}`);
        const dateModal = qs(`#date-picker-modal-${uid}`) as HTMLElement | null;
        const hiddenDateInput = qsi(`#departureDate-${uid}`);
        const displayDateSpan = qs(`#display-date-${uid}`) as HTMLElement | null;
        const dayList = qs(`#day-list-${uid}`) as HTMLElement | null;
        const monthList = qs(`#month-list-${uid}`) as HTMLElement | null;
        const yearList = qs(`#year-list-${uid}`) as HTMLElement | null;
        const calendarView = qs(`#calendar-view-${uid}`);
        const finalDateView = qs(`#final-date-view-${uid}`);
        const finalDateDisplay = qs(`#final-date-display-${uid}`) as HTMLElement | null;
        const changeDateButton = qs(`#change-date-button-${uid}`);
        const sourceInput = qsi(`#source-${uid}`)!;
        const sourceSuggestions = qs(`#source-suggestions-${uid}`)!;
        const sourcePopular = qs(`#source-popular-${uid}`)!;
        const destinationInput = qsi(`#destination-${uid}`)!;
        const destinationSuggestions = qs(`#destination-suggestions-${uid}`)!;
        const destinationPopular = qs(`#destination-popular-${uid}`)!;

        let selectedDay: number, selectedMonth: number, selectedYear: number;
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        selectedDay = currentDay; selectedMonth = currentMonth; selectedYear = currentYear;

        const selectionHighlight = qs(`#selection-highlight-${uid}`) as HTMLElement | null;
        const calendarGrid = dateModal ? (dateModal.querySelector('.grid') as HTMLElement | null) : null;

        const updateDateFields = () => {
          if (!hiddenDateInput || !displayDateSpan) return;
          const monthFormatted = String(selectedMonth + 1).padStart(2,'0');
          const dayFormatted = String(selectedDay).padStart(2,'0');
          const dateString = `${selectedYear}-${monthFormatted}-${dayFormatted}`;
          hiddenDateInput.value = dateString;
          displayDateSpan.textContent = dateString;
        };

        const populateDayList = (year: number, month: number) => {
          if (!dayList) return;
          dayList.innerHTML = '';
          const numDays = new Date(year, month + 1, 0).getDate();
          const startDay = (year === currentYear && month === currentMonth) ? currentDay : 1;
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; dayList.appendChild(e); }
          for (let i=startDay;i<=numDays;i++){ const li=document.createElement('li'); li.textContent=String(i); li.className='py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value=String(i); dayList.appendChild(li); }
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; dayList.appendChild(e); }
        };
        const populateMonthList = (year: number) => {
          if (!monthList) return;
          monthList.innerHTML='';
          const startMonth = (year === currentYear) ? currentMonth : 0;
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; monthList.appendChild(e); }
          for (let i=startMonth;i<monthNames.length;i++){ const li=document.createElement('li'); li.textContent=monthNames[i]; li.className='py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value=String(i); monthList.appendChild(li); }
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; monthList.appendChild(e); }
        };
        const populateYearList = () => {
          if (!yearList) return;
          yearList.innerHTML='';
          const endYear = currentYear + 10;
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; yearList.appendChild(e); }
          for (let i=currentYear;i<=endYear;i++){ const li=document.createElement('li'); li.textContent=String(i); li.className='py-2 px-1 cursor-pointer snap-center'; (li as any).dataset.value=String(i); yearList.appendChild(li); }
          for (let i=0;i<2;i++){ const e=document.createElement('li'); e.className='py-2 px-1'; yearList.appendChild(e); }
        };

        const updateHighlightPosition = () => {
          if (!selectionHighlight || !calendarGrid || !dayList) return;
          const selectedDayEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null;
          if (selectedDayEl) {
            const gridRect = calendarGrid.getBoundingClientRect();
            const dayRect = selectedDayEl.getBoundingClientRect();
            const topPosition = dayRect.top - gridRect.top;
            selectionHighlight.style.transform = `translateY(${topPosition}px)`;
          }
        };

        const updateSelectedClasses = () => {
          if (!dayList || !monthList || !yearList) return;
          dayList.querySelectorAll('li').forEach(li=>li.classList.remove('selected-text'));
          monthList.querySelectorAll('li').forEach(li=>li.classList.remove('selected-text'));
          yearList.querySelectorAll('li').forEach(li=>li.classList.remove('selected-text'));
          const dEl = dayList.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; if (dEl) dEl.classList.add('selected-text');
          const mEl = monthList.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; if (mEl) mEl.classList.add('selected-text');
          const yEl = yearList.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; if (yEl) yEl.classList.add('selected-text');
        };

        const scrollToSelected = () => {
          const dEl = dayList?.querySelector(`[data-value="${selectedDay}"]`) as HTMLElement | null; dEl?.scrollIntoView({behavior:'smooth', block:'center'});
          const mEl = monthList?.querySelector(`[data-value="${selectedMonth}"]`) as HTMLElement | null; mEl?.scrollIntoView({behavior:'smooth', block:'center'});
          const yEl = yearList?.querySelector(`[data-value="${selectedYear}"]`) as HTMLElement | null; yEl?.scrollIntoView({behavior:'smooth', block:'center'});
        };

        const handleScroll = (list: HTMLElement & { scrollTimeout?: any }, setter: (v:number)=>void) => {
          clearTimeout(list.scrollTimeout);
          list.scrollTimeout = setTimeout(() => {
            const listItems = Array.from(list.children) as HTMLElement[];
            const validItems = listItems.filter((li) => (li as HTMLElement).dataset && (li as HTMLElement).dataset.value);
            if (!validItems.length) return;
            let closestItem: HTMLElement = validItems[0];
            let minDistance = Infinity;
            const listRect = list.getBoundingClientRect();
            validItems.forEach((item: HTMLElement) => {
              const rect = item.getBoundingClientRect();
              const distance = Math.abs((rect.top + rect.bottom)/2 - (listRect.top + listRect.bottom)/2);
              if (distance < minDistance) { minDistance = distance; closestItem = item; }
            });
            const dataVal = (closestItem.dataset || ({} as any)).value;
            if (closestItem && dataVal) {
              const value = parseInt(dataVal, 10);
              setter(value);
              updateDateFields(); updateHighlightPosition(); updateSelectedClasses();
            }
          }, 50);
        };

        const handleClick = (event: any, setter: (v:number)=>void, updateCallback: ()=>void) => {
          const li = event.target.closest('li');
          if (li && li.dataset.value) {
            const value = parseInt(li.dataset.value, 10);
            setter(value);
            updateCallback();
            updateDateFields(); updateHighlightPosition(); updateSelectedClasses(); scrollToSelected(); animateToFinalView();
          }
        };

        const openModal = () => {
          if (!dateModal) return; dateModal.classList.remove('scale-95','opacity-0','pointer-events-none'); dateModal.classList.add('scale-100','opacity-100','pointer-events-auto'); updateHighlightPosition(); updateSelectedClasses(); scrollToSelected();
        };
        const closeModal = () => { if (!dateModal) return; dateModal.classList.remove('scale-100','opacity-100','pointer-events-auto'); dateModal.classList.add('scale-95','opacity-0','pointer-events-none'); };
        const animateToFinalView = () => {
          if (!calendarView || !finalDateView || !finalDateDisplay) return;
          calendarView.classList.remove('opacity-100','pointer-events-auto');
          calendarView.classList.add('opacity-0','pointer-events-none');
          finalDateDisplay.textContent = `${selectedDay} ${monthNames[selectedMonth]} ${selectedYear}`;
          finalDateView.classList.remove('opacity-0','pointer-events-none');
          finalDateView.classList.add('opacity-100','pointer-events-auto');
        };
        const resetCalendarView = () => {
          if (!calendarView || !finalDateView) return;
          finalDateView.classList.remove('opacity-100','pointer-events-auto');
          finalDateView.classList.add('opacity-0','pointer-events-none');
          calendarView.classList.remove('opacity-0','pointer-events-none');
          calendarView.classList.add('opacity-100','pointer-events-auto');
          scrollToSelected();
        };

        // initialize lists and defaults
        populateYearList(); populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); updateDateFields();

        // listeners
        dateInput?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
        changeDateButton?.addEventListener('click', resetCalendarView);
        document.addEventListener('click', (e) => { if (dateModal && !dateModal.contains(e.target as Node) && dateInput && !dateInput.contains(e.target as Node)) closeModal(); });
        dayList?.addEventListener('scroll', () => handleScroll(dayList, (val)=>{ selectedDay = val; if (selectedYear===currentYear && selectedMonth===currentMonth && selectedDay<currentDay) selectedDay=currentDay; }));
        dayList?.addEventListener('click', (e) => handleClick(e, (val)=>{ selectedDay = val; if (selectedYear===currentYear && selectedMonth===currentMonth && selectedDay<currentDay) selectedDay=currentDay; }, ()=>{}));
        monthList?.addEventListener('scroll', () => handleScroll(monthList, (val)=>{ selectedMonth = val; if (selectedYear===currentYear && selectedMonth<currentMonth) selectedMonth=currentMonth; if (selectedYear===currentYear && selectedMonth===currentMonth && selectedDay<currentDay) selectedDay=currentDay; populateDayList(selectedYear, selectedMonth); }));
        monthList?.addEventListener('click', (e) => handleClick(e, (val)=>{ selectedMonth = val; if (selectedYear===currentYear && selectedMonth<currentMonth) selectedMonth=currentMonth; if (selectedYear===currentYear && selectedMonth===currentMonth && selectedDay<currentDay) selectedDay=currentDay; }, ()=>{ populateDayList(selectedYear, selectedMonth); }));
        yearList?.addEventListener('scroll', () => handleScroll(yearList, (val)=>{ selectedYear = val; populateMonthList(selectedYear); if (selectedYear===currentYear && selectedMonth<currentMonth) { selectedMonth=currentMonth; selectedDay=currentDay; } populateDayList(selectedYear, selectedMonth); }));
        yearList?.addEventListener('click', (e) => handleClick(e, (val)=>{ selectedYear = val; if (selectedYear===currentYear && selectedMonth<currentMonth) { selectedMonth=currentMonth; selectedDay=currentDay; } }, ()=>{ populateMonthList(selectedYear); populateDayList(selectedYear, selectedMonth); }));

        // popular cities & autocomplete
        const popularCities = [
          { name: 'New Delhi', city: 'New Delhi, Delhi', iata: 'DEL' },
          { name: 'Mumbai', city: 'Mumbai, Maharashtra', iata: 'BOM' },
          { name: 'Bengaluru', city: 'Bengaluru, Karnataka', iata: 'BLR' },
          { name: 'Chennai', city: 'Chennai, Tamil Nadu', iata: 'MAA' },
          { name: 'Kolkata', city: 'Kolkata, West Bengal', iata: 'CCU' },
          { name: 'Hyderabad', city: 'Hyderabad, Telangana', iata: 'HYD' }
        ];
        let autocompleteTimeout: any;
        const toggleSuggestions = (inputName: 'source'|'destination', showPopular: boolean) => {
          const popularEl = (inputName==='source') ? sourcePopular : destinationPopular;
          const suggestionsEl = (inputName==='source') ? sourceSuggestions : destinationSuggestions;
          sourcePopular.classList.add('hidden'); destinationPopular.classList.add('hidden'); sourceSuggestions.classList.add('hidden'); destinationSuggestions.classList.add('hidden');
          if (showPopular) { populatePopularCities(inputName); popularEl.classList.remove('hidden'); } else { suggestionsEl.classList.remove('hidden'); }
        };
        const populatePopularCities = (inputName: 'source'|'destination') => {
          const listEl = (inputName==='source') ? sourcePopular : destinationPopular;
          listEl.innerHTML = '';
          const title = document.createElement('div'); title.textContent='Popular Cities'; title.className='py-2 px-4 text-gray-400 text-sm font-semibold border-b border-gray-200'; listEl.appendChild(title);
          popularCities.forEach(city => {
            const item = document.createElement('div'); item.className='popular-city-item'; item.innerHTML = `<div>${city.name}, <span class="font-medium">${city.city}</span></div><div class="text-sm text-gray-500">${city.iata}</div>`;
            item.addEventListener('click', () => { const input = (inputName==='source' ? sourceInput : destinationInput); if (input) input.value = `${city.name} (${city.iata})`; listEl.classList.add('hidden'); });
            listEl.appendChild(item);
          });
        };
        const fetchAndDisplayAirports = async (inputEl: HTMLInputElement, suggestionsEl: HTMLElement, searchString: string) => {
          if (searchString.length < 2) { suggestionsEl.innerHTML=''; suggestionsEl.classList.add('hidden'); return; }
          if (inputEl === sourceInput) { sourcePopular.classList.add('hidden'); } else { destinationPopular.classList.add('hidden'); }
          try {
            const response = await fetch(AIRPORT_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searchString }) });
            if (!response.ok) throw new Error(`API error ${response.status}`);
            const airports = await response.json();
            suggestionsEl.innerHTML='';
            if (airports && airports.length > 0) {
              airports.forEach((airport: any) => {
                const item = document.createElement('div'); item.className='autocomplete-item'; item.innerHTML = `<div>${airport.name}</div><div class="text-sm text-gray-500">${airport.city}, ${airport.country}</div>`;
                item.addEventListener('click', () => { inputEl.value = `${airport.name} (${airport.iata})`; suggestionsEl.classList.add('hidden'); });
                suggestionsEl.appendChild(item);
              });
              suggestionsEl.classList.remove('hidden');
            } else { suggestionsEl.classList.add('hidden'); }
          } catch (e) { console.error('Failed to fetch airport suggestions', e); suggestionsEl.classList.add('hidden'); }
        };
        sourceInput.addEventListener('input', (e: any) => { clearTimeout(autocompleteTimeout); autocompleteTimeout = setTimeout(()=>{ fetchAndDisplayAirports(sourceInput, sourceSuggestions, e.target.value); }, 300); });
        sourceInput.addEventListener('focus', () => toggleSuggestions('source', true));
        destinationInput.addEventListener('input', (e: any) => { clearTimeout(autocompleteTimeout); autocompleteTimeout = setTimeout(()=>{ fetchAndDisplayAirports(destinationInput, destinationSuggestions, e.target.value); }, 300); });
        destinationInput.addEventListener('focus', () => toggleSuggestions('destination', true));
        document.addEventListener('click', (e) => {
          if (!row.contains(e.target as Node)) return;
          if (!sourceInput.contains(e.target as Node) && !sourceSuggestions.contains(e.target as Node) && !sourcePopular.contains(e.target as Node)) { sourceSuggestions.classList.add('hidden'); sourcePopular.classList.add('hidden'); }
          if (!destinationInput.contains(e.target as Node) && !destinationSuggestions.contains(e.target as Node) && !destinationPopular.contains(e.target as Node)) { destinationSuggestions.classList.add('hidden'); destinationPopular.classList.add('hidden'); }
        });

        // Submit
        const form = row.querySelector('.flight-form') as HTMLFormElement | null;
        const cancelBtn = row.querySelector('.cancel-flight') as HTMLElement | null;
        if (cancelBtn) cancelBtn.addEventListener('click', () => { row.remove(); });
        if (form) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
              source: sourceInput.value,
              destination: destinationInput.value,
              departureDate: (hiddenDateInput && hiddenDateInput.value) || new Date().toISOString().slice(0,10),
              adults: parseInt((row.querySelector(`#adults-${uid}`) as HTMLInputElement).value || '1', 10)
            };
            createMessageBubble(`Flight search: ${payload.source} → ${payload.destination} (${payload.departureDate}) - ${payload.adults} adult(s)`, true);
            const loader = createLoadingIndicator();
            try {
              const resp = await fetch(FLIGHTS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
              const json = await resp.json();
              loader.remove();
              row.remove();
              const codeBlock = '```json\n' + JSON.stringify(json, null, 2) + '\n```';
              createMessageBubble(codeBlock, false);
            } catch (err) {
              console.error('Flight fetch failed', err);
              loader.remove();
              createMessageBubble('Unable to fetch flights. Please try again later.', false);
            }
          });
        }
      };




      const attachQuickReplyListeners = () => {
        const buttons = document.querySelectorAll('.quick-reply-button');
        buttons.forEach(btn => {
          const b = btn as HTMLElement & { _qrHandler?: any };
          if (b._qrHandler) return;
          const handler = () => {
            const label = (b.dataset.label || b.textContent || '').trim();
            if (label.toLowerCase().startsWith('find a flight')) { createInlineFlightForm(); return; }
            if (userPromptInput) { userPromptInput.value = label; userPromptInput.focus(); }
          };
          btn.addEventListener('click', handler);
          b._qrHandler = handler;
        });
      };

      try {
        attachQuickReplyListeners();
        document.addEventListener('DOMContentLoaded', attachQuickReplyListeners);
      } catch (e) { console.warn('Failed to attach quick reply listeners', e); }

      addWelcomeMessage();
    };

    window.addEventListener('load', onLoad);
    // Also run once immediately in case 'load' has already fired
    onLoad();

    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return (
    <>
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F6f93519000c74ba084c4626024227ad2%2F161f61559b844c2b95a6c7af386a3097?format=webp&width=800" alt="Tapas logo" className="nav-brand-logo w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-gray-800">Tapas Travel AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">Features</a>
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">About</a>
            <a href="/" className="text-gray-600 hover:text-blue-500 font-medium transition duration-300">Contact</a>
          </div>
        </div>
      </nav>
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
        <div id="intro-section" className="w-full md:w-1/2 lg:w-1/3 p-8 bg-white rounded-2xl shadow-lg flex-shrink-0 flex flex-col space-y-6 transition-all duration-700 ease-in-out absolute md:relative z-10">
          <h1 className="text-4xl font-extrabold text-gray-800 leading-tight">Your Personal Travel Agent.</h1>
          <p className="text-lg text-gray-600">
            Meet Tapas, your AI travel companion. Tapas is designed to simplify your travel planning by providing real-time data on flights, hotels, and local attractions.
          </p>
          <p className="text-md text-gray-500">
            Whether you're looking for the best flight deals, a cozy hotel for your stay, or exciting places to visit, Tapas is here to help. Just start a conversation and let's plan your next adventure!
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3 text-gray-700">
              <i className="fas fa-plane text-blue-500 text-xl" />
              <span className="font-semibold">Live Flight Data</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <i className="fas fa-hotel text-blue-500 text-xl" />
              <span className="font-semibold">Hotel Booking & Info</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <i className="fas fa-map-marker-alt text-blue-500 text-xl" />
              <span className="font-semibold">Attractions & Itineraries</span>
            </div>
          </div>
        </div>

        <div id="chat-container" className="bg-gray-200 phone-view flex-grow flex flex-col overflow-hidden transition-all duration-700 ease-in-out shadow-2xl chat-right-align z-20">
          <div className="relative bg-white shadow-md rounded-t-2xl p-4 flex items-center justify-between z-10">
            <div className="chat-title-centered">AI⚡Hutech</div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F6f93519000c74ba084c4626024227ad2%2F161f61559b844c2b95a6c7af386a3097?format=webp&width=800" alt="Tapas logo" className="w-8 h-8 rounded-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800">Tapas</span>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              <button id="toggle-view" className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                <i className="fas fa-desktop text-sm" />
              </button>
              <button id="overflow-button" className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200" aria-haspopup="true" aria-expanded={false} aria-controls="overflow-menu" title="More options">
                <i className="fas fa-ellipsis-v text-sm" />
              </button>
              <div id="overflow-menu" className="hidden absolute right-0 top-11 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-30">
                <button id="restart-convo" className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Restart conversation</button>
              </div>
            </div>
          </div>
          <div id="chat-messages" className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="flex flex-col items-start space-y-3">
              <div className="bg-white p-3 rounded-2xl shadow-sm max-w-[80%] welcome-message">
                <p className="text-gray-800 text-sm">Hello! How can I help you plan your next trip?</p>
              </div>
              <div className="quick-actions flex flex-wrap gap-2 max-w-[80%] mt-2" aria-label="Suggested actions">
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Find a flight?">Find a flight?</button>
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Search for hotels?">Search for hotels?</button>
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Explore attractions in a city?">Explore attractions in a city?</button>
                <button type="button" className="quick-reply-button px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 hover:bg-blue-50 transition" data-label="Generate a travel itinerary?">Generate a travel itinerary?</button>
              </div>
            </div>
          </div>
          <form id="chat-form" className="p-4 bg-white rounded-b-2xl">
            <div className="relative chat-input-wrapper">
              <input type="text" id="user-prompt" placeholder="Ask Tapas about your travel plans..." className="chat-input w-full p-3 pl-4 pr-14 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm" />
              <button type="submit" className="send-button absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Send message">
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <div id="modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
          <p id="modal-text" className="mb-4 text-gray-700"></p>
          <button onClick={() => { const m = document.getElementById('modal'); if (m) m.classList.add('hidden'); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Close</button>
        </div>
      </div>
    </>
  );
};

export default ChatApp;
