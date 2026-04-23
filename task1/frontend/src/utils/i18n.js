// Display translations for default category names stored in English in DB
export const CAT_NAMES = {
  en: {
    'Fuel': 'Fuel', 'Tolls': 'Tolls', 'Customs': 'Customs',
    'Driver Salary': 'Driver Salary', 'Vehicle Maintenance': 'Vehicle Maintenance',
    'Warehouse': 'Warehouse', 'Delivery Costs': 'Delivery Costs',
    'Client Payment': 'Client Payment', 'Delivery Revenue': 'Delivery Revenue',
    'Contract Payment': 'Contract Payment',
  },
  ru: {
    'Fuel': 'Топливо', 'Tolls': 'Сборы', 'Customs': 'Таможня',
    'Driver Salary': 'Зарплата водителя', 'Vehicle Maintenance': 'Обслуживание ТС',
    'Warehouse': 'Склад', 'Delivery Costs': 'Расходы на доставку',
    'Client Payment': 'Оплата клиента', 'Delivery Revenue': 'Доход от доставки',
    'Contract Payment': 'Оплата по контракту',
  },
  uz: {
    'Fuel': "Yoqilg'i", 'Tolls': "To'lovlar", 'Customs': 'Bojxona',
    'Driver Salary': 'Haydovchi maoshi', 'Vehicle Maintenance': 'Transport texxizmati',
    'Warehouse': 'Ombor', 'Delivery Costs': 'Yetkazib berish xarajatlari',
    'Client Payment': "Mijoz to'lovi", 'Delivery Revenue': 'Yetkazib berish daromadi',
    'Contract Payment': "Shartnoma to'lovi",
  },
}

// Helper: translate a category name, fallback to original
export const catName = (name, lang) => CAT_NAMES[lang]?.[name] || name

