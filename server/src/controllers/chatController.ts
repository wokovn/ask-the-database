import type { Request, Response, NextFunction } from 'express';
import type { ChatService } from '../services/chatService.js';
import type { ApiResponse } from '../infrastructure/errors/appError.js';

export class ChatController {
  private readonly chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  public handleMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, sessionId } = req.body;
      const result = await this.chatService.processMessage({ message, sessionId });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = Array.isArray(req.params.sessionId)
        ? req.params.sessionId[0]
        : req.params.sessionId;
      const session = sessionId ? this.chatService.getSessionHistory(sessionId) : undefined;

      const response: ApiResponse<typeof session> = {
        success: true,
        data: session,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
