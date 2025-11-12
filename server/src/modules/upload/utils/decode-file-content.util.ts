import * as iconv from 'iconv-lite';

/**
 * Декодирует содержимое файла с автоматическим определением кодировки
 * Поддерживает UTF-8, Windows-1251 (CP1251) и другие кодировки
 * 
 * Алгоритм:
 * 1. Пробует декодировать как UTF-8
 * 2. Если UTF-8 не содержит кириллицу, пробует Windows-1251 (часто используется в Windows)
 * 3. Если Windows-1251 не помог, пробует другие кодировки (cp866, koi8-r, iso-8859-5)
 * 4. В крайнем случае возвращает UTF-8 результат
 */
export function decodeFileContent(buffer: Buffer): string {
  try {
    // Шаг 1: Пробуем декодировать как UTF-8
    const utf8Content = buffer.toString('utf-8');
    
    // Проверяем, содержит ли UTF-8 результат кириллицу
    const hasCyrillicInUtf8 = /[\u0400-\u04FF]/.test(utf8Content);
    const hasReplacementChars = utf8Content.includes('\uFFFD');
    
    // Если UTF-8 содержит кириллицу и не содержит заменяющих символов,
    // считаем что это правильная кодировка
    if (hasCyrillicInUtf8 && !hasReplacementChars) {
      return utf8Content;
    }
    
    // Шаг 2: Если UTF-8 не содержит кириллицу или содержит заменяющие символы,
    // возможно файл в другой кодировке (например, Windows-1251)
    // Windows-1251 часто используется для русского текста в Windows
    // Всегда пробуем Windows-1251, если UTF-8 не дал кириллицу
    if (!hasCyrillicInUtf8 || hasReplacementChars) {
      try {
        const win1251Content = iconv.decode(buffer, 'win1251');
        const hasCyrillicInWin1251 = /[\u0400-\u04FF]/.test(win1251Content);
        
        // Если Windows-1251 дал кириллицу, используем его
        if (hasCyrillicInWin1251) {
          console.log('[Upload] File content decoded as Windows-1251 (CP1251)');
          return win1251Content;
        }
      } catch (error) {
        // Игнорируем ошибки конвертации
      }
    }
    
    // Шаг 3: Пробуем другие распространенные кодировки для русского текста
    const encodingsToTry = ['cp866', 'koi8-r', 'iso-8859-5'];
    
    for (const encoding of encodingsToTry) {
      try {
        const decodedContent = iconv.decode(buffer, encoding);
        
        // Проверяем, содержит ли результат кириллицу
        if (/[\u0400-\u04FF]/.test(decodedContent)) {
          console.log(`[Upload] File content decoded as ${encoding}`);
          return decodedContent;
        }
      } catch {
        // Игнорируем ошибки конвертации
      }
    }
    
    // Если ни одна кодировка не дала кириллицу, возвращаем UTF-8 результат
    // (возможно файл просто не содержит русского текста или уже в UTF-8)
    return utf8Content;
  } catch (error) {
    console.warn('[Upload] Failed to decode file content, using UTF-8:', error);
    // В случае ошибки возвращаем UTF-8 декодирование
    return buffer.toString('utf-8');
  }
}


