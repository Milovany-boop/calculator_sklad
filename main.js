(function() {
  const currentUserRaw = sessionStorage.getItem('currentUser');
  if (!currentUserRaw) {
    window.location.href = 'login.html';
    return;
  }
  const currentUser = JSON.parse(currentUserRaw);
  document.getElementById('currentUsername').innerText = currentUser.username;

  const sectionsConfig = [
    { id: 1, defaultTariff: 5.4 },
    { id: 2, defaultTariff: 4.5 }, { id: 3, defaultTariff: 4.5 },
    { id: 4, defaultTariff: 4.5 }, { id: 5, defaultTariff: 4.5 },
    { id: 6, defaultTariff: 9.0 }, { id: 7, defaultTariff: 9.0 },
    { id: 8, defaultTariff: 9.0 }, { id: 9, defaultTariff: 9.0 }
  ];

  let sectionElements = [];
  const sectionsContainer = document.getElementById('sectionsContainer');
  
  const baseBonusInput = document.getElementById('baseShiftBonus');
  const globalContainerTariffInput = document.getElementById('globalContainerTariff');
  const globalPieceTariffInput = document.getElementById('globalPieceTariff');
  
  const containerQty = document.getElementById('containerQty');
  const containerSubtotalSpan = document.getElementById('containerSubtotalDisplay');
  const piecesQty = document.getElementById('piecesQty');
  const piecesSubtotalSpan = document.getElementById('piecesSubtotalDisplay');
  
  const shiftTotalSpan = document.getElementById('shiftTotal');
  const monthTotalSpan = document.getElementById('monthTotal');
  const monthShiftsCountSpan = document.getElementById('monthShiftsCount');

  // Загрузка настроек пользователя
  function loadUserSettings() {
    const users = JSON.parse(localStorage.getItem('warehouse_users')) || [];
    const user = users.find(u => u.username === currentUser.username);
    if (user && user.settings) {
      baseBonusInput.value = user.settings.baseBonus ?? 2800;
      globalContainerTariffInput.value = user.settings.containerTariff ?? 5;
      globalPieceTariffInput.value = user.settings.pieceTariff ?? 0.3;
    } else {
      baseBonusInput.value = 2800;
      globalContainerTariffInput.value = 5;
      globalPieceTariffInput.value = 0.3;
    }
  }

  function saveUserSettings() {
    const users = JSON.parse(localStorage.getItem('warehouse_users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
      if (!users[userIndex].settings) users[userIndex].settings = {};
      users[userIndex].settings.baseBonus = parseFloat(baseBonusInput.value) || 0;
      users[userIndex].settings.containerTariff = parseFloat(globalContainerTariffInput.value) || 0;
      users[userIndex].settings.pieceTariff = parseFloat(globalPieceTariffInput.value) || 0;
      localStorage.setItem('warehouse_users', JSON.stringify(users));
    }
  }

  // Построение секций
  function buildSections() {
    sectionsContainer.innerHTML = '';
    sectionElements = [];
    sectionsConfig.forEach(cfg => {
      const card = document.createElement('div');
      card.className = 'section-card';
      card.innerHTML = `
        <div class="section-title">Секция ${cfg.id}</div>
        <div class="input-group">
          <label>📦 Количество товара (шт)</label>
          <input type="number" class="number-input qty-input" placeholder="" step="1" min="0">
        </div>
        <div class="input-group">
          <label>💰 Тариф (₽ за 1 товар)</label>
          <input type="number" class="tariff-input tariff-input-field" value="${cfg.defaultTariff.toFixed(2)}" step="0.01" min="0">
        </div>
        <div class="section-summary">💵 Сумма за секцию: <span class="section-sum">0.00 ₽</span></div>
      `;
      const qtyInput = card.querySelector('.qty-input');
      const tariffInput = card.querySelector('.tariff-input-field');
      const sumSpan = card.querySelector('.section-sum');
      sectionElements.push({ qtyInput, tariffInput, sumSpan });
      sectionsContainer.appendChild(card);
    });
  }

  // Получить значение из поля (пустое или NaN -> 0)
  function getNumberValue(input) {
    let val = input.value.trim();
    if (val === '') return 0;
    let num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  // Пересчёт
  function recalcCurrentShift() {
    let sectionsTotal = 0;
    for (let sec of sectionElements) {
      let qty = getNumberValue(sec.qtyInput);
      let tariff = parseFloat(sec.tariffInput.value) || 0;
      let sum = qty * tariff;
      sec.sumSpan.innerText = sum.toFixed(2) + ' ₽';
      sectionsTotal += sum;
    }
    
    let containerTariff = parseFloat(globalContainerTariffInput.value) || 0;
    let containerQtyVal = getNumberValue(containerQty);
    let containerSum = containerQtyVal * containerTariff;
    containerSubtotalSpan.innerText = `📦 Тара: ${containerSum.toFixed(2)} ₽ (${containerQtyVal} шт × ${containerTariff.toFixed(2)}₽)`;
    
    let pieceTariff = parseFloat(globalPieceTariffInput.value) || 0;
    let piecesQtyVal = getNumberValue(piecesQty);
    let piecesSum = piecesQtyVal * pieceTariff;
    piecesSubtotalSpan.innerText = `🔧 Штучки: ${piecesSum.toFixed(2)} ₽ (${piecesQtyVal} шт × ${pieceTariff.toFixed(2)}₽)`;
    
    const baseBonus = parseFloat(baseBonusInput.value) || 0;
    const shiftTotal = baseBonus + sectionsTotal + containerSum + piecesSum;
    shiftTotalSpan.innerText = shiftTotal.toFixed(2) + ' ₽';
    return shiftTotal;
  }

  // Получить данные смены для сохранения
  function getCurrentShiftData() {
    const sectionsData = [];
    for (let i = 0; i < sectionElements.length; i++) {
      sectionsData.push({
        qty: getNumberValue(sectionElements[i].qtyInput),
        tariff: parseFloat(sectionElements[i].tariffInput.value) || 0
      });
    }
    return {
      date: new Date().toISOString().slice(0,10),
      sections: sectionsData,
      containerQty: getNumberValue(containerQty),
      containerTariff: parseFloat(globalContainerTariffInput.value) || 0,
      piecesQty: getNumberValue(piecesQty),
      piecesTariff: parseFloat(globalPieceTariffInput.value) || 0,
      baseBonus: parseFloat(baseBonusInput.value) || 0,
      totalSalary: recalcCurrentShift()
    };
  }

  // Очистка формы (все поля количества становятся пустыми)
  function clearForm() {
    for (let sec of sectionElements) {
      sec.qtyInput.value = '';
    }
    containerQty.value = '';
    piecesQty.value = '';
    recalcCurrentShift();
  }

  // Сохранить смену
  function saveCurrentShift() {
    const shiftData = getCurrentShiftData();
    const users = JSON.parse(localStorage.getItem('warehouse_users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex === -1) {
      alert('Ошибка: пользователь не найден');
      return;
    }
    if (!users[userIndex].shifts) users[userIndex].shifts = [];
    users[userIndex].shifts.push(shiftData);
    localStorage.setItem('warehouse_users', JSON.stringify(users));
    alert(`Смена за ${shiftData.date} сохранена! Сумма: ${shiftData.totalSalary.toFixed(2)} ₽`);
    clearForm();
    updateMonthStats();
  }

  // Статистика за месяц
  function updateMonthStats() {
    const users = JSON.parse(localStorage.getItem('warehouse_users')) || [];
    const user = users.find(u => u.username === currentUser.username);
    if (!user || !user.shifts) {
      monthTotalSpan.innerText = '0 ₽';
      monthShiftsCountSpan.innerText = '0';
      return;
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let monthTotal = 0;
    let shiftCount = 0;
    for (let shift of user.shifts) {
      const shiftDate = new Date(shift.date);
      if (shiftDate.getFullYear() === currentYear && shiftDate.getMonth() === currentMonth) {
        monthTotal += shift.totalSalary;
        shiftCount++;
      }
    }
    monthTotalSpan.innerText = monthTotal.toFixed(2) + ' ₽';
    monthShiftsCountSpan.innerText = shiftCount;
  }

  // Обработчики
  function initUIHandlers() {
    containerQty.addEventListener('input', recalcCurrentShift);
    piecesQty.addEventListener('input', recalcCurrentShift);
    baseBonusInput.addEventListener('input', () => { saveUserSettings(); recalcCurrentShift(); });
    globalContainerTariffInput.addEventListener('input', () => { saveUserSettings(); recalcCurrentShift(); });
    globalPieceTariffInput.addEventListener('input', () => { saveUserSettings(); recalcCurrentShift(); });
    document.getElementById('saveShiftBtn').addEventListener('click', saveCurrentShift);
    document.getElementById('newShiftBtn').addEventListener('click', clearForm);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }

  function bindSectionEvents() {
    for (let sec of sectionElements) {
      sec.qtyInput.addEventListener('input', recalcCurrentShift);
      sec.tariffInput.addEventListener('input', recalcCurrentShift);
    }
  }

  function init() {
    buildSections();
    bindSectionEvents();
    loadUserSettings();
    initUIHandlers();
    clearForm();
    recalcCurrentShift();
    updateMonthStats();
  }
  init();
})();