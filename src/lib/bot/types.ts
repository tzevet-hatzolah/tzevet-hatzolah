export interface BotMessage {
  text: string;
  photos: PhotoFile[];
  senderId: number;
  chatId: number;
  messageId: number;
}

export interface PhotoFile {
  fileId: string;
  fileUrl?: string;
}

export interface PublishResult {
  platform: "telegram" | "facebook" | "instagram" | "sanity";
  success: boolean;
  error?: string;
}
