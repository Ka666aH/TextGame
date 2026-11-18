/**
 * Русские константы бэкенда. Единственное место, где они встречаются.
 *
 * Сервер не передаёт ни вид комнаты, ни вид предмета, ни признак исхода игры.
 * Всё это выводится из этих строк, поэтому они обязаны совпадать с
 * `Domain/GameText/*.cs` байт в байт. Юнит-тесты проверяют каждое имя.
 */

export const ROOM_NAMES = {
  start: 'СТАРТОВАЯ КОМНАТА',
  small: 'МАЛЕНЬКАЯ КОМНАТА',
  big: 'БОЛЬШАЯ КОМНАТА',
  empty: 'ПУСТАЯ КОМНАТА',
  shop: 'МАГАЗИН',
  exit: 'ВЫХОД',
} as const

export const ITEM_NAMES = {
  chest: 'СУНДУК',
  deadMimic: 'МЁРТВЫЙ МИМИК',
  key: 'КЛЮЧ',
  map: 'КАРТА',
  coins: 'МЕШОЧЕК С МОНЕТАМИ',

  bandage: 'ПОВЯЗКА',
  powerPotion: 'ЗЕЛЬЕ СИЛЫ',
  regenPotion: 'ЗЕЛЬЕ РЕГЕНЕРАЦИИ',
  unknownPotion: 'НЕИЗВЕСТНОЕ ЗЕЛЬЕ',

  fists: 'КУЛАКИ',
  magicWand: 'ВОЛШЕБНЫЙ ЖЕЗЛ',
  randomWand: 'ЖЕЗЛ СЛУЧАЙНОСТЕЙ',
  rustSword: 'РЖАВЫЙ МЕЧ',
  ironSword: 'ЖЕЛЕЗНЫЙ МЕЧ',
  silverSword: 'СЕРЕБРЯНЫЙ МЕЧ',
  glassSword: 'СТЕКЛЯННЫЙ МЕЧ',

  woodenBucket: 'ДЕРЕВЯНОЕ ВЕДРО',
  leatherHelm: 'КОЖАНЫЙ ШЛЕМ',
  ironHelm: 'ЖЕЛЕЗНЫЙ ШЛЕМ',
  leatherVest: 'КОЖАНАЯ КУРТКА',
  ironCuirass: 'ЖЕЛЕЗНАЯ КИРАСА',
} as const

/** Шлемы. Только по имени: по полям шлем и нагрудник неразличимы. */
export const HELM_NAMES: readonly string[] = [
  ITEM_NAMES.woodenBucket,
  ITEM_NAMES.leatherHelm,
  ITEM_NAMES.ironHelm,
]

/** Нагрудники. Только по имени. */
export const CHESTPLATE_NAMES: readonly string[] = [ITEM_NAMES.leatherVest, ITEM_NAMES.ironCuirass]

/** Кто бьёт. Используется для раскраски журнала боя, не для логики. */
export const PLAYER_NAME = 'ИГРОК'

/** Имя цели в журнале боя при ударе по обычному сундуку. */
export const CHEST_TARGET_NAME = 'СУНДУК'

export const SAVE_NAMES = {
  initial: 'НАЧАЛЬНОЕ СОХРАНЕНИЕ',
  manualPrefix: 'РУЧНОЕ СОХРАНЕНИЕ ОТ ',
  autoPrefix: 'АВТОСОХРАНЕНИЕ ОТ ',
} as const

export const DEFAULT_SESSION_NAME = 'НОВАЯ ИГРА'

/**
 * Ограничение БД на имя сессии и сохранения. Валидатора на сервере нет,
 * поэтому длиннее — это `500`, а не `400`. Режем на клиенте.
 */
export const MAX_NAME_LENGTH = 100

/** Минимальная и максимальная длина логина — проверяется на сервере. */
export const LOGIN_MIN_LENGTH = 3
export const LOGIN_MAX_LENGTH = 100