export const T = {
  en: {
    // nav
    overview: 'Overview', transactions: 'Transactions', analytics: 'Analytics', categories: 'Categories',
    // overview
    incomeMonth: 'Income this month', expensesMonth: 'Expenses this month',
    netCash: 'Net cash', todayExp: "Today's expenses",
    recentTx: 'Recent Transactions', addTx: '+ Add transaction', topCat: 'Top',
    // transactions
    addBtn: '+ Add', searchPlaceholder: 'Search note or category…',
    allTypes: 'All types', allCats: 'All categories', allSources: 'All sources',
    minAmt: 'Min amount', maxAmt: 'Max amount',
    needsReview: 'Needs review', clearFilters: 'Clear',
    // table headers
    date: 'Date', type: 'Type', category: 'Category',
    amount: 'Amount', note: 'Note', source: 'Source', status: 'Status',
    // badges
    income: 'Income', expense: 'Expense', bot: 'Bot', web: 'Web', review: '⚠ Review',
    // modal
    addTransaction: 'Add Transaction', editTransaction: 'Edit Transaction',
    save: 'Save', update: 'Update', cancel: 'Cancel', saving: 'Saving…',
    markReviewed: 'Mark reviewed',
    // analytics
    expByCat: 'Expenses by Category', incVsExp: 'Income vs Expenses',
    totalIncome: 'Total Income', totalExpenses: 'Total Expenses', net: 'Net',
    thisMonth: 'This month', last3: 'Last 3 months', last6: 'Last 6 months', allTime: 'All time',
    noData: 'No data for this period.',
    // categories
    expenseCats: 'Expense Categories', incomeCats: 'Income Categories',
    addCat: 'Add', newExpCat: 'New expense category…', newIncCat: 'New income category…',
    defaultBadge: 'default', noCats: 'No categories yet.',
    // empty
    noTxMatch: 'No transactions match your filters.',
    // rate
    liveRate: '1 USD =', fallbackRate: '(fallback)',
  },
  ru: {
    overview: 'Обзор', transactions: 'Транзакции', analytics: 'Аналитика', categories: 'Категории',
    incomeMonth: 'Доход за месяц', expensesMonth: 'Расходы за месяц',
    netCash: 'Чистая прибыль', todayExp: 'Расходы сегодня',
    recentTx: 'Последние транзакции', addTx: '+ Добавить', topCat: 'Топ',
    addBtn: '+ Добавить', searchPlaceholder: 'Поиск по примечанию или категории…',
    allTypes: 'Все типы', allCats: 'Все категории', allSources: 'Все источники',
    minAmt: 'Мин. сумма', maxAmt: 'Макс. сумма',
    needsReview: 'Требуют проверки', clearFilters: 'Очистить',
    date: 'Дата', type: 'Тип', category: 'Категория',
    amount: 'Сумма', note: 'Примечание', source: 'Источник', status: 'Статус',
    income: 'Доход', expense: 'Расход', bot: 'Бот', web: 'Веб', review: '⚠ Проверка',
    addTransaction: 'Добавить транзакцию', editTransaction: 'Редактировать транзакцию',
    save: 'Сохранить', update: 'Обновить', cancel: 'Отмена', saving: 'Сохранение…',
    markReviewed: 'Отметить проверенным',
    expByCat: 'Расходы по категориям', incVsExp: 'Доходы и Расходы',
    totalIncome: 'Всего доходов', totalExpenses: 'Всего расходов', net: 'Чистая прибыль',
    thisMonth: 'Этот месяц', last3: 'Последние 3 месяца', last6: 'Последние 6 месяцев', allTime: 'За всё время',
    noData: 'Нет данных за этот период.',
    expenseCats: 'Категории расходов', incomeCats: 'Категории доходов',
    addCat: 'Добавить', newExpCat: 'Новая категория расходов…', newIncCat: 'Новая категория доходов…',
    defaultBadge: 'по умолч.', noCats: 'Нет категорий.',
    noTxMatch: 'Транзакций по фильтру не найдено.',
    liveRate: '1 USD =', fallbackRate: '(резервный)',
  },
  uz: {
    overview: "Umumiy ko'rinish", transactions: 'Tranzaksiyalar', analytics: 'Tahlil', categories: 'Kategoriyalar',
    incomeMonth: 'Bu oylik daromad', expensesMonth: 'Bu oylik xarajatlar',
    netCash: 'Sof foyda', todayExp: 'Bugungi xarajatlar',
    recentTx: 'Oxirgi tranzaksiyalar', addTx: "+ Qo'shish", topCat: 'Top',
    addBtn: "+ Qo'shish", searchPlaceholder: "Izoh yoki kategoriya bo'yicha qidirish…",
    allTypes: 'Barcha turlar', allCats: 'Barcha kategoriyalar', allSources: 'Barcha manbalar',
    minAmt: 'Min miqdor', maxAmt: 'Max miqdor',
    needsReview: 'Tekshirish kerak', clearFilters: 'Tozalash',
    date: 'Sana', type: 'Tur', category: 'Kategoriya',
    amount: 'Miqdor', note: 'Izoh', source: 'Manba', status: 'Holat',
    income: 'Daromad', expense: 'Xarajat', bot: 'Bot', web: 'Veb', review: '⚠ Tekshirish',
    addTransaction: "Tranzaksiya qo'shish", editTransaction: 'Tranzaksiyani tahrirlash',
    save: 'Saqlash', update: 'Yangilash', cancel: 'Bekor qilish', saving: 'Saqlanmoqda…',
    markReviewed: "Tekshirilgan deb belgilash",
    expByCat: "Kategoriyalar bo'yicha xarajatlar", incVsExp: 'Daromad va Xarajatlar',
    totalIncome: 'Jami daromad', totalExpenses: 'Jami xarajatlar', net: 'Sof foyda',
    thisMonth: 'Bu oy', last3: 'Oxirgi 3 oy', last6: 'Oxirgi 6 oy', allTime: 'Hamma vaqt',
    noData: 'Bu davr uchun ma\'lumot yo\'q.',
    expenseCats: 'Xarajat kategoriyalari', incomeCats: 'Daromad kategoriyalari',
    addCat: "Qo'shish", newExpCat: 'Yangi xarajat kategoriyasi…', newIncCat: 'Yangi daromad kategoriyasi…',
    defaultBadge: 'standart', noCats: 'Kategoriyalar yo\'q.',
    noTxMatch: 'Filtr bo\'yicha tranzaksiyalar topilmadi.',
    liveRate: '1 USD =', fallbackRate: '(zahira)',
  },
}
