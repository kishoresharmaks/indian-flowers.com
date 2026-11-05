export interface CategoryInput {
  name: string;
  slug?: string;
}

export function sanitizeCategorySlug(nameOrSlug: string): string {
  return nameOrSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeCategoryAssignments(
  primaryName?: string,
  secondaryCategories?: (CategoryInput | string)[],
  explicitPrimarySlug?: string,
  subcategorySlug?: string
): { primaryCategory: string; primarySlug: string; categories: { name: string; slug: string }[] } {
  const cleanPrimaryName = (primaryName || '').trim();
  const cleanPrimarySlug = explicitPrimarySlug 
    ? explicitPrimarySlug.trim() 
    : sanitizeCategorySlug(cleanPrimaryName);
  
  const cleanSubSlug = subcategorySlug ? subcategorySlug.trim().toLowerCase() : '';

  const categoryMap = new Map<string, { name: string; slug: string }>();

  // 1. Primary Category is always at index 0 (if present)
  if (cleanPrimarySlug) {
    categoryMap.set(cleanPrimarySlug, {
      name: cleanPrimaryName || cleanPrimarySlug,
      slug: cleanPrimarySlug,
    });
  }

  // 2. Append Secondary Parent Categories (deduplicating and filtering subcategory)
  if (Array.isArray(secondaryCategories)) {
    for (const item of secondaryCategories) {
      const rawName = typeof item === 'string' ? item : item?.name;
      if (!rawName || !rawName.trim()) continue;
      
      const cleanName = rawName.trim();
      const cleanSlug = typeof item === 'object' && item.slug
        ? item.slug.toLowerCase().trim()
        : sanitizeCategorySlug(cleanName);

      if (!cleanSlug) continue;
      // Filter out primary category collision and subcategory pollution
      if (cleanSlug === cleanPrimarySlug) continue;
      if (cleanSubSlug && cleanSlug === cleanSubSlug) continue;

      if (!categoryMap.has(cleanSlug)) {
        categoryMap.set(cleanSlug, { name: cleanName, slug: cleanSlug });
      }
    }
  }

  return {
    primaryCategory: cleanPrimaryName,
    primarySlug: cleanPrimarySlug,
    categories: Array.from(categoryMap.values()),
  };
}
