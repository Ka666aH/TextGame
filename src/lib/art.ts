/**
 * Визуальный слой сущностей. Пока это монограмма — первая буква названия.
 *
 * Единственное место, где сущность превращается в «картинку». Когда появятся
 * спрайты, изменится только этот файл и `EntityArt`, а не экраны: они передают
 * смысловые `kind`/`name`, а не готовое изображение.
 */

export type ArtKind = 'room' | 'enemy' | 'item' | 'player'

/** Первая буква названия в верхнем регистре. Пустое имя — «?». */
export function monogram(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'

  const first = trimmed.charAt(0)
  return first.toLocaleUpperCase('ru-RU')
}
