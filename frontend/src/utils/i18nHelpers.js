/**
 * Helper utilities for translation of dynamic database values (vegetable names, categories, weight units).
 */

export const tVegName = (t, name) => {
  if (!name) return '';
  
  // 1. Direct translation lookup
  const directKey = `vegNames.${name}`;
  if (t(directKey, { defaultValue: '' })) {
    return t(directKey);
  }

  // 2. Lowercase lookup
  const lowerKey = `vegNames.${name.toLowerCase()}`;
  if (t(lowerKey, { defaultValue: '' })) {
    return t(lowerKey);
  }

  // 3. Smart Keyword Matching for dynamic DB values
  const lower = name.toLowerCase();
  if (lower.includes('lady finger') || lower.includes('bhindi')) return t('vegNames.Fresh Lady Finger (Bhindi)', { defaultValue: name });
  if (lower.includes('cabbage')) return t('vegNames.Fresh Cabbage', { defaultValue: name });
  if (lower.includes('cucumber')) return t('vegNames.Fresh Farm Cucumber', { defaultValue: name });
  if (lower.includes('tomato')) return t('vegNames.Fresh Red Tomatoes', { defaultValue: name });
  if (lower.includes('spinach') || lower.includes('palak')) return t('vegNames.Organic Spinach (Palak)', { defaultValue: name });
  if (lower.includes('potato')) return t('vegNames.Fresh Potatoes', { defaultValue: name });
  if (lower.includes('capsicum') || lower.includes('shimla')) return t('vegNames.Green Capsicum', { defaultValue: name });
  if (lower.includes('onion')) return t('vegNames.Fresh Onions', { defaultValue: name });
  if (lower.includes('carrot')) return t('vegNames.Farm Carrots', { defaultValue: name });
  if (lower.includes('cauliflower')) return t('vegNames.Fresh Cauliflower', { defaultValue: name });
  if (lower.includes('peas') || lower.includes('matar')) return t('vegNames.Green Peas (Matar)', { defaultValue: name });
  if (lower.includes('chilli')) return t('vegNames.Green Chilli', { defaultValue: name });
  if (lower.includes('coriander') || lower.includes('kothimbir')) return t('vegNames.Fresh Coriander (Kothimbir)', { defaultValue: name });
  if (lower.includes('bitter gourd') || lower.includes('karela')) return t('vegNames.Fresh Bitter Gourd (Karela)', { defaultValue: name });
  if (lower.includes('bottle gourd') || lower.includes('lauki')) return t('vegNames.Fresh Bottle Gourd', { defaultValue: name });

  return name;
};

export const tCategory = (t, category) => {
  if (!category) return '';

  // 1. Direct translation lookup
  const directKey = `categories.${category}`;
  if (t(directKey, { defaultValue: '' })) {
    return t(directKey);
  }

  // 2. Lowercase lookup
  const lowerKey = `categories.${category.toLowerCase()}`;
  if (t(lowerKey, { defaultValue: '' })) {
    return t(lowerKey);
  }

  // 3. Smart Keyword Matching for category strings
  const lower = category.toLowerCase();
  if (lower.includes('pod') || lower.includes('bean')) return t('categories.pods & beans', { defaultValue: category });
  if (lower.includes('gourd') || lower.includes('squash')) return t('categories.gourds & squashes', { defaultValue: category });
  if (lower.includes('cruciferous') || lower.includes('cabbage') || lower.includes('cauliflower')) return t('categories.cruciferous & cabbage', { defaultValue: category });
  if (lower.includes('nightshade') || lower.includes('pepper') || lower.includes('capsicum')) return t('categories.nightshades & peppers', { defaultValue: category });
  if (lower.includes('leafy') || lower.includes('spinach') || lower.includes('palak')) return t('categories.leafy greens', { defaultValue: category });
  if (lower.includes('root') || lower.includes('tuber') || lower.includes('potato') || lower.includes('carrot')) return t('categories.root vegetables', { defaultValue: category });
  if (lower.includes('tomato') || lower.includes('onion')) return t('categories.tomatoes & onions', { defaultValue: category });
  if (lower.includes('organic')) return t('categories.organic', { defaultValue: category });

  return category;
};
