// ========== src/utils/avatarUtils.ts ==========

/**
 * ✅ Vérifier si l'avatar est valide (uploadé par l'utilisateur)
 * Tsy mampiasa sary ivelany intsony
 */
export const isValidAvatar = (avatarUrl?: string): boolean => {
  if (!avatarUrl) return false;
  if (avatarUrl === '') return false;
  
  // ❌ Tsy mampiasa sary ivelany
  if (avatarUrl.startsWith('https://i.pravatar.cc')) return false;
  if (avatarUrl.startsWith('https://picsum.photos')) return false;
  if (avatarUrl.startsWith('https://ui-avatars.com')) return false;
  if (avatarUrl.startsWith('https://avatar.vercel.sh')) return false;
  if (avatarUrl.startsWith('https://via.placeholder.com')) return false;
  if (avatarUrl.startsWith('https://www.gravatar.com')) return false;
  
  // ✅ Sary tena izy avy amin'ny Firebase Storage
  if (avatarUrl.startsWith('https://firebasestorage.googleapis.com')) return true;
  
  // ✅ Sary nampidirina tamin'ny base64 (upload)
  if (avatarUrl.startsWith('data:image')) return true;
  
  // ✅ Sary avy amin'ny domaine manokana
  if (avatarUrl.startsWith(window.location.origin)) return true;
  
  return false;
};

/**
 * ✅ Maka ny avatar URL raha valid, raha tsy izy dia miverina "" (tsy misy)
 */
export const getValidAvatar = (avatarUrl?: string): string => {
  return isValidAvatar(avatarUrl) ? avatarUrl : '';
};

/**
 * ✅ DEFAULT: Tsy misy sary ivelany
 */
export const DEFAULT_AVATAR = '';

/**
 * ✅ Manao placeholder na sary default local
 */
export const getAvatarOrDefault = (avatarUrl?: string): string => {
  return isValidAvatar(avatarUrl) ? avatarUrl : DEFAULT_AVATAR;
};
