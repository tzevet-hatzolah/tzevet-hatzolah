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
  /** Sanity-only: the document ID of the newly created news article. */
  docId?: string;
}
