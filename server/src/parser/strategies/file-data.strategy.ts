import { Injectable } from '@nestjs/common';
import { ParserStrategy } from '../interfaces/parser.interface';
import { FileParseResult, TextChunk } from '../interfaces/parser-result.interface';

@Injectable()
export class FileDataStrategy implements ParserStrategy {
  private readonly defaultChunkSize = 1000;
  private readonly defaultOverlapSize = 200;
  private readonly defaultMinChunkSize = 100;

  /**
   * Парсит текстовые файлы, разбивая контент на чанки для создания vector embeddings
   * @param data - содержимое файла в виде строки
   */
  async parse(data: string): Promise<FileParseResult> {
    if (!data || data.trim().length === 0) {
      return {
        chunks: [],
        totalChunks: 0,
        totalLength: 0,
        type: 'file',
      };
    }

    // Используем значения по умолчанию для разбиения на чанки
    // В будущем можно добавить конфигурацию через модуль или параметры
    const chunkSize = this.defaultChunkSize;
    const overlapSize = this.defaultOverlapSize;
    const minChunkSize = this.defaultMinChunkSize;

    // Нормализуем текст: убираем лишние пробелы, но сохраняем структуру
    const normalizedText = this.normalizeText(data);
    
    // Разбиваем на чанки с учетом предложений и абзацев
    const chunks = this.splitIntoChunks(
      normalizedText,
      chunkSize,
      overlapSize,
      minChunkSize,
    );

    return {
      chunks,
      totalChunks: chunks.length,
      totalLength: normalizedText.length,
      type: 'file',
    };
  }

  /**
   * Нормализует текст: убирает лишние пробелы, но сохраняет структуру
   */
  private normalizeText(text: string): string {
    // Заменяем множественные пробелы на одинарные
    // Сохраняем переносы строк и структуру абзацев
    return text
      .replace(/\r\n/g, '\n') // Нормализуем переносы строк
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ') // Множественные пробелы/табы в одинарный пробел
      .replace(/\n{3,}/g, '\n\n') // Множественные переносы строк в двойной
      .trim();
  }

  /**
   * Разбивает текст на чанки с учетом границ предложений и абзацев
   */
  private splitIntoChunks(
    text: string,
    chunkSize: number,
    overlapSize: number,
    minChunkSize: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    // Сначала пытаемся разбить по абзацам (двойной перенос строки)
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkStartPosition = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) {
        continue;
      }

