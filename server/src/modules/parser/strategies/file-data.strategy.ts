import { Injectable } from '@nestjs/common';
import { ParserStrategy } from '../interfaces/parser.interface';
import { FileParseResult, TextChunk } from '../interfaces/parser-result.interface';

@Injectable()
export class FileDataStrategy implements ParserStrategy {
  private readonly defaultChunkSize = 1000;
  private readonly defaultOverlapSize = 200;
  private readonly defaultMinChunkSize = 100;

  async parse(data: string): Promise<FileParseResult> {
    if (!data || data.trim().length === 0) {
      return { chunks: [], totalChunks: 0, totalLength: 0, type: 'file' };
    }
    const chunkSize = this.defaultChunkSize;
    const overlapSize = this.defaultOverlapSize;
    const minChunkSize = this.defaultMinChunkSize;
    const normalizedText = this.normalizeText(data);
    const chunks = this.splitIntoChunks(normalizedText, chunkSize, overlapSize, minChunkSize);
    return { chunks, totalChunks: chunks.length, totalLength: normalizedText.length, type: 'file' };
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private splitIntoChunks(
    text: string,
    chunkSize: number,
    overlapSize: number,
    minChunkSize: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkStartPosition = 0;
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;
      const separatorLength = currentChunk ? 2 : 0;
      if (currentChunk.length + trimmedParagraph.length + separatorLength <= chunkSize) {
        if (currentChunk) {
          currentChunk += '\n\n' + trimmedParagraph;
        } else {
          currentChunk = trimmedParagraph;
          chunkStartPosition = currentPosition;
        }
        currentPosition += paragraph.length + 2;
      } else {
        if (currentChunk) {
          const sentenceChunks = this.splitBySentences(
            currentChunk,
            chunkSize,
            minChunkSize,
            chunkStartPosition,
            chunkIndex,
          );
          chunks.push(...sentenceChunks);
          chunkIndex += sentenceChunks.length;
          const overlap = this.getOverlap(currentChunk, overlapSize);
          currentChunk = overlap + '\n\n' + trimmedParagraph;
          chunkStartPosition = currentPosition - overlap.length;
        } else {
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
    if (currentChunk.trim()) {
      const trimmedChunk = currentChunk.trim();
      if (trimmedChunk.length < minChunkSize && chunks.length > 0) {
        const lastChunk = chunks[chunks.length - 1];
        if (lastChunk.length + trimmedChunk.length <= chunkSize * 1.2) {
          lastChunk.content += '\n\n' + trimmedChunk;
          lastChunk.endPosition = chunkStartPosition + trimmedChunk.length;
          lastChunk.length = lastChunk.content.length;
        } else if (trimmedChunk.length >= minChunkSize) {
          chunks.push({
            index: chunkIndex,
            content: trimmedChunk,
            startPosition: chunkStartPosition,
            endPosition: chunkStartPosition + trimmedChunk.length,
            length: trimmedChunk.length,
          });
        }
      } else if (trimmedChunk.length > chunkSize) {
        const sentenceChunks = this.splitBySentences(
          trimmedChunk,
          chunkSize,
          minChunkSize,
          chunkStartPosition,
          chunkIndex,
        );
        chunks.push(...sentenceChunks);
      } else {
        chunks.push({
          index: chunkIndex,
          content: trimmedChunk,
          startPosition: chunkStartPosition,
          endPosition: chunkStartPosition + trimmedChunk.length,
          length: trimmedChunk.length,
        });
      }
    }
    if (chunks.length === 0) {
      return this.simpleSplit(text, chunkSize, overlapSize, minChunkSize);
    }
    return chunks;
  }

  private splitBySentences(
    text: string,
    chunkSize: number,
    minChunkSize: number,
    startPosition: number,
    startIndex: number,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const sentenceEndRegex = /[.!?]\s+/g;
    const sentences: Array<{ text: string; endPos: number }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = sentenceEndRegex.exec(text)) !== null) {
      const sentence = text.substring(lastIndex, match.index + 1).trim();
      if (sentence) sentences.push({ text: sentence, endPos: match.index + 1 });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      const sentence = text.substring(lastIndex).trim();
      if (sentence) sentences.push({ text: sentence, endPos: text.length });
    }
    if (sentences.length === 0) {
      return [{
        index: startIndex,
        content: text.trim(),
        startPosition,
        endPosition: startPosition + text.trim().length,
        length: text.trim().length,
      }];
    }
    let currentChunk = '';
    let chunkStart = startPosition;
    let chunkIndex = startIndex;
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].text;
      if (sentence.length > chunkSize) {
        if (currentChunk.trim().length >= minChunkSize) {
          chunks.push({
            index: chunkIndex++,
            content: currentChunk.trim(),
            startPosition: chunkStart,
            endPosition: chunkStart + currentChunk.trim().length,
            length: currentChunk.trim().length,
          });
        }
        const sentenceStartPos = startPosition + (i > 0 ? sentences[i - 1].endPos : 0);
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        let wordChunkStart = sentenceStartPos;
        for (const word of words) {
          const spaceNeeded = wordChunk ? 1 : 0;
          const potentialLength = wordChunk.length + spaceNeeded + word.length;
          if (potentialLength <= chunkSize) {
            wordChunk = wordChunk ? wordChunk + ' ' + word : word;
          } else {
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
            wordChunk = word;
          }
        }
        currentChunk = wordChunk;
        chunkStart = wordChunkStart;
        continue;
      }
      const potentialChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      if (potentialChunk.length <= chunkSize) {
        if (currentChunk) {
          currentChunk += ' ' + sentence;
        } else {
          currentChunk = sentence;
          chunkStart = startPosition + (i > 0 ? sentences[i - 1].endPos : 0);
        }
      } else {
        const trimmedChunk = currentChunk.trim();
        if (trimmedChunk.length >= minChunkSize) {
          const finalChunk = trimmedChunk.length > chunkSize ? trimmedChunk.substring(0, chunkSize).trim() : trimmedChunk;
          chunks.push({
            index: chunkIndex++,
            content: finalChunk,
            startPosition: chunkStart,
            endPosition: chunkStart + finalChunk.length,
            length: finalChunk.length,
          });
          const overlap = this.getOverlap(trimmedChunk, 200);
          currentChunk = overlap ? overlap + ' ' + sentence : sentence;
          chunkStart = startPosition + (i > 0 ? sentences[i - 1].endPos - (overlap ? overlap.length : 0) : 0);
        } else {
          currentChunk = potentialChunk;
        }
      }
    }
    const trimmedLastChunk = currentChunk.trim();
    if (trimmedLastChunk.length >= minChunkSize) {
      let finalChunk = trimmedLastChunk;
      if (finalChunk.length > chunkSize) {
        const firstPart = finalChunk.substring(0, chunkSize).trim();
        const remainingPart = finalChunk.substring(chunkSize).trim();
        chunks.push({ index: chunkIndex++, content: firstPart, startPosition: chunkStart, endPosition: chunkStart + firstPart.length, length: firstPart.length });
        if (remainingPart.length >= minChunkSize) {
          chunks.push({ index: chunkIndex, content: remainingPart, startPosition: chunkStart + firstPart.length, endPosition: chunkStart + finalChunk.length, length: remainingPart.length });
        }
      } else {
        chunks.push({ index: chunkIndex, content: finalChunk, startPosition: chunkStart, endPosition: chunkStart + finalChunk.length, length: finalChunk.length });
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

  private getOverlap(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    let overlap = text.slice(-overlapSize);
    const sentenceEnd = overlap.lastIndexOf('. ');
    const wordBoundary = overlap.lastIndexOf(' ');
    if (sentenceEnd > overlapSize * 0.5) return overlap.slice(sentenceEnd + 2);
    if (wordBoundary > overlapSize * 0.5) return overlap.slice(wordBoundary + 1);
    return overlap;
  }

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
        chunks.push({ index: index++, content: chunkContent, startPosition: position, endPosition: endPosition, length: chunkContent.length });
      }
      position = Math.max(position + 1, endPosition - overlapSize);
    }
    return chunks;
  }
}


