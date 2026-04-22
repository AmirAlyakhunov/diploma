import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Экспортирует скриншоты приложения в ZIP-архив
 * @param {Array} screenshots - Массив объектов скриншотов с image_url
 * @param {string} appName - Название приложения для имени файла
 * @returns {Promise<void>}
 */
export async function exportScreenshotsToZip(screenshots, appName) {
  if (!screenshots || screenshots.length === 0) {
    throw new Error('Нет скриншотов для экспорта');
  }

  const zip = new JSZip();
  const folder = zip.folder('screenshots');

  // Загружаем каждый скриншот
  const downloadPromises = screenshots.map(async (screenshot, index) => {
    try {
      const response = await fetch(screenshot.image_url);
      if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
      
      const blob = await response.blob();
      const extension = blob.type.split('/')[1] || 'png';
      const filename = `screenshot_${index + 1}_${screenshot.sort_order || ''}.${extension}`.replace(/\s+/g, '_');
      
      folder.file(filename, blob);
      return { success: true, filename };
    } catch (error) {
      return { success: false, error, index };
    }
  });

  const results = await Promise.all(downloadPromises);
  const failedDownloads = results.filter(r => !r.success);

  if (failedDownloads.length > 0) {
    console.warn('Не удалось загрузить некоторые скриншоты:', failedDownloads);
  }

  // Генерируем ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().split('T')[0];
  const zipFilename = `${appName}_screenshots_${timestamp}.zip`.replace(/\s+/g, '_');
  
  saveAs(content, zipFilename);
}

/**
 * Альтернативная функция с прогрессом (опционально)
 * @param {Array} screenshots - Массив скриншотов
 * @param {string} appName - Название приложения
 * @param {Function} onProgress - Функция обратного вызова для прогресса
 * @returns {Promise<void>}
 */
export async function exportScreenshotsWithProgress(screenshots, appName, onProgress) {
  if (!screenshots || screenshots.length === 0) {
    throw new Error('Нет скриншотов для экспорта');
  }

  const zip = new JSZip();
  const folder = zip.folder('screenshots');
  let completed = 0;

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    try {
      const response = await fetch(screenshot.image_url);
      if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
      
      const blob = await response.blob();
      const extension = blob.type.split('/')[1] || 'png';
      const filename = `screenshot_${i + 1}_${screenshot.sort_order || ''}.${extension}`.replace(/\s+/g, '_');
      
      folder.file(filename, blob);
      completed++;
      
      if (onProgress) {
        onProgress(completed, screenshots.length);
      }
    } catch (error) {
      console.error(`Ошибка загрузки скриншота ${i + 1}:`, error);
      completed++;
      if (onProgress) {
        onProgress(completed, screenshots.length);
      }
    }
  }

  // Генерируем ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().split('T')[0];
  const zipFilename = `${appName}_screenshots_${timestamp}.zip`.replace(/\s+/g, '_');
  
  saveAs(content, zipFilename);
}