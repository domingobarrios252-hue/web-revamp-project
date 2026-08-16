ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS age_confirmed_14_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _terms_version text := NULLIF(NEW.raw_user_meta_data->>'terms_version', '');
  _terms_ok boolean := COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false);
  _age_ok boolean := COALESCE((NEW.raw_user_meta_data->>'age_14_confirmed')::boolean, false);
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, terms_accepted_at, terms_version, age_confirmed_14_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN _terms_ok THEN now() ELSE NULL END,
    CASE WHEN _terms_ok THEN _terms_version ELSE NULL END,
    CASE WHEN _age_ok THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      terms_accepted_at = COALESCE(public.profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
      terms_version = COALESCE(public.profiles.terms_version, EXCLUDED.terms_version),
      age_confirmed_14_at = COALESCE(public.profiles.age_confirmed_14_at, EXCLUDED.age_confirmed_14_at);

  -- Rol por defecto: LECTOR. Nunca editor ni admin de forma automática.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'lector')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

INSERT INTO public.legal_pages (slug, title, content)
VALUES (
  'condiciones-uso',
  'Condiciones de Uso y Registro',
  $md$Última actualización: agosto de 2026. Versión: 2026-08-v1

## 1. Objeto

RollerZone.es es un medio digital especializado en información, actualidad y contenidos relacionados con el patinaje de velocidad: noticias, eventos, resultados, vídeos, entrevistas, reportajes y publicaciones editoriales.

Estas Condiciones de Uso y Registro regulan el acceso al sitio web, la creación de una cuenta y el uso de las funcionalidades disponibles. El acceso a los contenidos públicos no requiere registro.

## 2. Registro y edad mínima

Para crear una cuenta en RollerZone.es es necesario tener **14 años o más**. Durante el registro se solicita una declaración expresa en este sentido. No se solicita documento de identidad ni fecha completa de nacimiento, en aplicación del principio de minimización de datos.

Si eres menor de 14 años no puedes crear una cuenta, pero puedes seguir consultando libremente los contenidos públicos de RollerZone.es.

Al registrarte te comprometes a:

- Facilitar información veraz y válida (nombre público y dirección de correo electrónico).
- Mantener la confidencialidad de tus credenciales y hacer un uso estrictamente personal de ellas.
- Ser responsable de la actividad realizada desde tu cuenta.
- No intentar acceder a cuentas ajenas ni a áreas privadas o de administración para las que no estés autorizado.

## 3. Credenciales y contraseñas

Las credenciales de acceso se gestionan a través del sistema de autenticación utilizado por RollerZone.es. RollerZone **no conoce ni puede consultar tu contraseña**: no se muestra, no se comunica y no se utiliza para ninguna finalidad distinta del acceso a tu cuenta.

Si sospechas que alguien ha accedido a tu cuenta, cambia la contraseña y comunícalo a RollerZone a través del formulario de contacto.

## 4. Qué ofrece una cuenta

Disponer de una cuenta en RollerZone.es permite:

- Acceder al sitio de forma identificada.
- Acceder a tu biblioteca personal, con las publicaciones o revistas digitales que tengas disponibles o hayas adquirido, cuando corresponda.
- Utilizar las funcionalidades privadas realmente habilitadas en cada momento para tu tipo de cuenta.

Las cuentas del equipo editorial pueden disponer de funcionalidades adicionales de gestión de contenidos, asignadas exclusivamente por la administración del medio.

Registrarse **no** implica suscribirse al boletín de RollerZone: la suscripción al boletín es un consentimiento independiente y voluntario.

## 5. Uso permitido

El uso de RollerZone.es debe ser lícito, respetuoso y conforme a estas condiciones. Queda prohibido, en particular:

- Acceder o intentar acceder sin autorización a cuentas, sistemas o áreas restringidas.
- Manipular, alterar o interferir en el funcionamiento del servicio o en sus datos.
- Suplantar la identidad de otras personas, clubes, federaciones u organizaciones.
- Utilizar sistemas automatizados de forma abusiva (extracción masiva de contenidos, peticiones masivas, envío automatizado de formularios).
- Introducir malware, código malicioso o realizar cualquier acción que comprometa la seguridad del servicio.
- Emplear el sitio para actividades ilícitas o para vulnerar derechos de terceros.

## 6. Suspensión o cancelación de cuentas

RollerZone puede suspender o cancelar una cuenta cuando concurra un incumplimiento de estas condiciones, fraude, abuso del servicio, ataques o intentos de intrusión, suplantación o utilización ilícita. La medida se aplicará de forma proporcionada al incumplimiento detectado.

Puedes solicitar en cualquier momento la eliminación de tu cuenta a través del formulario de contacto.

## 7. Propiedad intelectual

Los textos, reportajes, diseños, elementos gráficos, marcas y demás contenidos elaborados por RollerZone son titularidad de RollerZone o de sus autores, y no pueden reproducirse ni reutilizarse sin autorización, salvo los usos permitidos por la ley con cita de la fuente.

Parte del material publicado procede de terceros: fotografías de autores externos, federaciones, clubes, organizadores de competiciones, agencias o colaboradores. Ese material pertenece a sus respectivos titulares y se publica con su autorización o en el marco del derecho de información, con atribución cuando así se ha facilitado. RollerZone no reclama derechos sobre contenidos de terceros.

Las denominaciones, escudos y marcas de federaciones, clubes, competiciones y patrocinadores pertenecen a sus titulares y se utilizan únicamente con finalidad informativa.

## 8. Contenido enviado por usuarios

RollerZone pone a disposición formularios para remitir noticias, eventos, información e imágenes. Quien envía contenido declara que **dispone de legitimación o autorización suficiente** para ello y que el envío no vulnera derechos de terceros.

Al remitir material, la persona que lo envía autoriza a RollerZone únicamente a lo razonablemente necesario para valorar la propuesta y, cuando proceda, publicarla en RollerZone.es y en sus canales de difusión habituales, con la atribución que corresponda. **No se produce una cesión total ni exclusiva de derechos**: la titularidad permanece en quien la ostente.

RollerZone puede decidir no publicar el material recibido, editarlo por motivos de estilo o extensión, o retirarlo posteriormente si se detecta un problema de derechos, veracidad o legalidad.

## 9. Privacidad

El tratamiento de datos personales se explica en la [Política de Privacidad y Protección de Datos](/legal/privacidad).

## 10. Cookies

El uso de cookies y tecnologías similares, así como la gestión de tus preferencias, se detalla en la [Política de Cookies](/legal/cookies).

## 11. Modificaciones

RollerZone puede actualizar estas condiciones para adaptarlas a cambios en las funcionalidades del sitio o a la normativa aplicable. La versión vigente y su fecha de actualización figuran siempre al inicio de esta página.

Cuando los cambios sean relevantes, se informará de forma visible en el sitio web y, si afectan a las cuentas registradas, se solicitará de nuevo la aceptación en el momento del acceso o mediante aviso a la dirección de correo asociada a la cuenta.

## 12. Contacto

Para cualquier cuestión relativa a estas condiciones puedes escribir a **rollerzonespain@gmail.com** o utilizar el formulario de contacto del sitio.
$md$
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, updated_at = now();