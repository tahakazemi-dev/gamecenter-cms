document.addEventListener('DOMContentLoaded', () => {

    const DEFAULT_SETTINGS = {
        RATES: { ps5: 80000, ps4: 70000, pc: 60000, billiard: 50000, vr: 90000 },
        COST_STEP: 500, EXTRA_CONTROLLER_COST: 10000,
        PRODUCTS: [{ id: 'prod1', name: 'رانی', price: 25000 }, { id: 'prod2', name: 'آب معدنی', price: 10000 }]
    };
    let settings = {};
    const DEVICES = [
        { type: 'ps5', name: 'PS5 - 1', id: 'console-1' }, { type: 'ps5', name: 'PS5 - 2', id: 'console-2' }, { type: 'ps5', name: 'PS5 - 3', id: 'console-3' },
        { type: 'ps4', name: 'PS4 - 1', id: 'console-4' }, { type: 'ps4', name: 'PS4 - 2', id: 'console-5' },
        { type: 'pc', name: 'PC - 1', id: 'pc-1' }, { type: 'pc', name: 'PC - 2', id: 'pc-2' }, { type: 'pc', name: 'PC - 3', id: 'pc-3' }, { type: 'pc', name: 'PC - 4', id: 'pc-4' }, { type: 'pc', name: 'PC - 5', id: 'pc-5' }, { type: 'pc', name: 'PC - 6', id: 'pc-6' },
        { type: 'billiard', name: 'میز ۱', id: 'billiard-1' }, { type: 'billiard', name: 'میز ۲', id: 'billiard-2' },
        { type: 'vr', name: 'VR - 1', id: 'vr-1' }
    ];
    let activeSessions = [], history = [], reservations = [], currentTournament = null, selectedDeviceId = null;

    // --- انتخاب المان‌های DOM ---
    const deviceContainers = { consoles: document.getElementById('consoles'), pcs: document.getElementById('pcs'), billiards: document.getElementById('billiards'), vrs: document.getElementById('vrs') };
    const startSessionForm = document.getElementById('start-session-form');
    const selectedDeviceNameSpan = document.getElementById('selected-device-name');
    const customerNameInput = document.getElementById('customer-name');
    const customTimeInput = document.getElementById('custom-time-input');
    const controllerSelectionDiv = document.getElementById('controller-selection');
    const controllerCountSelect = document.getElementById('controller-count');
    const startButton = document.getElementById('start-button');
    const cancelButton = document.getElementById('cancel-button');
    const sessionsList = document.getElementById('sessions-list');
    const adminModal = document.getElementById('admin-modal');
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const closeBtn = document.querySelector('.close-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const ratePs5Input = document.getElementById('rate-ps5-input');
    const ratePs4Input = document.getElementById('rate-ps4-input');
    const ratePcInput = document.getElementById('rate-pc-input');
    const rateBilliardInput = document.getElementById('rate-billiard-input');
    const rateVrInput = document.getElementById('rate-vr-input');
    const extraControllerInput = document.getElementById('extra-controller-input');
    const productsSettingsContainer = document.getElementById('products-settings-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const historyList = document.getElementById('history-list');
    const totalIncomeEl = document.getElementById('total-income');
    const reservationBtn = document.getElementById('reservation-btn');
    const reservationModal = document.getElementById('reservation-modal');
    const closeReservationBtn = document.querySelector('.close-reservation-btn');
    const reservationForm = document.getElementById('reservation-form');
    const resCustomerNameInput = document.getElementById('res-customer-name');
    const resPhoneNumberInput = document.getElementById('res-phone-number');
    const resDatetimeInput = document.getElementById('res-datetime');
    const reservationDeviceList = document.getElementById('reservation-device-list');
    const reservationsListBody = document.getElementById('reservations-list-body');
    const tournamentBtn = document.getElementById('tournament-btn');
    const tournamentSetupModal = document.getElementById('tournament-setup-modal');
    const closeTournamentSetupBtn = document.querySelector('.close-tournament-setup-btn');
    const tournamentSetupForm = document.getElementById('tournament-setup-form');
    const tournamentNameInput = document.getElementById('tournament-name');
    const playerCountSelect = document.getElementById('player-count');
    const tournamentBracketModal = document.getElementById('tournament-bracket-modal');
    const tournamentModalTitle = document.getElementById('tournament-modal-title');
    const tournamentContentArea = document.getElementById('tournament-content-area');
    const closeTournamentBracketBtn = document.querySelector('.close-tournament-bracket-btn');
    const addGameModal = document.getElementById('add-game-modal');
    const closeAddGameBtn = document.querySelector('.close-add-game-btn');
    const addGameCustomerNameEl = document.getElementById('add-game-customer-name');
    const addGameDeviceListEl = document.getElementById('add-game-device-list');
    const addGameErrorEl = document.getElementById('add-game-error');
    let currentCustomerIdForNewGame = null;


    const loadDataFromStorage = () => {
        const storedSessions = localStorage.getItem('activeGameNetSessions');
        if (storedSessions) {
            activeSessions = JSON.parse(storedSessions);
            activeSessions.forEach(session => {
                if (!session.hasOwnProperty('addedProducts')) session.addedProducts = [];
                if (!session.hasOwnProperty('deviceType')) {
                    const device = DEVICES.find(d => d.id === session.deviceId);
                    session.deviceType = device ? device.type : 'pc';
                }
                if (!session.hasOwnProperty('isPaused')) session.isPaused = false;
            });
        }
        const storedHistory = localStorage.getItem('gameNetHistory');
        if (storedHistory) history = JSON.parse(storedHistory);
        const storedReservations = localStorage.getItem('gameNetReservations');
        if (storedReservations) reservations = JSON.parse(storedReservations);
        const storedSettings = localStorage.getItem('gameNetSettings');
        settings = storedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) } : { ...DEFAULT_SETTINGS };
    };
    const saveDataToStorage = () => {
        localStorage.setItem('activeGameNetSessions', JSON.stringify(activeSessions));
        localStorage.setItem('gameNetHistory', JSON.stringify(history));
        localStorage.setItem('gameNetReservations', JSON.stringify(reservations));
        localStorage.setItem('gameNetSettings', JSON.stringify(settings));
    };

    // --- توابع اصلی پروژه ---
    const createDeviceElements = () => {
        Object.values(deviceContainers).forEach(container => container.innerHTML = '');
        DEVICES.forEach(device => {
            const deviceEl = document.createElement('div');
            deviceEl.className = 'device';
            deviceEl.textContent = device.name;
            deviceEl.dataset.id = device.id;
            deviceEl.dataset.type = device.type;
            let container = deviceContainers.pcs;
            if (device.type === 'ps5' || device.type === 'ps4') container = deviceContainers.consoles;
            else if (device.type === 'billiard') container = deviceContainers.billiards;
            else if (device.type === 'vr') container = deviceContainers.vrs;
            container.appendChild(deviceEl);
            deviceEl.addEventListener('click', handleDeviceClick);
        });
    };
    const handleDeviceClick = (event) => {
        const deviceEl = event.currentTarget;
        selectedDeviceId = deviceEl.dataset.id;
        const device = DEVICES.find(d => d.id === selectedDeviceId);
        selectedDeviceNameSpan.textContent = device.name;
        controllerSelectionDiv.classList.toggle('hidden', device.type !== 'ps5' && device.type !== 'ps4');
        startSessionForm.classList.remove('hidden');
        customerNameInput.focus();
    };
    const startSession = (customerNameOverride = null, deviceIdOverride = null, customerIdOverride = null) => {
        const customerName = customerNameOverride || customerNameInput.value.trim();
        if (!customerName) return alert('لطفاً نام مشتری را وارد کنید.');
        const deviceId = deviceIdOverride || selectedDeviceId;
        const device = DEVICES.find(d => d.id === deviceId);

        let startTimeISO;
        const customTimeValue = customTimeInput.value;
        if (customTimeValue && !customerNameOverride) { // Only for new sessions from the main form
            const now = new Date();
            const [hours, minutes] = customTimeValue.split(':');
            const customStartDate = new Date();
            customStartDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            if (customStartDate > now) return alert('زمان شروع نمی‌تواند در آینده باشد.');
            startTimeISO = customStartDate.toISOString();
        } else {
            startTimeISO = new Date().toISOString();
        }

        const sessionId = `sess_${Date.now()}_${Math.random()}`;
        activeSessions.push({
            sessionId,
            customerId: customerIdOverride || sessionId,
            deviceId, deviceType: device.type, customerName,
            startTime: startTimeISO, addedProducts: [],
            controllerCount: (device.type === 'ps5' || device.type === 'ps4') ? parseInt(controllerCountSelect.value, 10) : null,
            isPaused: false, pauseStartTime: null
        });
        saveDataToStorage();
        updateDisplay();
        resetAndHideForm();
    };
    const resetAndHideForm = () => {
        startSessionForm.classList.add('hidden');
        customerNameInput.value = '';
        customTimeInput.value = '';
        controllerCountSelect.value = '2';
        selectedDeviceId = null;
    };
    const checkoutSession = (sessionId) => {
        const sessionIndex = activeSessions.findIndex(s => s.sessionId === sessionId);
        if (sessionIndex === -1) return;
        const session = activeSessions[sessionIndex];

        const timeCost = calculateCost(session).rounded;
        const controllerCost = (session.controllerCount && session.controllerCount > 2) ? (session.controllerCount - 2) * settings.EXTRA_CONTROLLER_COST : 0;
        const productsCost = session.addedProducts.reduce((sum, product) => sum + product.price, 0);
        const finalCost = timeCost + controllerCost + productsCost;
        const device = DEVICES.find(d => d.id === session.deviceId);

        alert(`تسویه حساب برای ${session.customerName} (${device.name})\nمبلغ نهایی: ${finalCost.toLocaleString()} تومان`);

        history.push({
            id: Date.now().toString(), customerName: session.customerName, deviceName: device.name,
            finalCost, checkoutDate: new Date().toISOString()
        });

        activeSessions.splice(sessionIndex, 1);
        saveDataToStorage();
        updateDisplay();
        if (!adminModal.classList.contains('hidden')) renderHistory();
    };
    const checkoutCustomer = (customerId) => {
        const customerSessions = activeSessions.filter(s => s.customerId === customerId);
        if (customerSessions.length === 0) return;

        let totalFinalCost = 0;
        let checkoutDetails = `--- تسویه حساب کلی برای ${customerSessions[0].customerName} ---\n\n`;

        customerSessions.forEach(session => {
            const timeCost = calculateCost(session).rounded;
            const controllerCost = (session.controllerCount && session.controllerCount > 2) ? (session.controllerCount - 2) * settings.EXTRA_CONTROLLER_COST : 0;
            const productsCost = session.addedProducts.reduce((sum, product) => sum + product.price, 0);
            const finalCost = timeCost + controllerCost + productsCost;
            totalFinalCost += finalCost;
            const device = DEVICES.find(d => d.id === session.deviceId);
            checkoutDetails += `- دستگاه ${device.name}: ${finalCost.toLocaleString()} تومان\n`;
            history.push({
                id: `${Date.now()}_${session.sessionId}`, customerName: session.customerName, deviceName: device.name,
                finalCost, checkoutDate: new Date().toISOString()
            });
        });

        checkoutDetails += `-------------------\nمبلغ نهایی کل: ${totalFinalCost.toLocaleString()} تومان`;
        alert(checkoutDetails);

        activeSessions = activeSessions.filter(s => s.customerId !== customerId);
        saveDataToStorage();
        updateDisplay();
        if (!adminModal.classList.contains('hidden')) renderHistory();
    };
    const addProductToSession = (sessionId) => {
        const session = activeSessions.find(s => s.sessionId === sessionId);
        if (!session) return;
        let productOptions = '';
        settings.PRODUCTS.forEach((p, index) => { productOptions += `${index + 1}. ${p.name} (${p.price.toLocaleString()} تومان)\n`; });
        const choice = prompt("کدام محصول را اضافه می‌کنید؟ شماره را وارد کنید:\n" + productOptions);
        if (!choice) return;
        const productIndex = parseInt(choice, 10) - 1;
        if (!isNaN(productIndex) && productIndex >= 0 && productIndex < settings.PRODUCTS.length) {
            const selectedProduct = settings.PRODUCTS[productIndex];
            session.addedProducts.push({ name: selectedProduct.name, price: selectedProduct.price });
            saveDataToStorage();
            alert(`${selectedProduct.name} به حساب ${session.customerName} اضافه شد.`);
            renderActiveSessionsTable();
        } else { alert("انتخاب نامعتبر است."); }
    };
    const togglePauseSession = (sessionId) => {
        const session = activeSessions.find(s => s.sessionId === sessionId);
        if (!session) return;
        if (session.isPaused) {
            const pauseDuration = new Date() - new Date(session.pauseStartTime);
            session.startTime = new Date(new Date(session.startTime).getTime() + pauseDuration).toISOString();
            session.isPaused = false;
            session.pauseStartTime = null;
        } else {
            session.isPaused = true;
            session.pauseStartTime = new Date().toISOString();
        }
        saveDataToStorage();
        updateDisplay();
    };
    const updateDisplay = () => {
        updateDeviceStatuses();
        renderActiveSessionsTable();
    };
    const updateDeviceStatuses = () => {
        const sessionCounts = activeSessions.reduce((acc, session) => {
            acc[session.deviceId] = (acc[session.deviceId] || 0) + 1;
            return acc;
        }, {});
        const reservedDeviceIds = reservations.flatMap(r => r.deviceIds);
        document.querySelectorAll('.device').forEach(el => {
            el.classList.remove('available', 'occupied', 'reserved');
            const deviceId = el.dataset.id;
            const existingCounter = el.querySelector('.session-counter');
            if (existingCounter) existingCounter.remove();
            if (sessionCounts[deviceId] > 0) {
                el.classList.add('occupied');
                if (sessionCounts[deviceId] > 1) {
                    const counterEl = document.createElement('div');
                    counterEl.className = 'session-counter';
                    counterEl.textContent = `x${sessionCounts[deviceId]}`;
                    el.appendChild(counterEl);
                }
            } else {
                el.classList.add('available');
                if (reservedDeviceIds.includes(deviceId)) el.classList.add('reserved');
            }
        });
    };
    const renderActiveSessionsTable = () => {
        sessionsList.innerHTML = '';
        if (activeSessions.length === 0) {
            sessionsList.innerHTML = `<tr class="empty-row"><td colspan="5">در حال حاضر هیچ بازیکنی فعال نیست.</td></tr>`;
            return;
        }
        const groupedSessions = activeSessions.reduce((acc, session) => {
            acc[session.customerId] = acc[session.customerId] || [];
            acc[session.customerId].push(session);
            return acc;
        }, {});
        Object.values(groupedSessions).forEach(customerGroup => {
            customerGroup.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            const mainSession = customerGroup[0];
            const totalCost = customerGroup.reduce((total, s) => total + calculateCost(s).rounded + s.addedProducts.reduce((sum, p) => sum + p.price, 0), 0);
            const parentRow = document.createElement('tr');
            parentRow.className = 'parent-row';
            parentRow.dataset.customerId = mainSession.customerId;
            parentRow.innerHTML = `
                <td class="toggle-col"><span class="toggle-icon">▶</span></td>
                <td>${mainSession.customerName}</td>
                <td>${customerGroup.length}</td>
                <td class="total-customer-cost">${totalCost.toLocaleString()}</td>
                <td>
                    <button class="action-btn add-game-btn" data-customer-id="${mainSession.customerId}">+ بازی</button>
                    <button class="action-btn checkout-all-btn" data-customer-id="${mainSession.customerId}">تسویه کل</button>
                </td>`;
            sessionsList.appendChild(parentRow);
            customerGroup.forEach(session => {
                const device = DEVICES.find(d => d.id === session.deviceId);
                const row = document.createElement('tr');
                row.className = 'sub-session-row';
                row.dataset.parentCustomerId = mainSession.customerId;
                row.classList.toggle('paused-session', session.isPaused);
                const pauseButtonText = session.isPaused ? 'ادامه' : 'توقف';
                const pauseButtonClass = session.isPaused ? 'resume-btn' : 'pause-btn';
                const productIndicator = session.addedProducts.length > 0 ? `<span class="product-indicator">🥤</span>` : '';
                row.innerHTML = `
                    <td colspan="2" style="padding-left: 50px;">
                        <strong>${device.name}</strong> ${productIndicator}
                    </td>
                    <td>${new Date(session.startTime).toLocaleTimeString('fa-IR')}</td>
                    <td class="elapsed-time">${session.isPaused ? 'متوقف شده' : '00:00:00'}</td>
                    <td>
                        <button class="action-btn ${pauseButtonClass}" data-session-id="${session.sessionId}">${pauseButtonText}</button>
                        <button class="action-btn add-item-btn" data-session-id="${session.sessionId}">محصول</button>
                        <button class="action-btn checkout-btn" data-session-id="${session.sessionId}">تسویه</button>
                    </td>`;
                sessionsList.appendChild(row);
            });
        });
    };
    const getElapsedTime = (startTime) => {
        const diff = new Date() - new Date(startTime);
        if (diff < 0) return { totalSeconds: 0, formatted: '00:00:00' };
        const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        return { totalSeconds: diff / 1000, formatted: `${hours}:${minutes}:${seconds}` };
    };
    const calculateCost = (session) => {
        const hourlyRate = settings.RATES[session.deviceType] || 0;
        let elapsedSeconds = 0;
        if (session.isPaused) {
            elapsedSeconds = (new Date(session.pauseStartTime) - new Date(session.startTime)) / 1000;
        } else {
            elapsedSeconds = getElapsedTime(session.startTime).totalSeconds;
        }
        const preciseCost = (elapsedSeconds / 3600) * hourlyRate;
        return { precise: preciseCost, rounded: Math.round(preciseCost / settings.COST_STEP) * settings.COST_STEP };
    };
    const updateTimersAndCosts = () => {
        const groupedSessions = activeSessions.reduce((acc, session) => {
            acc[session.customerId] = acc[session.customerId] || [];
            acc[session.customerId].push(session);
            return acc;
        }, {});

        document.querySelectorAll('.parent-row').forEach(pRow => {
            const customerId = pRow.dataset.customerId;
            const customerGroup = groupedSessions[customerId];
            if (customerGroup) {
                const totalCost = customerGroup.reduce((total, s) => total + calculateCost(s).rounded + s.addedProducts.reduce((sum, p) => sum + p.price, 0), 0);
                pRow.querySelector('.total-customer-cost').textContent = totalCost.toLocaleString();
            }
        });

        document.querySelectorAll('.sub-session-row').forEach(sRow => {
            const parentId = sRow.dataset.parentCustomerId;
            const mainSession = groupedSessions[parentId] ? groupedSessions[parentId][0] : null;
            if (!mainSession) return;
            const session = activeSessions.find(s => s.sessionId === sRow.querySelector('.action-btn').dataset.sessionId);
            if (!session) return;
            const timeEl = sRow.querySelector('.elapsed-time');
            if (session.isPaused) {
                timeEl.textContent = 'متوقف شده';
            } else {
                timeEl.textContent = getElapsedTime(session.startTime).formatted;
            }
        });
    };

    // --- توابع افزودن بازی جدید ---
    const openAddGameModal = (customerId) => {
        currentCustomerIdForNewGame = customerId;
        const customerName = activeSessions.find(s => s.customerId === customerId).customerName;
        if (!customerName) return;
        addGameCustomerNameEl.textContent = customerName;
        addGameDeviceListEl.innerHTML = '';
        addGameErrorEl.textContent = '';
        DEVICES.forEach(device => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'device-item';
            itemDiv.textContent = device.name;
            itemDiv.addEventListener('click', () => handleAddGameDeviceSelection(device.id));
            addGameDeviceListEl.appendChild(itemDiv);
        });
        addGameModal.classList.remove('hidden');
    };
    const closeAddGameModal = () => addGameModal.classList.add('hidden');
    const handleAddGameDeviceSelection = (deviceId) => {
        const customer = activeSessions.find(s => s.customerId === currentCustomerIdForNewGame);
        if (!customer) return;
        startSession(customer.customerName, deviceId, customer.customerId);
        closeAddGameModal();
    };

    // --- توابع رزرو ---
    const openReservationModal = () => {
        reservationForm.reset();
        reservationDeviceList.innerHTML = '';
        const sessionCounts = activeSessions.reduce((acc, s) => { acc[s.deviceId] = (acc[s.deviceId] || 0) + 1; return acc; }, {});
        DEVICES.forEach(device => {
            const count = sessionCounts[device.id] || 0;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'device-item';
            itemDiv.innerHTML = `<input type="checkbox" id="res-${device.id}" data-id="${device.id}"><label for="res-${device.id}">${device.name} ${count > 0 ? `(x${count} مشغول)` : ''}</label>`;
            reservationDeviceList.appendChild(itemDiv);
        });
        reservationModal.classList.remove('hidden');
    };
    const closeReservationModal = () => reservationModal.classList.add('hidden');
    const handleReservationSubmit = (event) => {
        event.preventDefault();
        const customerName = resCustomerNameInput.value.trim();
        const datetimeValue = resDatetimeInput.value;
        const selectedDeviceIds = Array.from(reservationDeviceList.querySelectorAll('input:checked')).map(cb => cb.dataset.id);
        if (!customerName || !datetimeValue || selectedDeviceIds.length === 0) return alert('لطفا نام مشتری، زمان و حداقل یک دستگاه را انتخاب کنید.');
        if (new Date(datetimeValue) < new Date()) return alert('تاریخ و ساعت رزرو باید در آینده باشد.');
        reservations.push({ id: `res_${Date.now()}`, customerName, phoneNumber: resPhoneNumberInput.value.trim(), startTime: new Date(datetimeValue).toISOString(), deviceIds: selectedDeviceIds });
        saveDataToStorage();
        alert(`رزرو برای ${customerName} با موفقیت ثبت شد!`);
        closeReservationModal();
        updateDisplay();
    };
    const checkAndActivateReservations = () => {
        const now = new Date();
        const activatedReservationIds = [];
        reservations.forEach(res => {
            if (now >= new Date(res.startTime)) {
                res.deviceIds.forEach(deviceId => {
                    startSession(`${res.customerName} (رزرو)`, deviceId);
                });
                activatedReservationIds.push(res.id);
            }
        });
        if (activatedReservationIds.length > 0) {
            reservations = reservations.filter(res => !activatedReservationIds.includes(res.id));
            saveDataToStorage();
            updateDisplay();
            if (!adminModal.classList.contains('hidden')) renderReservationsTable();
        }
    };
    const cancelReservation = (reservationId) => {
        if (confirm('آیا از لغو این رزرو مطمئن هستید؟')) {
            reservations = reservations.filter(res => res.id !== reservationId);
            saveDataToStorage();
            renderReservationsTable();
            updateDisplay();
        }
    };

    // --- توابع تورنومنت ---

    const handleTournamentButtonClick = () => {
        if (currentTournament) openTournamentBracketModal();
        else {
            tournamentSetupForm.reset();
            tournamentSetupModal.classList.remove('hidden');
        }
    };
    const closeTournamentSetupModal = () => tournamentSetupModal.classList.add('hidden');
    const openTournamentBracketModal = () => tournamentBracketModal.classList.remove('hidden');
    const closeTournamentBracketModal = () => tournamentBracketModal.classList.add('hidden');
    const handleTournamentSetup = (event) => {
        event.preventDefault();
        const tournamentName = tournamentNameInput.value.trim();
        const playerCount = parseInt(playerCountSelect.value, 10);
        if (!tournamentName) return alert('لطفاً یک نام برای تورنومنت انتخاب کنید.');
        currentTournament = { id: `tour_${Date.now()}`, name: tournamentName, size: playerCount, players: [], rounds: [], isStarted: false, champion: null };
        tournamentModalTitle.textContent = `تورنومنت: ${tournamentName}`;
        renderPlayerRegistrationForm();
        closeTournamentSetupModal();
        openTournamentBracketModal();
    };
    const renderPlayerRegistrationForm = () => {
        let formHTML = `<h3>ثبت نام ${currentTournament.size} بازیکن</h3><form id="player-registration-form"><div class="player-entry-grid">`;
        for (let i = 1; i <= currentTournament.size; i++) {
            formHTML += `<div class="player-entry"><span class="player-number">${i}.</span><input type="text" placeholder="نام بازیکن ${i}" class="player-name-input" required><input type="tel" placeholder="شماره (اختیاری)" class="player-phone-input"></div>`;
        }
        formHTML += `</div><button type="submit" id="start-tournament-button">ثبت نهایی و ساخت براکت</button></form>`;
        tournamentContentArea.innerHTML = formHTML;
        document.getElementById('player-registration-form').addEventListener('submit', handlePlayerRegistration);
    };
    const handlePlayerRegistration = (event) => {
        event.preventDefault();
        const nameInputs = document.querySelectorAll('.player-name-input');
        const phoneInputs = document.querySelectorAll('.player-phone-input');
        const registeredPlayers = [];
        let allNamesValid = true;
        nameInputs.forEach((input, index) => {
            const name = input.value.trim();
            if (!name) allNamesValid = false;
            registeredPlayers.push({ id: `player_${Date.now()}_${index}`, name, phone: phoneInputs[index].value.trim() });
        });
        if (!allNamesValid) return alert('لطفاً نام تمام بازیکنان را وارد کنید.');
        currentTournament.players = registeredPlayers;
        currentTournament.isStarted = true;
        generateBracket();
    };
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    const generateBracket = () => {
        const shuffledPlayers = shuffleArray([...currentTournament.players]);
        const rounds = [];
        let currentRoundPlayers = [...shuffledPlayers];

        while (currentRoundPlayers.length > 1) {
            const matches = [];
            for (let i = 0; i < currentRoundPlayers.length; i += 2) {
                matches.push({ p1: currentRoundPlayers[i], p2: currentRoundPlayers[i + 1], winner: null });
            }
            rounds.push({ matches });
            currentRoundPlayers = Array(matches.length).fill(null);
        }
        currentTournament.rounds = rounds;
        renderBracket();
    };
    const setMatchWinner = (roundIndex, matchIndex, winnerId) => {
        const match = currentTournament.rounds[roundIndex].matches[matchIndex];
        if (match.winner && match.winner.id === winnerId) match.winner = null;
        else match.winner = match.p1.id === winnerId ? match.p1 : match.p2;

        propagateWinners(roundIndex);
        renderBracket();
    };
    const propagateWinners = (currentRoundIndex) => {
        for (let i = currentRoundIndex; i < currentTournament.rounds.length - 1; i++) {
            const currentRound = currentTournament.rounds[i];
            const nextRound = currentTournament.rounds[i + 1];
            for (let j = 0; j < nextRound.matches.length; j++) {
                const p1 = currentRound.matches[j * 2].winner;
                const p2 = currentRound.matches[j * 2 + 1].winner;
                nextRound.matches[j].p1 = p1;
                nextRound.matches[j].p2 = p2;
                if (nextRound.matches[j].winner && (nextRound.matches[j].winner.id !== p1?.id && nextRound.matches[j].winner.id !== p2?.id)) {
                    nextRound.matches[j].winner = null;
                }
            }
        }
        const finalRound = currentTournament.rounds[currentTournament.rounds.length - 1];
        currentTournament.champion = finalRound.matches[0].winner;
    };
    const renderBracket = () => {
        let bracketHTML = `<div id="tournament-controls"><button id="close-current-tournament-btn">بستن تورنومنت فعلی</button></div>`;
        if (currentTournament.champion) {
            bracketHTML += `<div id="champion-announcement"><h2>🏆 قهرمان تورنومنت 🏆</h2><p id="champion-name">${currentTournament.champion.name}</p></div>`;
        }
        const rounds = currentTournament.rounds;
        const totalRounds = rounds.length;
        const midPoint = Math.floor(totalRounds / 2);

        bracketHTML += `<div class="bracket-container"><div class="bracket-body">`;
        bracketHTML += `<div class="bracket-side left">${rounds.slice(0, midPoint).map((r, i) => renderRound(r, i)).join('')}</div>`;
        if (totalRounds > 0) {
            bracketHTML += `<div class="final-round">${renderRound(rounds[midPoint], midPoint)}</div>`;
        }
        bracketHTML += `<div class="bracket-side right">${rounds.slice(midPoint + 1).reverse().map((r, i) => renderRound(r, totalRounds - 1 - i)).join('')}</div>`;
        bracketHTML += `</div></div>`;
        tournamentContentArea.innerHTML = bracketHTML;

        document.getElementById('close-current-tournament-btn').addEventListener('click', () => {
            if (confirm('آیا از بستن کامل تورنومنت فعلی مطمئن هستید؟')) {
                currentTournament = null;
                closeTournamentBracketModal();
            }
        });
        tournamentContentArea.querySelectorAll('.player').forEach(playerEl => {
            playerEl.addEventListener('click', (e) => {
                const matchEl = e.target.closest('.match');
                if (matchEl.classList.contains('locked') || e.target.classList.contains('tbd')) return;
                const roundIndex = parseInt(matchEl.dataset.round, 10);
                const matchIndex = parseInt(matchEl.dataset.match, 10);
                const playerId = e.target.dataset.playerId;
                if (playerId) setMatchWinner(roundIndex, matchIndex, playerId);
            });
        });
    };
    const renderRound = (round, roundIndex) => {
        let roundHTML = `<div class="round">`;
        if (round) {
            round.matches.forEach((match, matchIndex) => {
                const isLocked = (!match.p1 || !match.p2) && !match.winner;
                let p1_class = 'p1', p2_class = 'p2';
                if (match.winner) {
                    if (match.p1) p1_class += match.winner.id === match.p1.id ? ' winner' : ' loser';
                    if (match.p2) p2_class += match.winner.id === match.p2.id ? ' winner' : ' loser';
                }
                if (!match.p1) p1_class += ' tbd';
                if (!match.p2) p2_class += ' tbd';
                roundHTML += `<div class="match ${isLocked ? 'locked' : ''}" data-round="${roundIndex}" data-match="${matchIndex}">
                                <div class="player ${p1_class}" data-player-id="${match.p1 ? match.p1.id : ''}">${match.p1 ? match.p1.name : 'نامشخص'}</div>
                                <div class="player ${p2_class}" data-player-id="${match.p2 ? match.p2.id : ''}">${match.p2 ? match.p2.name : 'نامشخص'}</div>
                            </div>`;
            });
        }
        roundHTML += `</div>`;
        return roundHTML;
    };

    // --- پنل مدیریت   ---
    const openAdminPanel = () => { loadSettingsIntoPanel(); renderReservationsTable(); renderHistory(); adminModal.classList.remove('hidden'); };
    const closeAdminPanel = () => adminModal.classList.add('hidden');
    const renderReservationsTable = () => {
        reservationsListBody.innerHTML = '';
        if (reservations.length === 0) { reservationsListBody.innerHTML = `<tr class="empty-row"><td colspan="4">هیچ رزروی ثبت نشده است.</td></tr>`; return; }
        reservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        reservations.forEach(res => {
            const deviceNames = res.deviceIds.map(id => DEVICES.find(d => d.id === id).name).join(', ');
            const row = document.createElement('tr');
            row.dataset.id = res.id;
            row.innerHTML = `<td>${res.customerName} ${res.phoneNumber ? `(${res.phoneNumber})` : ''}</td><td>${new Date(res.startTime).toLocaleString('fa-IR')}</td><td>${deviceNames}</td><td><button class="cancel-reservation-btn">لغو</button></td>`;
            reservationsListBody.appendChild(row);
        });
    };
    const addProductField = (p = { name: '', price: '' }) => {
        const div = document.createElement('div');
        div.className = 'product-setting-item';
        div.innerHTML = `<input type="text" class="product-name-input" placeholder="نام محصول" value="${p.name}"><input type="number" class="product-price-input" placeholder="قیمت (تومان)" value="${p.price}"><button class="delete-product-btn">❌</button>`;
        productsSettingsContainer.appendChild(div);
        div.querySelector('.delete-product-btn').addEventListener('click', () => div.remove());
    };
    const renderProductsSettings = () => { productsSettingsContainer.innerHTML = ''; settings.PRODUCTS.forEach(p => addProductField(p)); };
    const loadSettingsIntoPanel = () => {
        ratePs5Input.value = settings.RATES.ps5;
        ratePs4Input.value = settings.RATES.ps4;
        ratePcInput.value = settings.RATES.pc;
        rateBilliardInput.value = settings.RATES.billiard;
        rateVrInput.value = settings.RATES.vr;
        extraControllerInput.value = settings.EXTRA_CONTROLLER_COST;
        renderProductsSettings();
    };
    const saveSettings = () => {
        settings.RATES.ps5 = parseInt(ratePs5Input.value, 10) || 0;
        settings.RATES.ps4 = parseInt(ratePs4Input.value, 10) || 0;
        settings.RATES.pc = parseInt(ratePcInput.value, 10) || 0;
        settings.RATES.billiard = parseInt(rateBilliardInput.value, 10) || 0;
        settings.RATES.vr = parseInt(rateVrInput.value, 10) || 0;
        settings.EXTRA_CONTROLLER_COST = parseInt(extraControllerInput.value, 10) || 0;
        const updatedProducts = [];
        document.querySelectorAll('.product-setting-item').forEach(item => {
            const name = item.querySelector('.product-name-input').value.trim();
            const price = parseInt(item.querySelector('.product-price-input').value, 10);
            if (name && !isNaN(price) && price >= 0) updatedProducts.push({ id: `prod_${Date.now()}_${Math.random()}`, name, price });
        });
        settings.PRODUCTS = updatedProducts;
        saveDataToStorage();
        alert('تنظیمات با موفقیت ذخیره شد.');
        closeAdminPanel();
    };
    const renderHistory = () => {
        historyList.innerHTML = '';
        if (history.length === 0) { historyList.innerHTML = `<tr class="empty-row"><td colspan="5">تاریخچه‌ای برای نمایش وجود ندارد.</td></tr>`; totalIncomeEl.textContent = '0 تومان'; return; }
        let totalIncome = 0;
        history.sort((a, b) => new Date(b.checkoutDate) - new Date(a.checkoutDate));
        history.forEach(entry => {
            totalIncome += entry.finalCost;
            const row = document.createElement('tr');
            row.dataset.id = entry.id;
            row.innerHTML = `<td>${entry.customerName}</td><td>${entry.deviceName}</td><td>${entry.finalCost.toLocaleString()} تومان</td><td>${new Date(entry.checkoutDate).toLocaleString('fa-IR')}</td><td><button class="delete-history-btn">❌</button></td>`;
            historyList.appendChild(row);
        });
        totalIncomeEl.textContent = `${totalIncome.toLocaleString()} تومان`;
    };
    const deleteHistoryEntry = (entryId) => {
        if (confirm('آیا از حذف این رکورد مطمئن هستید؟')) {
            history = history.filter(entry => entry.id !== entryId);
            saveDataToStorage();
            renderHistory();
        }
    };
    const clearOldHistory = () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const originalLength = history.length;
        history = history.filter(entry => new Date(entry.checkoutDate) > sevenDaysAgo);
        if (history.length < originalLength) saveDataToStorage();
    };

    const initialize = () => {
        loadDataFromStorage();
        clearOldHistory();
        createDeviceElements();
        updateDisplay();
        setInterval(() => {
            updateTimersAndCosts();
            checkAndActivateReservations();
        }, 1000);

        startButton.addEventListener('click', () => startSession());
        cancelButton.addEventListener('click', resetAndHideForm);
        adminPanelBtn.addEventListener('click', openAdminPanel);
        closeBtn.addEventListener('click', closeAdminPanel);
        saveSettingsBtn.addEventListener('click', saveSettings);
        addProductBtn.addEventListener('click', () => addProductField());
        reservationBtn.addEventListener('click', openReservationModal);
        closeReservationBtn.addEventListener('click', closeReservationModal);
        reservationForm.addEventListener('submit', handleReservationSubmit);
        tournamentBtn.addEventListener('click', handleTournamentButtonClick);
        closeTournamentSetupBtn.addEventListener('click', closeTournamentSetupModal);
        tournamentSetupForm.addEventListener('submit', handleTournamentSetup);
        closeTournamentBracketBtn.addEventListener('click', closeTournamentBracketModal);
        closeAddGameBtn.addEventListener('click', closeAddGameModal);

        window.addEventListener('click', (event) => {
            if (event.target === adminModal) closeAdminPanel();
            if (event.target === reservationModal) closeReservationModal();
            if (event.target === tournamentSetupModal) closeTournamentSetupModal();
            if (event.target === tournamentBracketModal) closeTournamentBracketModal();
            if (event.target === addGameModal) closeAddGameModal();
        });

        sessionsList.addEventListener('click', (event) => {
            const button = event.target.closest('.action-btn');
            const parentRow = event.target.closest('.parent-row');

            if (parentRow && !button) {
                const customerId = parentRow.dataset.customerId;
                parentRow.classList.toggle('open');
                sessionsList.querySelectorAll(`.sub-session-row[data-parent-customer-id="${customerId}"]`).forEach(row => {
                    row.style.display = parentRow.classList.contains('open') ? 'table-row' : 'none';
                });
                return;
            }
            if (!button) return;
            const sessionId = button.dataset.sessionId;
            const customerId = button.dataset.customerId;
            if (button.classList.contains('checkout-btn')) checkoutSession(sessionId);
            if (button.classList.contains('add-item-btn')) addProductToSession(sessionId);
            if (button.classList.contains('pause-btn') || button.classList.contains('resume-btn')) togglePauseSession(sessionId);
            if (button.classList.contains('add-game-btn')) openAddGameModal(customerId);
            if (button.classList.contains('checkout-all-btn')) checkoutCustomer(customerId);
        });

        historyList.addEventListener('click', (event) => {
            const button = event.target.closest('.delete-history-btn');
            if (button) deleteHistoryEntry(event.target.closest('tr').dataset.id);
        });

        reservationsListBody.addEventListener('click', (event) => {
            const button = event.target.closest('.cancel-reservation-btn');
            if (button) cancelReservation(event.target.closest('tr').dataset.id);
        });
    };

    initialize();
});