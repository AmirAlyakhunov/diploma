import { supabase } from '../lib/supabaseClient';

/**
 * Добавить скриншот в коллекцию пользователя
 * @param {string} screenshotId - ID скриншота
 * @param {string} appId - ID приложения (для связи) - больше не используется, оставлен для обратной совместимости
 * @param {string} userId - ID пользователя
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addToCollection = async (screenshotId, appId, userId) => {
  try {
    // Проверяем, не добавлен ли уже скриншот
    const { data: existing } = await supabase
      .from('user_collection')
      .select('id')
      .eq('screenshot_id', screenshotId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Скриншот уже в коллекции' };
    }

    const { error } = await supabase
      .from('user_collection')
      .insert({
        screenshot_id: screenshotId,
        owner_id: userId,
      });

    if (error) {
      // Если ошибка foreign key constraint, пользователь может не существовать в public.users
      // В этом случае AuthContext должен был создать пользователя, но на всякий случай логируем
      console.error('Ошибка при добавлении в коллекцию:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при добавлении в коллекцию:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Удалить скриншот из коллекции пользователя
 * @param {string} screenshotId - ID скриншота
 * @param {string} userId - ID пользователя
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeFromCollection = async (screenshotId, userId) => {
  try {
    const { error } = await supabase
      .from('user_collection')
      .delete()
      .eq('screenshot_id', screenshotId)
      .eq('owner_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении из коллекции:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Проверить, добавлен ли скриншот в коллекцию пользователя
 * @param {string} screenshotId - ID скриншота
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>}
 */
export const isInCollection = async (screenshotId, userId) => {
  try {
    const { data, error } = await supabase
      .from('user_collection')
      .select('id')
      .eq('screenshot_id', screenshotId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      // Другие ошибки (например, foreign key constraint) могут возникнуть, если пользователя нет в public.users
      // В этом случае считаем, что скриншот не в коллекции
      console.error('Ошибка при проверке коллекции:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Ошибка при проверке коллекции:', error);
    return false;
  }
};

/**
 * Получить все скриншоты из коллекции пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Массив скриншотов с информацией о приложениях
 */
export const getUserCollection = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_collection')
      .select(`
        id,
        created_at,
        screenshot_id,
        screenshots (
          id,
          image_url,
          apps (
            id,
            name,
            logo_url,
            description
          )
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Преобразуем данные в удобный формат
    return data.map(item => ({
      collectionId: item.id,
      screenshotId: item.screenshot_id,
      imageUrl: item.screenshots?.image_url,
      appId: item.screenshots?.apps?.id,
      appName: item.screenshots?.apps?.name,
      appLogo: item.screenshots?.apps?.logo_url,
      appDescription: item.screenshots?.apps?.description,
      createdAt: item.created_at,
      // Сохраняем оригинальную структуру для модалки
      originalData: item,
    }));
  } catch (error) {
    console.error('Ошибка при получении коллекции:', error);
    return [];
  }
};

/**
 * Получить количество скриншотов в коллекции пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<number>}
 */
export const getCollectionCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('user_collection')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Ошибка при получении количества:', error);
    return 0;
  }
};