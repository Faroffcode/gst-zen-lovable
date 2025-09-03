/**
 * Telegram Integration Utility
 * Provides functions to send files and messages via Telegram Bot API
 */

interface TelegramSettings {
  telegramBotToken: string;
  telegramChatId: string;
}

/**
 * Send a file to a Telegram chat
 * @param file Blob or File object to send
 * @param filename Name of the file
 * @param settings Telegram settings (bot token and chat ID)
 * @returns Promise with the API response
 */
export const sendFileToTelegram = async (
  file: Blob | File,
  filename: string,
  settings: TelegramSettings
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('chat_id', settings.telegramChatId);
    formData.append('document', file, filename);
    
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendDocument`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending file to Telegram:', error);
    return false;
  }
};

/**
 * Send a text message to a Telegram chat
 * @param message Text message to send
 * @param settings Telegram settings (bot token and chat ID)
 * @returns Promise with the API response
 */
export const sendMessageToTelegram = async (
  message: string,
  settings: TelegramSettings
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
        }),
      }
    );

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
};

/**
 * Test Telegram connection
 * @param settings Telegram settings (bot token and chat ID)
 * @returns Promise with connection status
 */
export const testTelegramConnection = async (
  settings: TelegramSettings
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/getMe`
    );
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return false;
    }
    
    // Also test if we can send a message to the chat
    return await sendMessageToTelegram(
      'GST Zen: Connection test successful! ✅',
      settings
    );
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return false;
  }
};