(function() {
  // Фиксированный оклад
  const BASE_SALARY = 45000;

  // Конфигурация секций: id, начальный тариф согласно условию
  // 1 секция -> 5.4, 2-5 -> 4.5, 6-9 -> 9
  const sectionsConfig = [
    { id: 1, defaultTariff: 5.4 },
    { id: 2, defaultTariff: 4.5 },
    { id: 3, defaultTariff: 4.5 },
    { id: 4, defaultTariff: 4.5 },
    { id: 5, defaultTariff: 4.5 },
    { id: 6, defaultTariff: 9.0 },
    { id: 7, defaultTariff: 9.0 },
    { id: 8, defaultTariff: 9.0 },
    { id: 9, defaultTariff: 9.0 }
  ];

  // DOM элементы
  const sectionsContainer = document.getElementById('sectionsContainer');
  const containerCheckbox = document.getElementById('containerCheckbox');
  const containerQtyInput = document.getElementById('containerQty');
  const containerTariffInput = document.getElementById('containerTariff');
  const containerControlsDiv = document.getElementById('containerControls');
  const containerSubtotalSpan = document.getElementById('containerSubtotalDisplay');
  const grandTotalSpan = document.getElementById('grandTotal');
  const resetBtn = document.getElementById('resetQuantities');

  // Хранилище ссылок на элементы секций для оптимизации
  let sectionElements = []; // каждый элемент: { qtyInput, tariffInput, sumSpan }

  // Функция для отображения суммы тары
  function updateContainerSubtotal() {
    const isChecked = containerCheckbox.checked;
    if (!isChecked) {
      containerSubtotalSpan.innerText = '➕ Тара: 0 ₽ (не отмечена)';
      return;
    }
    let qty = parseFloat(containerQtyInput.value);
    if (isNaN(qty) || qty < 0) qty = 0;
    let tariff = parseFloat(containerTariffInput.value);
    if (isNaN(tariff) || tariff < 0) tariff = 0;
    const containerSum = qty * tariff;
    containerSubtotalSpan.innerText = `📦 Тара: ${containerSum.toFixed(2)} ₽ (${qty} шт × ${tariff.toFixed(2)}₽)`;
  }

  // Функция пересчёта общей зарплаты и сумм по каждой секции
  function recalcAll() {
    let totalSections = 0;
    
    // Обновляем сумму по каждой секции и накапливаем общую
    for (let i = 0; i < sectionElements.length; i++) {
      const sec = sectionElements[i];
      let qty = parseFloat(sec.qtyInput.value);
      if (isNaN(qty) || qty < 0) qty = 0;
      let tariff = parseFloat(sec.tariffInput.value);
      if (isNaN(tariff) || tariff < 0) tariff = 0;
      const sectionSum = qty * tariff;
      sec.sumSpan.innerText = `${sectionSum.toFixed(2)} ₽`;
      totalSections += sectionSum;
    }
    
    // Расчёт тары
    let containerTotal = 0;
    if (containerCheckbox.checked) {
      let qty = parseFloat(containerQtyInput.value);
      if (isNaN(qty) || qty < 0) qty = 0;
      let tariff = parseFloat(containerTariffInput.value);
      if (isNaN(tariff) || tariff < 0) tariff = 0;
      containerTotal = qty * tariff;
    }
    
    // Итог = оклад + сдельная часть + тара
    const finalSalary = BASE_SALARY + totalSections + containerTotal;
    grandTotalSpan.innerText = `${finalSalary.toFixed(2)} ₽`;
    
    // Обновляем отображение тары (для информации)
    updateContainerSubtotal();
  }
  
  // Генерация всех секций на основе конфигурации
  function buildSections() {
    sectionsContainer.innerHTML = '';
    sectionElements = [];
    
    sectionsConfig.forEach((cfg) => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'section-card';
      
      // Заголовок секции
      const title = document.createElement('div');
      title.className = 'section-title';
      title.innerText = `Секция ${cfg.id}`;
      
      // Поле количества
      const qtyGroup = document.createElement('div');
      qtyGroup.className = 'input-group';
      const qtyLabel = document.createElement('label');
      qtyLabel.innerText = '📦 Количество товара (шт)';
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.value = '0';
      qtyInput.min = '0';
      qtyInput.step = '1';
      qtyInput.className = 'number-input';
      qtyGroup.appendChild(qtyLabel);
      qtyGroup.appendChild(qtyInput);
      
      // Поле тарифа (редактируемое)
      const tariffGroup = document.createElement('div');
      tariffGroup.className = 'input-group';
      const tariffLabel = document.createElement('label');
      tariffLabel.innerText = '💰 Тариф (₽ за 1 товар)';
      const tariffInput = document.createElement('input');
      tariffInput.type = 'number';
      tariffInput.value = cfg.defaultTariff.toFixed(2);
      tariffInput.step = '0.01';
      tariffInput.min = '0';
      tariffInput.className = 'tariff-input';
      tariffGroup.appendChild(tariffLabel);
      tariffGroup.appendChild(tariffInput);
      
      // Блок суммы по секции
      const sumBlock = document.createElement('div');
      sumBlock.className = 'section-summary';
      const sumSpan = document.createElement('span');
      sumSpan.innerText = '0.00 ₽';
      sumBlock.innerHTML = '💵 Сумма за секцию: ';
      sumBlock.appendChild(sumSpan);
      
      sectionDiv.appendChild(title);
      sectionDiv.appendChild(qtyGroup);
      sectionDiv.appendChild(tariffGroup);
      sectionDiv.appendChild(sumBlock);
      
      sectionsContainer.appendChild(sectionDiv);
      
      // Сохраняем ссылки
      sectionElements.push({
        qtyInput: qtyInput,
        tariffInput: tariffInput,
        sumSpan: sumSpan
      });
      
      // Навешиваем события на каждое поле секции
      qtyInput.addEventListener('input', recalcAll);
      tariffInput.addEventListener('input', recalcAll);
    });
  }
  
  // Управление видимостью контролов тары + событие чекбокса
  function initContainerHandlers() {
    // При изменении чекбокса показываем/скрываем блок с количеством и тарифом
    const containerControls = document.getElementById('containerControls');
    
    function toggleContainerControls() {
      const isChecked = containerCheckbox.checked;
      if (isChecked) {
        containerControls.classList.remove('hidden');
        // если блок появляется, сразу делаем пересчёт
      } else {
        containerControls.classList.add('hidden');
      }
      recalcAll(); // пересчёт, потому что меняется условие учёта тары
    }
    
    containerCheckbox.addEventListener('change', toggleContainerControls);
    containerQtyInput.addEventListener('input', recalcAll);
    containerTariffInput.addEventListener('input', recalcAll);
    
    // дополнительно при загрузке установить начальное состояние (чекбокс выключен)
    containerCheckbox.checked = false;
    containerControls.classList.add('hidden');
    containerQtyInput.value = '0';
    containerTariffInput.value = '0.30';
    recalcAll();
  }
  
  // Сброс КОЛИЧЕСТВА товара во всех секциях и сброс тары (галочку снимаем, количество тары обнуляем)
  function resetQuantitiesOnly() {
    // 1. Обнуляем количество в каждой секции
    for (let i = 0; i < sectionElements.length; i++) {
      sectionElements[i].qtyInput.value = '0';
    }
    // 2. Сброс тары: снимаем галочку, обнуляем количество тары, обновляем интерфейс
    containerCheckbox.checked = false;
    containerQtyInput.value = '0';
    const containerControls = document.getElementById('containerControls');
    if (containerControls) containerControls.classList.add('hidden');
    
    // после сброса пересчитываем всё
    recalcAll();
  }
  
  // Инициализация кнопки сброса
  function initResetButton() {
    if (resetBtn) {
      resetBtn.addEventListener('click', resetQuantitiesOnly);
    }
  }
  
  // Старт приложения
  function init() {
    buildSections();
    initContainerHandlers();
    initResetButton();
    recalcAll(); // первичный расчёт (все нули, но оклад отображается)
    // дополнительно отслеживаем изменения в секциях уже настроены через recalcAll
  }
  
  init();
})();