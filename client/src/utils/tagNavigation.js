/**
 * Generate navigation URLs for tags based on platform and category
 */

/**
 * Get platform slug from app data
 * @param {Object} app - The app object
 * @returns {string} Platform slug ('web', 'ios', or 'crm' based on platforms)
 */
export const getPlatformSlug = (app) => {
  if (!app?.app_platforms?.length) return 'web';
  
  // Use slug if available, otherwise fallback to label
  const platform = app.app_platforms[0].platforms;
  return platform?.slug || platform?.label?.toLowerCase() || 'web';
};

/**
 * Get category slug from app data
 * @param {Object} app - The app object
 * @returns {string} Category slug
 */
export const getCategorySlug = (app) => {
  if (!app?.app_categories?.length) return null;
  
  // Use the first category
  const category = app.app_categories[0].categories;
  if (!category) return null;
  
  return category.slug || category.label.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Generate URL for platform tag
 * @param {Object} platformData - Platform object with slug and label
 * @returns {string} URL path
 */
export const getPlatformUrl = (platformData) => {
  const slug = platformData?.slug || platformData?.label?.toLowerCase();
  return `/${slug}`;
};

/**
 * Generate URL for category tag
 * @param {Object} app - The app object
 * @param {Object} categoryData - Category object with slug and label
 * @returns {string} URL path
 */
export const getCategoryUrl = (app, categoryData) => {
  const platformSlug = getPlatformSlug(app);
  const categorySlug = categoryData?.slug || categoryData?.label?.toLowerCase().replace(/\s+/g, '-');
  return `/${platformSlug}/${categorySlug}`;
};

/**
 * Generate URL for a tag based on its type
 * @param {Object} app - The app object
 * @param {string} type - 'platform' or 'category'
 * @param {Object} data - The platform or category data object
 * @returns {string} URL path
 */
export const getTagUrl = (app, type, data) => {
  if (type === 'platform') {
    return getPlatformUrl(data);
  } else if (type === 'category') {
    return getCategoryUrl(app, data);
  }
  return '/';
};