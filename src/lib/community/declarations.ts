/**
 * Textos y versión de las declaraciones que acepta quien envía material a RollerZone.
 * Se guardan junto al envío como evidencia proporcionada del consentimiento.
 * Protección de datos y derechos de autor/imagen son cuestiones distintas:
 * marcar estas casillas NO convierte a RollerZone en titular de las fotografías.
 */
export const COMMUNITY_DECLARATIONS_VERSION = '2026-08-v1'

export const COMMUNITY_DECLARATIONS = {
  age14:
    'Confirmo que tengo 14 años o más.',
  rights:
    'Declaro que estoy autorizado/a para enviar este contenido y que su envío a RollerZone no vulnera derechos de terceros.',
  editorialUse:
    'Autorizo a RollerZone a revisar y, cuando proceda, publicar el material enviado en sus canales editoriales y de comunicación, respetando los derechos de autor y de imagen aplicables.',
  peopleImages:
    'Confirmo que dispongo de legitimación o autorización suficiente para enviar y permitir la utilización de las imágenes de las personas que aparecen en el material.',
  minorsAuth:
    'Declaro que dispongo de la autorización necesaria del padre, madre, tutor legal o de la entidad legitimada para facilitar estas imágenes a RollerZone para su posible utilización editorial.',
} as const

export type CommunityDeclarationKey = keyof typeof COMMUNITY_DECLARATIONS

/** Días de conservación del material recibido y no publicado. */
export const COMMUNITY_RETENTION_DAYS = 90

export const COMMUNITY_CONTACT_EMAIL = 'rollerzonespain@gmail.com'

export const COMMUNITY_MAX_IMAGES = 6
export const COMMUNITY_MAX_IMAGE_MB = 8
export const COMMUNITY_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const COMMUNITY_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
