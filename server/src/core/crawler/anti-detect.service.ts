import { Injectable, Logger } from '@nestjs/common';
import type { Page, BrowserContext, CDPSession } from 'playwright';

/**
 * Сервис для применения техник анти-детекта к браузеру
 * Скрывает признаки автоматизации и маскирует браузер под реального пользователя
 */
@Injectable()
export class AntiDetectService {
	private readonly logger = new Logger(AntiDetectService.name);

	/**
	 * Применяет все техники анти-детекта к странице
	 */
	async applyAllProtections(page: Page): Promise<void> {
		try {
			await Promise.all([
				this.maskWebDriver(page),
				this.maskChromeRuntime(page),
				this.spoofCanvasFingerprint(page),
				this.spoofWebGLFingerprint(page),
				this.spoofAudioFingerprint(page),
				this.spoofWebRTC(page),
				this.spoofBatteryAPI(page),
				this.spoofPermissionsAPI(page),
				this.spoofMediaDevices(page),
				this.spoofPlugins(page),
				this.spoofLanguages(page),
				this.spoofTimezone(page),
				this.spoofScreenProperties(page),
				this.spoofConnection(page),
				this.maskAutomationIndicators(page),
				this.addHumanBehaviorTraits(page),
				this.spoofGoogleDetections(page),
				this.spoofRecaptchaIndicators(page),
				this.spoofBehavioralFingerprinting(page),
				this.spoofMouseMovementPatterns(page),
				this.spoofKeyboardTypingPatterns(page),
				this.spoofScrollPatterns(page),
				this.spoofTimingPatterns(page),
			]);

			// Применяем CDP маскировку отдельно
			await this.maskCDP(page);
		} catch (error) {
			this.logger.warn(`Failed to apply some anti-detect protections: ${error.message}`);
		}
	}

