# Corrección de permisos y seguridad

## Alcance
- Aplicar los límites editoriales en las reglas del servidor y la base de datos, sin cambiar diseño, contenido, archivos existentes ni integración de resultados.
- Los editores territoriales solo podrán crear y consultar sus contenidos autorizados, editar sus propios borradores y enviarlos a revisión. Publicación y eliminación seguirán reservadas al administrador.
- Sustituir los permisos generales de Editor por permisos específicos; impedir accesos a borradores ajenos y propuestas privadas.
- Permitir nuevas fotografías para artículos propios, sin sobrescribir recursos ajenos ni acceder a archivos privados no autorizados.
- Proteger la suspensión de cuentas y bloquear operaciones protegidas de sesiones suspendidas.

## Verificación
- Conservar una copia de las reglas anteriores y aplicar las correcciones de forma atómica.
- Añadir pruebas de permisos y comprobar rechazo de solicitudes directas, flujo de revisión y acceso del administrador sin entrar en su cuenta.
- Comprobar que las páginas públicas y fotografías siguen cargando. Informar por separado de cualquier recorrido que no pueda verificarse.
- No publicar cambios de la aplicación sin autorización. Las correcciones de base de datos afectan inmediatamente a preview y web publicada, porque comparten los datos.

## Detalles técnicos
- Reutilizar `user_roles`, `editor_countries`, `editor_permissions` y los disparadores editoriales existentes.
- Aplicar una migración de políticas, funciones de autorización y protección de perfiles; no modificar registros ni archivos existentes.
- Mantener lecturas públicas legítimas y acceso administrativo, con pruebas pequeñas junto a las pruebas de seguridad existentes.