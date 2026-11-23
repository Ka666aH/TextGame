/**
 * Авторы иконок. Источник — `notes/icons-authors.md`: иконки собраны с двух
 * сайтов, и оба требуют указания автора.
 *
 * Файл — единственное место, где этот список живёт: страница `/credits`
 * рисует его, а README ссылается на страницу. Если добавится иконка от нового
 * автора, правится только здесь — иначе подпись тихо разойдётся с картинками.
 */

export interface CreditsAuthor {
  name: string
  url: string
}

/** game-icons.net, лицензия CC BY 3.0: авторов перечисляют поимённо. */
export const GAME_ICONS_AUTHORS: readonly CreditsAuthor[] = [
  { name: 'Delapouite', url: 'https://delapouite.com' },
  { name: 'Lorc', url: 'https://lorcblog.blogspot.com' },
  { name: 'Willdabeast', url: 'https://wjbstories.blogspot.com' },
]

/**
 * Flaticon, бесплатная лицензия: подпись «Icons made by <автор> from
 * www.flaticon.com». Ссылку на автора Flaticon требует сохранять, поэтому
 * она хранится рядом с именем.
 */
export const FLATICON_AUTHORS: readonly CreditsAuthor[] = [
  { name: 'madness', url: 'https://www.flaticon.com/authors/madness' },
  { name: 'Maximka', url: 'https://www.flaticon.com/authors/maximka' },
  { name: 'Azland Studio', url: 'https://www.flaticon.com/authors/azland-studio' },
  { name: 'meaicon', url: 'https://www.flaticon.com/authors/meaicon' },
  { name: 'Slidicon', url: 'https://www.flaticon.com/authors/slidicon' },
]