	/**
	 * Маскировка navigator.webdriver и связанных свойств
	 */
	private async maskWebDriver(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Удаляем navigator.webdriver
			Object.defineProperty(navigator, 'webdriver', {
				get: () => undefined,
				configurable: true,
			});

			// Удаляем webdriver из navigator
			delete (navigator as any).webdriver;

			// Маскируем автоматизацию в window
			Object.defineProperty(window, 'navigator', {
				value: new Proxy(navigator, {
					has: (target, key) => (key === 'webdriver' ? false : key in target),
					get: (target, key) => {
						if (key === 'webdriver') return undefined;
						const value = (target as any)[key];
						return typeof value === 'function' ? value.bind(target) : value;
					},
				}),
			});

			// Удаляем все индикаторы автоматизации
			const automationProps = [
				'__webdriver_script_fn',
				'__driver_evaluate',
				'__webdriver_evaluate',
				'__selenium_evaluate',
				'__fxdriver_evaluate',
				'__driver_unwrapped',
				'__webdriver_unwrapped',
				'__selenium_unwrapped',
				'__fxdriver_unwrapped',
				'_selenium',
				'calledSelenium',
				'_WEBDRIVER_ELEM_CACHE',
				'$chrome_asyncScriptInfo',
				'__$webdriverAsyncExecutor',
				'chrome',
				'__PUPPETEER_WORLD__',
				'__PUPPETEER_EXECUTION_CONTEXT__',
				'__puppeteer_evaluation__',
			];

			automationProps.forEach((prop) => {
				try {
					delete (window as any)[prop];
				} catch (e) {
					// Игнорируем ошибки
				}
			});

			// Маскируем document.documentElement.getAttribute
			const originalGetAttribute = Element.prototype.getAttribute;
			Element.prototype.getAttribute = function (name) {
				if (name === 'webdriver') {
					return null;
				}
				return originalGetAttribute.apply(this, arguments as any);
			};
		});
	}

	/**
	 * Маскировка chrome runtime и automation extensions
	 */
	private async maskChromeRuntime(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Маскируем chrome object
			(window as any).chrome = {
				runtime: {},
				loadTimes: function () {
					return {
						commitLoadTime: Date.now() / 1000 - Math.random() * 10,
						finishDocumentLoadTime: Date.now() / 1000 - Math.random() * 9,
						finishLoadTime: Date.now() / 1000 - Math.random() * 8,
						firstPaintAfterLoadTime: 0,
						firstPaintTime: Date.now() / 1000 - Math.random() * 7,
						navigationType: 'Other',
						npnNegotiatedProtocol: 'unknown',
						requestTime: Date.now() / 1000 - Math.random() * 10,
						startLoadTime: Date.now() / 1000 - Math.random() * 10,
						wasAlternateProtocolAvailable: false,
						wasFetchedViaSpdy: false,
						wasNpnNegotiated: false,
					};
				},
				csi: function () {
					return {
						startE: Date.now() - Math.random() * 10000,
						onloadT: Date.now() - Math.random() * 5000,
						pageT: Math.random() * 1000,
						tran: 15,
					};
				},
				app: {
					isInstalled: false,
				},
			};
		});
	}

	/**
	 * Случайный Canvas fingerprint для каждой сессии
	 */
	private async spoofCanvasFingerprint(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const getImageData = CanvasRenderingContext2D.prototype.getImageData;
			CanvasRenderingContext2D.prototype.getImageData = function () {
				const imageData = getImageData.apply(this, arguments as any);
				const noise = Math.random() * 0.1;
				for (let i = 0; i < imageData.data.length; i += 4) {
					imageData.data[i] = Math.min(255, imageData.data[i] + noise);
					imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] + noise);
					imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] + noise);
				}
				return imageData;
			};

			const toDataURL = HTMLCanvasElement.prototype.toDataURL;
			HTMLCanvasElement.prototype.toDataURL = function () {
				const context = this.getContext('2d');
				if (context) {
					const imageData = context.getImageData(0, 0, this.width, this.height);
					const noise = Math.random() * 0.01;
					for (let i = 0; i < imageData.data.length; i += 4) {
						imageData.data[i] = Math.min(255, imageData.data[i] + noise);
					}
					context.putImageData(imageData, 0, 0);
				}
				return toDataURL.apply(this, arguments as any);
			};
		});
	}

	/**
	 * WebGL fingerprint spoofing
	 */
	private async spoofWebGLFingerprint(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// WebGL1
			if (typeof WebGLRenderingContext !== 'undefined') {
				const getParameter = WebGLRenderingContext.prototype.getParameter;
				WebGLRenderingContext.prototype.getParameter = function (parameter) {
					if (parameter === 37445) {
						// UNMASKED_VENDOR_WEBGL
						return 'Intel Inc.';
					}
					if (parameter === 37446) {
						// UNMASKED_RENDERER_WEBGL
						return 'Intel Iris OpenGL Engine';
					}
					return getParameter.apply(this, arguments as any);
				};
			}

			// WebGL2
			if (typeof WebGL2RenderingContext !== 'undefined') {
				const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
				WebGL2RenderingContext.prototype.getParameter = function (parameter) {
					if (parameter === 37445) {
						return 'Intel Inc.';
					}
					if (parameter === 37446) {
						return 'Intel Iris OpenGL Engine';
					}
					return getParameter2.apply(this, arguments as any);
				};
			}
		});
	}

	/**
	 * Audio fingerprint randomization
	 */
	private async spoofAudioFingerprint(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
			if (AudioContext) {
				const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
				AudioContext.prototype.createAnalyser = function () {
					const analyser = originalCreateAnalyser.apply(this, arguments as any);
					const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
					analyser.getFloatFrequencyData = function (array: Float32Array) {
						originalGetFloatFrequencyData.apply(this, arguments as any);
						const noise = Math.random() * 0.0001;
						for (let i = 0; i < array.length; i++) {
							array[i] += noise;
						}
					};
					return analyser;
				};
			}
		});
	}

	/**
	 * WebRTC IP leak protection
	 */
	private async spoofWebRTC(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const originalRTCPeerConnection = (window as any).RTCPeerConnection;
			if (originalRTCPeerConnection) {
				(window as any).RTCPeerConnection = function (...args: any[]) {
					const pc = new originalRTCPeerConnection(...args);

					const originalCreateOffer = pc.createOffer.bind(pc);
					pc.createOffer = async (...offerArgs: any[]) => {
						const offer = await originalCreateOffer(...offerArgs);
						if (offer.sdp) {
							offer.sdp = offer.sdp.replace(/a=ice-options:.*\r\n/g, '');
						}
						return offer;
					};

					const originalCreateAnswer = pc.createAnswer.bind(pc);
					pc.createAnswer = async (...answerArgs: any[]) => {
						const answer = await originalCreateAnswer(...answerArgs);
						if (answer.sdp) {
							answer.sdp = answer.sdp.replace(/a=ice-options:.*\r\n/g, '');
						}
						return answer;
					};

					return pc;
				};
			}
		});
	}

	/**
	 * Battery API spoofing
	 */
	private async spoofBatteryAPI(page: Page): Promise<void> {
		await page.addInitScript(async () => {
			if ((navigator as any).getBattery) {
				const originalGetBattery = (navigator as any).getBattery;
				(navigator as any).getBattery = async () => {
					const battery = await originalGetBattery();
					const randomLevel = Math.random() * 0.2 + 0.8; // 80-100%
					Object.defineProperty(battery, 'level', {
						get: () => randomLevel,
						configurable: true,
					});
					return battery;
				};
			}
		});
	}

	/**
	 * Permissions API spoofing
	 */
	private async spoofPermissionsAPI(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const originalQuery = (window.navigator as any).permissions?.query;
			if (originalQuery) {
				(window.navigator as any).permissions.query = (parameters: any) => {
					return originalQuery(parameters).then((result: PermissionStatus) => {
						if (parameters.name === 'notifications') {
							Object.defineProperty(result, 'state', {
								get: () => 'prompt',
								configurable: true,
							});
						}
						return result;
					});
				};
			}
		});
	}

	/**
	 * Media Devices spoofing
	 */
	private async spoofMediaDevices(page: Page): Promise<void> {
		await page.addInitScript(() => {
			if (navigator.mediaDevices?.enumerateDevices) {
				const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
				navigator.mediaDevices.enumerateDevices = async () => {
					const devices = await originalEnumerateDevices();
					return devices.map((device) => ({
						...device,
						deviceId: device.deviceId,
						groupId: device.groupId,
						label: device.label || 'Default Device',
					}));
				};
			}
		});
	}

	/**
	 * Plugins spoofing
	 */
	private async spoofPlugins(page: Page): Promise<void> {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'plugins', {
				get: () => {
					const plugins: any[] = [
						{
							0: {
								type: 'application/x-google-chrome-pdf',
								suffixes: 'pdf',
								description: 'Portable Document Format',
							},
							description: 'Portable Document Format',
							filename: 'internal-pdf-viewer',
							length: 1,
							name: 'Chrome PDF Plugin',
						},
						{
							0: {
								type: 'application/pdf',
								suffixes: 'pdf',
								description: '',
							},
							description: '',
							filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
							length: 1,
							name: 'Chrome PDF Viewer',
						},
						{
							0: {
								type: 'application/x-nacl',
								suffixes: '',
								description: 'Native Client Executable',
							},
							1: {
								type: 'application/x-pnacl',
								suffixes: '',
								description: 'Portable Native Client Executable',
							},
							description: '',
							filename: 'internal-nacl-plugin',
							length: 2,
							name: 'Native Client',
						},
					];
					return plugins;
				},
				configurable: true,
			});
		});
	}

	/**
	 * Languages spoofing
	 */
	private async spoofLanguages(page: Page): Promise<void> {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'languages', {
				get: () => ['en-US', 'en'],
				configurable: true,
			});
			Object.defineProperty(navigator, 'language', {
				get: () => 'en-US',
				configurable: true,
			});
		});
	}

	/**
	 * Timezone spoofing
	 */
	private async spoofTimezone(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
			Date.prototype.getTimezoneOffset = function () {
				// America/New_York timezone offset
				return 300; // UTC-5
			};

			// Маскируем Intl.DateTimeFormat
			const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
			Intl.DateTimeFormat.prototype.resolvedOptions = function () {
				const options = originalResolvedOptions.apply(this, arguments as any);
				options.timeZone = 'America/New_York';
				return options;
			};
		});
	}

	/**
	 * Screen properties spoofing
	 */
	private async spoofScreenProperties(page: Page): Promise<void> {
		await page.addInitScript(() => {
			Object.defineProperty(screen, 'availWidth', {
				get: () => window.innerWidth,
				configurable: true,
			});
			Object.defineProperty(screen, 'availHeight', {
				get: () => window.innerHeight,
				configurable: true,
			});
			Object.defineProperty(screen, 'availTop', {
				get: () => 0,
				configurable: true,
			});
			Object.defineProperty(screen, 'availLeft', {
				get: () => 0,
				configurable: true,
			});
		});
	}

	/**
	 * Connection spoofing
	 */
	private async spoofConnection(page: Page): Promise<void> {
		await page.addInitScript(() => {
			if ((navigator as any).connection) {
				Object.defineProperty(navigator, 'connection', {
					get: () => ({
						effectiveType: '4g',
						rtt: 50,
						downlink: 10,
						saveData: false,
					}),
					configurable: true,
				});
			}
		});
	}

	/**
	 * Маскировка индикаторов автоматизации
	 */
	private async maskAutomationIndicators(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Удаляем свойства автоматизации
			const automationProps = [
				'cdc_adoQpoasnfa76pfcZLmcfl_Array',
				'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
				'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
				'cdc_adoQpoasnfa76pfcZLmcfl_Object',
				'cdc_adoQpoasnfa76pfcZLmcfl_Proxy',
				'cdc_adoQpoasnfa76pfcZLmcfl_JSON',
				'$cdc_asdjflasutopfhvcZLmcfl_',
				'$chrome_asyncScriptInfo',
				'__$webdriverAsyncExecutor',
				'_Selenium_IDE_Recorder',
			];

			automationProps.forEach((prop) => {
				try {
					Object.defineProperty(document, prop, {
						get: () => undefined,
						configurable: true,
					});
					delete (window as any)[prop];
					delete (document as any)[prop];
				} catch (e) {
					// Игнорируем ошибки
				}
			});
		});
	}

	/**
	 * Маскировка CDP (Chrome DevTools Protocol) индикаторов
	 */
	private async maskCDP(page: Page): Promise<void> {
		try {
			const client = await page.context().newCDPSession(page);
			await client.send('Page.addScriptToEvaluateOnNewDocument', {
				source: `
					Object.defineProperty(navigator, 'webdriver', {
						get: () => false,
						configurable: true
					});
					
					if (!window.navigator.chrome) {
						window.navigator.chrome = {
							runtime: {},
							loadTimes: function() {},
							csi: function() {},
							app: {}
						};
					}
					
					Object.defineProperty(window, 'devtools', { 
						get: () => undefined,
						configurable: true 
					});
					Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', { 
						get: () => undefined,
						configurable: true 
					});
				`,
			});
			await client.detach();
		} catch (error) {
			this.logger.debug(`CDP masking failed: ${error.message}`);
		}
	}

	/**
	 * Добавление человеческих черт поведения
	 */
	private async addHumanBehaviorTraits(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Добавляем случайные микро-задержки в таймеры
			const originalSetTimeout = window.setTimeout;
			(window as any).setTimeout = function (callback: Function, delay: number, ...args: any[]) {
				const jitter = Math.random() * 10;
				return originalSetTimeout(callback, delay + jitter, ...args);
			};

			// Маскируем наличие автоматизации через ошибки
			const originalAddEventListener = EventTarget.prototype.addEventListener;
			EventTarget.prototype.addEventListener = function (type: string, listener: any, options?: any) {
				if (
					type === 'error' &&
					listener &&
					typeof listener.toString === 'function' &&
					listener.toString().includes('webdriver')
				) {
					return;
				}
				return originalAddEventListener.apply(this, arguments as any);
			};
		});
	}

	/**
	 * Специальная маскировка для Google детекций
	 */
	private async spoofGoogleDetections(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Маскируем window.chrome
			if (!(window as any).chrome) {
				(window as any).chrome = {};
			}
			(window as any).chrome.runtime = {
				onConnect: undefined,
				onMessage: undefined,
				connect: function () {
					return {};
				},
				sendMessage: function () {
					return Promise.resolve({});
				},
			};

			// Маскируем наличие Puppeteer
			delete (window as any).__PUPPETEER_WORLD__;
			delete (window as any).__PUPPETEER_EXECUTION_CONTEXT__;
			delete (window as any).__puppeteer_evaluation__;

			// Маскируем наличие автоматизации в document
			Object.defineProperty(document, '$cdc_asdjflasutopfhvcZLmcfl_', {
				get: () => undefined,
				configurable: true,
			});
			Object.defineProperty(document, '$chrome_asyncScriptInfo', {
				get: () => undefined,
				configurable: true,
			});

			// Маскируем console.error для скрытия ошибок автоматизации
			const originalConsoleError = console.error;
			console.error = function (...args: any[]) {
				const message = args.join(' ');
				if (
					message.includes('webdriver') ||
					message.includes('puppeteer') ||
					message.includes('selenium') ||
					message.includes('automation')
				) {
					return;
				}
				return originalConsoleError.apply(console, args);
			};

			// Добавляем реалистичные свойства
			Object.defineProperty(navigator, 'maxTouchPoints', {
				get: () => 0,
				configurable: true,
			});
		});
	}

	/**
	 * Маскировка индикаторов reCAPTCHA
	 */
	private async spoofRecaptchaIndicators(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Удаляем все свойства автоматизации
			const automationIndicators = [
				'__webdriver_script_fn',
				'__driver_evaluate',
				'__webdriver_evaluate',
				'__selenium_evaluate',
				'__fxdriver_evaluate',
				'__driver_unwrapped',
				'__webdriver_unwrapped',
				'__selenium_unwrapped',
				'__fxdriver_unwrapped',
				'_selenium',
				'calledSelenium',
				'_WEBDRIVER_ELEM_CACHE',
				'$chrome_asyncScriptInfo',
				'__$webdriverAsyncExecutor',
				'$cdc_asdjflasutopfhvcZLmcfl_',
				'_Selenium_IDE_Recorder',
				'__puppeteer_evaluation__',
				'__PUPPETEER_WORLD__',
				'__PUPPETEER_EXECUTION_CONTEXT__',
			];

			automationIndicators.forEach((prop) => {
				try {
					delete (window as any)[prop];
					delete (document as any)[prop];
				} catch (e) {
					// Игнорируем ошибки
				}
			});

			// Маскируем navigator.webdriver более надежно
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false,
				configurable: true,
			});

			// Маскируем наличие автоматизации через проверку свойств
			const originalHasOwnProperty = Object.prototype.hasOwnProperty;
			Object.prototype.hasOwnProperty = function (prop: string | symbol) {
				if (
					prop === 'webdriver' ||
					prop === '__webdriver__' ||
					prop === '__selenium__' ||
					prop === '__puppeteer__'
				) {
					return false;
				}
				return originalHasOwnProperty.call(this, prop);
			};
		});
	}

	/**
	 * Маскировка поведенческого fingerprinting
	 */
	private async spoofBehavioralFingerprinting(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Маскируем время загрузки страницы
			const originalLoadEvent = window.addEventListener;
			window.addEventListener = function (type: string, listener: any, options?: any) {
				if (type === 'load') {
					const wrappedListener = function (event: Event) {
						setTimeout(() => {
							if (listener) listener(event);
						}, Math.random() * 100);
					};
					return originalLoadEvent.call(window, type, wrappedListener, options);
				}
				return originalLoadEvent.call(window, type, listener, options);
			};
		});
	}

	/**
	 * Маскировка паттернов движения мыши
	 */
	private async spoofMouseMovementPatterns(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Добавляем микро-тремор в движения мыши через перехват событий
			const originalAddEventListener = EventTarget.prototype.addEventListener;
			EventTarget.prototype.addEventListener = function (type: string, listener: any, options?: any) {
				if (type === 'mousemove' || type === 'mouseover' || type === 'mouseout') {
					const wrappedListener = function (event: MouseEvent) {
						// Добавляем небольшую случайную вариацию
						if (listener) {
							const modifiedEvent = new Proxy(event, {
								get: (target, prop) => {
									if (prop === 'clientX') {
										return (target as any).clientX + (Math.random() * 0.5 - 0.25);
									}
									if (prop === 'clientY') {
										return (target as any).clientY + (Math.random() * 0.5 - 0.25);
									}
									return (target as any)[prop];
								},
							});
							listener(modifiedEvent);
						}
					};
					return originalAddEventListener.call(this, type, wrappedListener, options);
				}
				return originalAddEventListener.call(this, type, listener, options);
			};
		});
	}

	/**
	 * Маскировка паттернов набора текста
	 */
	private async spoofKeyboardTypingPatterns(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Перехватываем события клавиатуры
			const originalAddEventListener = EventTarget.prototype.addEventListener;
			EventTarget.prototype.addEventListener = function (type: string, listener: any, options?: any) {
				if (type === 'keydown' || type === 'keyup' || type === 'keypress') {
					const wrappedListener = function (event: KeyboardEvent) {
						const delay = Math.random() * 50 + 10; // 10-60ms
						setTimeout(() => {
							if (listener) listener(event);
						}, delay);
					};
					return originalAddEventListener.call(this, type, wrappedListener, options);
				}
				return originalAddEventListener.call(this, type, listener, options);
			};
		});
	}

	/**
	 * Маскировка паттернов скроллинга
	 */
	private async spoofScrollPatterns(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Перехватываем события скроллинга
			const originalAddEventListener = EventTarget.prototype.addEventListener;
			EventTarget.prototype.addEventListener = function (type: string, listener: any, options?: any) {
				if (type === 'scroll' || type === 'wheel') {
					const wrappedListener = function (event: WheelEvent) {
						setTimeout(() => {
							if (listener) listener(event);
						}, Math.random() * 10);
					};
					return originalAddEventListener.call(this, type, wrappedListener, options);
				}
				return originalAddEventListener.call(this, type, listener, options);
			};

			// Маскируем скорость скроллинга
			const originalScroll = window.scroll;
			window.scroll = function (...args: any[]) {
				setTimeout(() => {
					originalScroll.apply(window, args);
				}, Math.random() * 50);
			};

			const originalScrollTo = window.scrollTo;
			window.scrollTo = function (...args: any[]) {
				setTimeout(() => {
					originalScrollTo.apply(window, args);
				}, Math.random() * 50);
			};
		});
	}

	/**
	 * Маскировка паттернов времени
	 */
	private async spoofTimingPatterns(page: Page): Promise<void> {
		await page.addInitScript(() => {
			// Маскируем время выполнения функций
			const originalSetTimeout = window.setTimeout;
			(window as any).setTimeout = function (callback: Function, delay: number, ...args: any[]) {
				const jitter = Math.random() * 10 - 5;
				return originalSetTimeout(callback, delay + jitter, ...args);
			};

			const originalSetInterval = window.setInterval;
			(window as any).setInterval = function (callback: Function, delay: number, ...args: any[]) {
				const jitter = Math.random() * 5 - 2.5;
				return originalSetInterval(callback, delay + jitter, ...args);
			};
		});
	}
}

