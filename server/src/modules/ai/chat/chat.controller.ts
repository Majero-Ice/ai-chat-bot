import {
	Controller,
	Post,
	Body,
	HttpCode,
	HttpStatus,
	BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

/**
 * Контроллер для чата с ИИ
 * Предоставляет API для общения с AI на основе загруженных документов
 */
@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	/**
	 * Отправляет сообщение в чат и получает ответ от ИИ
	 * @param request Запрос с сообщением и опциями
	 * @returns Ответ ассистента с источниками
	 */
	@Post('message')
	@HttpCode(HttpStatus.OK)
	async sendMessage(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
		if (!request.message || request.message.trim().length === 0) {
			throw new BadRequestException('Message is required and cannot be empty');
		}

		return this.chatService.chat(request);
	}
}


