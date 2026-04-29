# RC Playable v3 — Restaurant Challenge

Playable-реклама ресторана (single-file HTML, inline-сборка через `PlayableAdsBuilder` + webpack).

## Команды

```bash
npm install          # Установить зависимости (junctions к ./vendor/*)
npm run build        # Собрать index.html (production, single-file inline)
npm start            # Dev-сервер с hot reload
```

Итоговый `index.html` появляется в корне проекта (~6.5 MB, всё инлайн).

## Структура

```
src/
  js/                 # Игровая логика (PixiJS + PlayableAdsEngine)
    config.js         # Главный конфиг сцены и UI
    const.js          # Константы / linkID объектов
    objects/          # PlayableController и пр.
    displayObjects/
      location/       # Кухня, ингредиенты, готовые блюда
        food/         # Cola, Cucumbers, Dish, Fries, Meat, Sause, Tomatoes, Tortilla
      characters/     # Покупатели
      ui/             # Tooltip, CoinsEmitter, Timer
  img/, sounds/, spine/, spritesheets/   # Ассеты
vendor/
  PlayableAdsBuilder/  # Webpack-обёртка для сборки плейблов
  PlayableAdsEngine/   # Pixi-движок: контейнеры, триггеры, кнопки
buildSettings.js       # Какие пакеты/ассеты включить в сборку
ТЗ.docx                # Тех.задание хакатона
```

## Текущая задача (из ТЗ)

Цель — приблизить плейбл к настоящей игре. Кратко:

- **Экономика:** добавить цены ингредиентов (Лепёшка 3, Мясо 5, Помидоры 2, Картошка 3, Огурец 4, Сок 5).
- **UI-счётчики:** монеты (сумма за обслуженных клиентов), покупатели, всё адаптивно.
- **Логика клиентов:** 20 на уровень, до 3 одновременно, у каждого 1 или 3 заказа (рандом).
- **Переход в Store:** кнопка Install + tap по последнему заказу.
- **Smart Cooking:** нельзя готовить блюдо, которое сейчас никому не нужно.
- **Hint/Tutorial:** палец-стрелка указывает кратчайший путь к правильному действию при ошибке.
