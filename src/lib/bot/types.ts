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
  platform: "telegram" | "facebook" | "instagram" | "twitter" | "sanity";
  success: boolean;
  error?: string;
}
