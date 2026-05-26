(function() {
  // Проверка авторизации
  const currentUserRaw = sessionStorage.getItem('currentUser');
  if (!currentUserRaw) {
    window.location.href = 'login.html';
    return;
  }
  const currentUser = JSON.parse(currentUserRaw);
  document.getElementById('currentUsername').innerText = currentUser.username;

  // Конфигурация секций (тарифы по умолчанию)
  const sectionsConfig = [
    { id: 1, defaultTariff: 5.4 },
    { id: 2, defaultTariff: 4.5 }, { id: 3, defaultTariff: 4.5 },
    { id: 4, defaultTariff: 4.5 }, { id: 5, defaultTariff: 4.5 },
    { id: 6, defaultTariff: 9.0 }, { id: 7, defaultTariff: 9.0 },
    { id: 8, defaultTariff: 9.0 }, { id: 9, defaultTariff: 9.0 }
  ];

  // Глобальные ссылки
  let sectionElements = [];
  const BASE_SALARY = 45000;
  const sectionsContainer = document.getElementById('sectionsContainer');
  const containerCheckbox = document.getElementById('containerCheckbox');
  const containerQty = document.getElementById('containerQty');
  const containerTariff = document.getElementById('containerTariff');
  const containerControls = document.getElementById('containerControls');
  const containerSubtotalSpan = document.getElementById('containerSubtotalDisplay');
  const shiftTotalSpan = document.getElementById('shiftTotal');
  const monthTotalSpan = document.getElementById('monthTotal');
  const monthShiftsCountSpan = document.getElementById('monthShiftsCount');

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
          <input type="number" class="number-input qty-input" value="0" min="0" step="1">
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

  // Пересчёт суммы текущей смены и обновление интерфейса
  function recalcCurrentShift() {
    let sectionsTotal = 0;
    for (let sec of sectionElements) {
      let qty = parseFloat(sec.qtyInput.value) || 0;
      let tariff = parseFloat(sec.tariffInput.value) || 0;
      let sum = qty * tariff;
      sec.sumSpan.innerText = sum.toFixed(2) + ' ₽';
      sectionsTotal += sum;
    }
    let containerSum = 0;
    if (containerCheckbox.checked) {
      let qty = parseFloat(containerQty.value) || 0;
      let tariff = parseFloat(containerTariff.value) || 0;
      containerSum = qty * tariff;
      containerSubtotalSpan.innerText = `📦 Тара: ${containerSum.toFixed(2)} ₽ (${qty} шт × ${tariff.toFixed(2)}₽)`;
    } else {
      containerSubtotalSpan.innerText = '➕ Тара: 0 ₽ (не отмечена)';
    }
    const shiftTotal = BASE_SALARY + sectionsTotal + containerSum;
    shiftTotalSpan.innerText = shiftTotal.toFixed(2) + ' ₽';
    return shiftTotal;
  }

  // Получить данные текущей формы (для сохранения)
  function getCurrentShiftData() {
    const sectionsData = [];
    for (let i = 0; i < sectionElements.length; i++) {
      sectionsData.push({
        qty: parseFloat(sectionElements[i].qtyInput.value) || 0,
        tariff: parseFloat(sectionElements[i].tariffInput.value) || 0
      });
    }
    return {
      date: new Date().toISOString().slice(0,10), // 2026-05-26
      sections: sectionsData,
      container: {
        checked: containerCheckbox.checked,
        qty: parseFloat(containerQty.value) || 0,
        tariff: parseFloat(containerTariff.value) || 0
      },
      totalSalary: recalcCurrentShift()
    };
  }

  // Очистка формы для новой смены (без сохранения)
  function clearForm() {
    for (let sec of sectionElements) {
      sec.qtyInput.value = '0';
      // тарифы не сбрасываем, оставляем те, что пользователь настроил
    }
    containerCheckbox.checked = false;
    containerQty.value = '0';
    containerTariff.value = '0.30';
    containerControls.classList.add('hidden');
    recalcCurrentShift();
  }

  // Сохранить текущую смену в историю пользователя
  function saveCurrentShift() {
    const shiftData = getCurrentShiftData();
    // получаем пользователей
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
    clearForm();          // после сохранения очищаем для следующей смены
    updateMonthStats();   // обновить статистику месяца
  }

  // Обновление статистики за текущий месяц
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
    const currentMonth = now.getMonth(); // 0-11
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

  // Контроллер тары
  function initContainer() {
    containerCheckbox.addEventListener('change', () => {
      if (containerCheckbox.checked) {
        containerControls.classList.remove('hidden');
      } else {
        containerControls.classList.add('hidden');
      }
      recalcCurrentShift();
    });
    containerQty.addEventListener('input', recalcCurrentShift);
    containerTariff.addEventListener('input', recalcCurrentShift);
    containerControls.classList.add('hidden');
  }

  // Кнопки
  function initButtons() {
    document.getElementById('saveShiftBtn').addEventListener('click', saveCurrentShift);
    document.getElementById('newShiftBtn').addEventListener('click', clearForm);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }

  // Подписка на изменения в секциях
  function bindSectionEvents() {
    for (let sec of sectionElements) {
      sec.qtyInput.addEventListener('input', recalcCurrentShift);
      sec.tariffInput.addEventListener('input', recalcCurrentShift);
    }
  }

  // Инициализация
  function init() {
    buildSections();
    bindSectionEvents();
    initContainer();
    initButtons();
    recalcCurrentShift();
    updateMonthStats();
  }
  init();
})();