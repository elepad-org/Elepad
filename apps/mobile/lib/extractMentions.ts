/**
 * Extrae los IDs únicos de los usuarios mencionados en un texto
 * El texto debe estar en formato interno: <@user_id>
 * 
 * @param text - Texto con menciones en formato interno
 * @returns Array de IDs únicos de usuarios mencionados
 */
export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];

  // Expresión regular para encontrar todas las menciones <@user_id>
  const mentionRegex = /<@([a-zA-Z0-9-]+)>/g;
  const matches = text.matchAll(mentionRegex);
  
  // Extraer los IDs y eliminar duplicados usando Set
  const ids = new Set<string>();
  for (const match of matches) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }
  
  return Array.from(ids);
}
