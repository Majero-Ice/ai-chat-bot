import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SavedHtmlFile {
	filePath: string;
	fileName: string;
	url: string;
	timestamp: Date;
}

/**
 * Сервис для сохранения HTML файлов от краулера
 */
@Injectable()
export class HtmlStorageService {
	private readonly logger = new Logger(HtmlStorageService.name);
	private readonly baseDir = path.join(process.cwd(), 'crawler-html');

	constructor() {
		// Создаем базовую директорию если её нет
		if (!fs.existsSync(this.baseDir)) {
			fs.mkdirSync(this.baseDir, { recursive: true });
		}
	}

	/**
	 * Сохраняет HTML контент страницы в файл
	 * @param htmlContent HTML контент страницы
	 * @param url URL страницы
	 * @param baseDomain Базовый домен для организации структуры папок
	 * @returns Информация о сохраненном файле
	 */
	async saveHtml(htmlContent: string, url: string, baseDomain: string): Promise<SavedHtmlFile> {
		try {
			// Создаем структуру папок: crawler-html/{domain}/{date}/
			const date = new Date();
			const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
			const domainDir = path.join(this.baseDir, baseDomain);
			const dateDir = path.join(domainDir, dateStr);

			// Создаем директории если их нет
			if (!fs.existsSync(domainDir)) {
				fs.mkdirSync(domainDir, { recursive: true });
			}
			if (!fs.existsSync(dateDir)) {
				fs.mkdirSync(dateDir, { recursive: true });
			}

			// Генерируем имя файла из URL
			const fileName = this.generateFileName(url);
			const filePath = path.join(dateDir, fileName);

			// Сохраняем HTML в файл
			fs.writeFileSync(filePath, htmlContent, 'utf-8');

			this.logger.debug(`Saved HTML file: ${filePath}`);

			return {
				filePath,
				fileName,
				url,
				timestamp: date,
			};
		} catch (error) {
			this.logger.error(`Failed to save HTML file for ${url}: ${error.message}`, error.stack);
			throw error;
		}
	}

	/**
	 * Генерирует безопасное имя файла из URL
	 */
	private generateFileName(url: string): string {
		try {
			const urlObj = new URL(url);
			let fileName = urlObj.pathname;

			// Убираем начальный слэш
			if (fileName.startsWith('/')) {
				fileName = fileName.substring(1);
			}

			// Если путь пустой или только слэш, используем index
			if (!fileName || fileName === '/') {
				fileName = 'index';
			}

			// Заменяем слэши на дефисы
			fileName = fileName.replace(/\//g, '-');

			// Убираем расширения и добавляем .html
			fileName = fileName.replace(/\.[^/.]+$/, '');
			if (!fileName.endsWith('.html')) {
				fileName += '.html';
			}

			// Очищаем от недопустимых символов
			fileName = fileName.replace(/[<>:"|?*\x00-\x1F]/g, '-');

			// Ограничиваем длину имени файла
			if (fileName.length > 200) {
				const hash = this.simpleHash(url);
				fileName = fileName.substring(0, 150) + '-' + hash + '.html';
			}

			// Если имя файла все еще пустое, используем хэш URL
			if (!fileName || fileName === '.html') {
				const hash = this.simpleHash(url);
				fileName = `page-${hash}.html`;
			}

			return fileName;
		} catch (error) {
			// Если не удалось распарсить URL, используем хэш
			const hash = this.simpleHash(url);
			return `page-${hash}.html`;
		}
	}

	/**
	 * Простая хэш-функция для генерации уникального имени
	 */
	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(36).substring(0, 8);
	}

	/**
	 * Получает путь к директории для домена и даты
	 */
	getDirectoryPath(baseDomain: string, date?: Date): string {
		const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
		return path.join(this.baseDir, baseDomain, dateStr);
	}

	/**
	 * Удаляет старые файлы (опционально, для очистки)
	 */
	async deleteOldFiles(baseDomain: string, daysToKeep: number = 30): Promise<number> {
		try {
			const domainDir = path.join(this.baseDir, baseDomain);
			if (!fs.existsSync(domainDir)) {
				return 0;
			}

			const now = Date.now();
			const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
			let deletedCount = 0;

			// Проходим по всем датам
			const dateDirs = fs.readdirSync(domainDir);
			for (const dateDir of dateDirs) {
				const dateDirPath = path.join(domainDir, dateDir);
				const stats = fs.statSync(dateDirPath);

				if (stats.isDirectory()) {
					// Проверяем возраст директории
					const dirAge = now - stats.mtimeMs;
					if (dirAge > maxAge) {
						// Удаляем всю директорию
						fs.rmSync(dateDirPath, { recursive: true, force: true });
						deletedCount++;
						this.logger.log(`Deleted old directory: ${dateDirPath}`);
					}
				}
			}

			return deletedCount;
		} catch (error) {
			this.logger.error(`Failed to delete old files: ${error.message}`);
			return 0;
		}
	}
}

