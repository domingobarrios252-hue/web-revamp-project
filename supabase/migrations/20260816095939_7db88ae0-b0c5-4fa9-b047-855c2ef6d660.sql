UPDATE public.legal_pages
SET content = replace(
  content,
  E'Newsletter\n\nPara suscribirte',
  E'Cuentas de usuario y edad mínima\n\nPara crear una cuenta en RollerZone.es es necesario tener 14 años o más. Durante el registro debes marcar dos casillas obligatorias: la declaración de tener 14 años o más y la aceptación de las Condiciones de Uso y Registro junto con esta Política de Privacidad.\n\nAplicamos minimización de datos: no solicitamos DNI, documento de identidad ni fecha de nacimiento. Al registrarte tratamos únicamente tu nombre público (opcional), tu dirección de correo electrónico y la constancia de las aceptaciones realizadas (fecha y versión del texto aceptado), como evidencia del consentimiento y del cumplimiento de la edad mínima.\n\nLas contraseñas se gestionan cifradas por el sistema de autenticación del sitio. RollerZone no conoce, no almacena en sus propias tablas y no puede consultar tu contraseña.\n\nSi detectamos o se nos comunica que una cuenta pertenece a un menor de 14 años, la eliminaremos junto con sus datos asociados. Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo a rollerzonespain@gmail.com.\n\nCrear una cuenta no implica suscribirse al boletín: son consentimientos independientes.\n\nNewsletter\n\nPara suscribirte'
),
updated_at = now()
WHERE slug = 'privacidad';