      // Если абзац помещается в текущий чанк (учитываем \n\n = 2 символа)
      const separatorLength = currentChunk ? 2 : 0; // \n\n
      if (currentChunk.length + trimmedParagraph.length + separatorLength <= chunkSize) {
        if (currentChunk) {
          currentChunk += '\n\n' + trimmedParagraph;
        } else {
          currentChunk = trimmedParagraph;
          chunkStartPosition = currentPosition;
        }
        currentPosition += paragraph.length + 2; // +2 для \n\n
      } else {
        // Если абзац не помещается, завершаем текущий чанк
        if (currentChunk) {
          // Разбиваем текущий чанк по предложениям, если он слишком большой
          const sentenceChunks = this.splitBySentences(
            currentChunk,
            chunkSize,
            minChunkSize,
            chunkStartPosition,
            chunkIndex,
          );
          
          chunks.push(...sentenceChunks);
          chunkIndex += sentenceChunks.length;
          
          // Начинаем новый чанк с перекрытием
          const overlap = this.getOverlap(currentChunk, overlapSize);
          currentChunk = overlap + '\n\n' + trimmedParagraph;
          chunkStartPosition = currentPosition - overlap.length;
        } else {
          // Если абзац сам по себе больше chunkSize, разбиваем его по предложениям
          const sentenceChunks = this.splitBySentences(
            trimmedParagraph,
            chunkSize,
            minChunkSize,
            currentPosition,
            chunkIndex,
          );
          chunks.push(...sentenceChunks);
          chunkIndex += sentenceChunks.length;
          currentChunk = '';
        }
        currentPosition += paragraph.length + 2;
      }
    }

    // Добавляем последний чанк, если он есть
    if (currentChunk.trim()) {
      const trimmedChunk = currentChunk.trim();
      
      // Если последний чанк слишком маленький, объединяем с предыдущим
      if (trimmedChunk.length < minChunkSize && chunks.length > 0) {
        const lastChunk = chunks[chunks.length - 1];
        // Объединяем только если общий размер не превышает chunkSize * 1.2
        if (lastChunk.length + trimmedChunk.length <= chunkSize * 1.2) {
          lastChunk.content += '\n\n' + trimmedChunk;
          lastChunk.endPosition = chunkStartPosition + trimmedChunk.length;
          lastChunk.length = lastChunk.content.length;
        } else {
          // Если не можем объединить, добавляем как отдельный чанк только если >= minChunkSize
          if (trimmedChunk.length >= minChunkSize) {
            chunks.push({
              index: chunkIndex,
              content: trimmedChunk,
              startPosition: chunkStartPosition,
              endPosition: chunkStartPosition + trimmedChunk.length,
              length: trimmedChunk.length,
            });
          }
        }
      } else {
        // Если чанк больше chunkSize, разбиваем его
        if (trimmedChunk.length > chunkSize) {
          const sentenceChunks = this.splitBySentences(
            trimmedChunk,
            chunkSize,
            minChunkSize,
            chunkStartPosition,
            chunkIndex,
          );
          chunks.push(...sentenceChunks);
        } else {
          // Добавляем как есть, если размер нормальный
          chunks.push({
            index: chunkIndex,
            content: trimmedChunk,
            startPosition: chunkStartPosition,
            endPosition: chunkStartPosition + trimmedChunk.length,
            length: trimmedChunk.length,
          });
        }
      }
    }

    // Если не удалось разбить по абзацам, используем простое разбиение
    if (chunks.length === 0) {
      return this.simpleSplit(text, chunkSize, overlapSize, minChunkSize);
    }

    return chunks;
  }

  /**
   * Разбивает текст по предложениям
   */
  private splitBySentences(
    text: string,
    chunkSize: number,
    minChunkSize: number,
    startPosition: number,
    startIndex: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    
    // Регулярное выражение для поиска конца предложения
    const sentenceEndRegex = /[.!?]\s+/g;
    const sentences: Array<{ text: string; endPos: number }> = [];
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = sentenceEndRegex.exec(text)) !== null) {
      const sentence = text.substring(lastIndex, match.index + 1).trim();
      if (sentence) {
        sentences.push({
          text: sentence,
          endPos: match.index + 1,
        });
      }
      lastIndex = match.index + match[0].length;
    }
    
    // Добавляем последнее предложение, если оно есть
    if (lastIndex < text.length) {
      const sentence = text.substring(lastIndex).trim();
      if (sentence) {
        sentences.push({
          text: sentence,
          endPos: text.length,
        });
      }
    }

    // Если не нашли предложения, возвращаем весь текст как один чанк
    if (sentences.length === 0) {
      return [{
        index: startIndex,
        content: text.trim(),
        startPosition,
        endPosition: startPosition + text.trim().length,
        length: text.trim().length,
      }];
    }

    // Группируем предложения в чанки
    let currentChunk = '';
    let chunkStart = startPosition;
    let chunkIndex = startIndex;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].text;
      
      // Если предложение само по себе больше chunkSize, разбиваем его по словам
      if (sentence.length > chunkSize) {
        // Сохраняем текущий чанк, если он есть
        if (currentChunk.trim().length >= minChunkSize) {
          chunks.push({
            index: chunkIndex++,
            content: currentChunk.trim(),
            startPosition: chunkStart,
            endPosition: chunkStart + currentChunk.trim().length,
            length: currentChunk.trim().length,
          });
        }
        
        // Разбиваем большое предложение на части по словам
        const sentenceStartPos = startPosition + (i > 0 ? sentences[i - 1].endPos : 0);
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        let wordChunkStart = sentenceStartPos;
        let accumulatedLength = 0;
        
        for (const word of words) {
          const spaceNeeded = wordChunk ? 1 : 0;
          const potentialLength = wordChunk.length + spaceNeeded + word.length;
          
          if (potentialLength <= chunkSize) {
            wordChunk = wordChunk ? wordChunk + ' ' + word : word;
            accumulatedLength += word.length + spaceNeeded;
          } else {
            // Сохраняем текущий чанк из слов
            if (wordChunk.length >= minChunkSize) {
              chunks.push({
                index: chunkIndex++,
                content: wordChunk,
                startPosition: wordChunkStart,
                endPosition: wordChunkStart + wordChunk.length,
                length: wordChunk.length,
              });
              wordChunkStart += wordChunk.length;
            }
            // Начинаем новый чанк
            wordChunk = word;
            accumulatedLength = word.length;
          }
        }
        
        // Остаток большого предложения становится текущим чанком
        currentChunk = wordChunk;
        chunkStart = wordChunkStart;
        continue;
      }
      
      const separatorLength = currentChunk ? 1 : 0; // пробел между предложениями
      const potentialChunk = currentChunk 
        ? currentChunk + ' ' + sentence 
        : sentence;
      
      // Проверяем, помещается ли предложение в текущий чанк
      if (potentialChunk.length <= chunkSize) {
        if (currentChunk) {
          currentChunk += ' ' + sentence;
        } else {
          currentChunk = sentence;
          chunkStart = startPosition + (i > 0 ? sentences[i - 1].endPos : 0);
        }
      } else {
        // Сохраняем текущий чанк, если он достаточно большой
        const trimmedChunk = currentChunk.trim();
        if (trimmedChunk.length >= minChunkSize) {
          // Убеждаемся, что чанк не превышает максимальный размер
          const finalChunk = trimmedChunk.length > chunkSize 
            ? trimmedChunk.substring(0, chunkSize).trim()
            : trimmedChunk;
          
          chunks.push({
            index: chunkIndex++,
            content: finalChunk,
            startPosition: chunkStart,
            endPosition: chunkStart + finalChunk.length,
            length: finalChunk.length,
          });
          
          // Начинаем новый чанк с перекрытием
          const overlap = this.getOverlap(trimmedChunk, 200);
          currentChunk = overlap ? overlap + ' ' + sentence : sentence;
          chunkStart = startPosition + (i > 0 ? sentences[i - 1].endPos - (overlap ? overlap.length : 0) : 0);
        } else {
          // Если чанк слишком маленький, просто добавляем предложение
          currentChunk = potentialChunk;
        }
      }
    }

    // Добавляем последний чанк
    const trimmedLastChunk = currentChunk.trim();
    if (trimmedLastChunk.length >= minChunkSize) {
      // Убеждаемся, что последний чанк не превышает максимальный размер
      let finalChunk = trimmedLastChunk;
      if (finalChunk.length > chunkSize) {
        // Если последний чанк слишком большой, обрезаем его до chunkSize
        // и добавляем остаток как отдельный чанк, если он достаточно большой
        const firstPart = finalChunk.substring(0, chunkSize).trim();
        const remainingPart = finalChunk.substring(chunkSize).trim();
        
        chunks.push({
          index: chunkIndex++,
          content: firstPart,
          startPosition: chunkStart,
          endPosition: chunkStart + firstPart.length,
          length: firstPart.length,
        });
        
        // Если остаток достаточно большой, добавляем его
        if (remainingPart.length >= minChunkSize) {
          chunks.push({
            index: chunkIndex,
            content: remainingPart,
            startPosition: chunkStart + firstPart.length,
            endPosition: chunkStart + finalChunk.length,
            length: remainingPart.length,
          });
        }
      } else {
        chunks.push({
          index: chunkIndex,
          content: finalChunk,
          startPosition: chunkStart,
          endPosition: chunkStart + finalChunk.length,
          length: finalChunk.length,
        });
      }
    } else if (trimmedLastChunk.length > 0 && chunks.length > 0) {
      // Если последний чанк слишком маленький, объединяем с предыдущим
      const lastChunk = chunks[chunks.length - 1];
      if (lastChunk.length + trimmedLastChunk.length <= chunkSize * 1.2) {
        lastChunk.content += ' ' + trimmedLastChunk;
        lastChunk.endPosition = chunkStart + trimmedLastChunk.length;
        lastChunk.length = lastChunk.content.length;
      } else if (trimmedLastChunk.length >= minChunkSize) {
        // Если не можем объединить, но чанк достаточно большой, добавляем отдельно
        chunks.push({
          index: chunkIndex,
          content: trimmedLastChunk,
          startPosition: chunkStart,
          endPosition: chunkStart + trimmedLastChunk.length,
          length: trimmedLastChunk.length,
        });
      }
    }

    return chunks.length > 0 ? chunks : [{
      index: startIndex,
      content: text.trim(),
      startPosition,
      endPosition: startPosition + text.trim().length,
      length: text.trim().length,
    }];
  }

  /**
   * Получает перекрытие из конца текста для сохранения контекста
   */
  private getOverlap(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text;
    }
    
    // Берем последние overlapSize символов
    let overlap = text.slice(-overlapSize);
    
    // Пытаемся найти границу предложения или слова
    const sentenceEnd = overlap.lastIndexOf('. ');
    const wordBoundary = overlap.lastIndexOf(' ');
    
    if (sentenceEnd > overlapSize * 0.5) {
      return overlap.slice(sentenceEnd + 2);
    } else if (wordBoundary > overlapSize * 0.5) {
      return overlap.slice(wordBoundary + 1);
    }
    
    return overlap;
  }

  /**
   * Простое разбиение текста на чанки фиксированного размера (fallback)
   */
  private simpleSplit(
    text: string,
    chunkSize: number,
    overlapSize: number,
    minChunkSize: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    let position = 0;
    let index = 0;

    while (position < text.length) {
      let endPosition = Math.min(position + chunkSize, text.length);
      
      // Пытаемся найти границу слова
      if (endPosition < text.length) {
        const nextSpace = text.indexOf(' ', endPosition);
        const prevSpace = text.lastIndexOf(' ', endPosition);
        
        if (prevSpace > position + minChunkSize) {
          endPosition = prevSpace;
        } else if (nextSpace !== -1 && nextSpace - position <= chunkSize * 1.2) {
          endPosition = nextSpace;
        }
      }

      const chunkContent = text.substring(position, endPosition).trim();
      
      if (chunkContent.length >= minChunkSize) {
        chunks.push({
          index: index++,
          content: chunkContent,
          startPosition: position,
          endPosition: endPosition,
          length: chunkContent.length,
        });
      }

      // Перемещаемся с перекрытием
      position = Math.max(position + 1, endPosition - overlapSize);
    }

    return chunks;
  }
}
