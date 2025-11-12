/**
 * Декодирует имя файла из строки
 * Поддерживает URL-декодирование и обработку кракозябр
 * 
 * Проблема: когда UTF-8 текст неправильно интерпретируется как Latin-1,
 * он может выглядеть как кракозябры (например, "тест" -> "Ñ‚ÐµÑÑ‚")
 */
export function decodeFilename(filename: string): string {
  if (!filename) {
    return filename;
  }

  try {
    // Шаг 1: Проверяем, содержит ли имя файла кириллицу
    // Если содержит, скорее всего оно уже правильно закодировано
    const containsCyrillic = /[\u0400-\u04FF]/.test(filename);
    if (containsCyrillic) {
      // Если имя файла уже содержит кириллицу, оно, вероятно, правильно закодировано
      return filename;
    }

    // Шаг 2: Пробуем URL-декодирование (на случай, если имя файла было URL-закодировано)
    try {
      const urlDecoded = decodeURIComponent(filename);
      if (urlDecoded !== filename && /[\u0400-\u04FF]/.test(urlDecoded)) {
        return urlDecoded;
      }
    } catch {
      // Если декодирование не удалось, продолжаем
    }

    // Шаг 3: Пробуем исправить кракозябры
    // Если имя файла не содержит кириллицу, но содержит странные символы,
    // попробуем интерпретировать его как Latin-1 и конвертировать в UTF-8
    try {
      // Интерпретируем строку как Latin-1 (каждый байт = один символ)
      // и конвертируем в UTF-8
      const buffer = Buffer.from(filename, 'latin1');
      const utf8Name = buffer.toString('utf8');
      
      // Если результат содержит кириллицу, используем его
      if (/[\u0400-\u04FF]/.test(utf8Name)) {
        return utf8Name;
      }
      
      // Также проверяем, содержит ли результат больше "нормальных" символов
      // (буквы, цифры, пробелы, точки, дефисы и т.д.)
      const originalNormalChars = (filename.match(/[\w\s.\-()]/g) || []).length;
      const decodedNormalChars = (utf8Name.match(/[\w\s.\-()]/g) || []).length;
      
      // Если декодированное имя содержит больше нормальных символов,
      // и не содержит кракозябр (много последовательных не-ASCII символов),
      // используем его
      if (decodedNormalChars > originalNormalChars && !/[\u0080-\u00FF]{3,}/.test(utf8Name)) {
        return utf8Name;
      }
    } catch {
      // Игнорируем ошибки
    }

    // Если ничего не помогло, возвращаем оригинальное имя
    return filename;
  } catch (error) {
    console.warn('Failed to decode filename:', filename, error);
    return filename;
  }
}

/**
 * Декодирует имя файла из заголовка Content-Disposition полностью
 */
export function decodeFilenameFromHeader(dispositionHeader: string | undefined): string | null {
  if (!dispositionHeader) {
    return null;
  }

  try {
    // Ищем filename*=UTF-8''encoded (RFC 5987, приоритет)
    const rfc5987Match = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
    if (rfc5987Match) {
      return decodeURIComponent(rfc5987Match[1]);
    }

    // Ищем filename*=charset'lang'encoded
    const charsetMatch = dispositionHeader.match(/filename\*=([^']+)'([^']*)'([^;]+)/i);
    if (charsetMatch) {
      const charset = charsetMatch[1].toUpperCase();
      const encoded = charsetMatch[3];
      if (charset === 'UTF-8' || charset === 'UTF8') {
        return decodeURIComponent(encoded);
      }
    }

    // Ищем обычный filename="value" или filename=value
    const filenameMatch = dispositionHeader.match(/filename=([^;]+)/i);
    if (filenameMatch) {
      let filename = filenameMatch[1].trim();
      // Убираем кавычки
      filename = filename.replace(/^["']|["']$/g, '');
      // Декодируем URL-кодирование если есть
      return decodeFilename(filename);
    }

    return null;
  } catch (error) {
    console.warn('Failed to decode filename from header:', dispositionHeader, error);
    return null;
  }
}

