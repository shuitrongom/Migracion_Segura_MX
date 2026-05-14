# Documento de Requerimientos

## Introducción

**Migración Segura MX** es una plataforma integral de gestión migratoria compuesta por una aplicación móvil para clientes (iOS y Android) y un panel administrativo web. La plataforma centraliza y automatiza toda la operación migratoria de la empresa: desde el registro del cliente y la gestión de trámites hasta el control documental, la agenda de citas, el módulo financiero y las comunicaciones automatizadas. El objetivo es reducir errores humanos, mejorar tiempos de respuesta, profesionalizar la atención al cliente y escalar las operaciones de la empresa.

---

## Glosario

- **Sistema**: La plataforma Migración Segura MX en su conjunto (app móvil + panel web + backend).
- **App_Movil**: La aplicación móvil disponible para iOS y Android destinada a los clientes.
- **Panel_Admin**: El panel administrativo web utilizado por el equipo interno de la empresa.
- **Cliente**: Persona física que contrata los servicios migratorios y utiliza la App_Movil.
- **Asesor**: Empleado de la empresa que gestiona trámites y atiende clientes desde el Panel_Admin.
- **Administrador**: Usuario con permisos totales sobre el Panel_Admin, incluyendo configuración y reportes.
- **Tramite**: Proceso migratorio formal asociado a un Cliente (ej. residencia temporal, visa, nacionalidad).
- **Expediente**: Conjunto de documentos y datos asociados a un Tramite de un Cliente.
- **Documento**: Archivo digital (PDF, JPG o PNG) cargado por el Cliente o el Asesor como parte de un Expediente.
- **Estatus**: Estado actual de un Tramite dentro de su ciclo de vida (ej. Recibido, En revisión, Aprobado, Rechazado).
- **Notificacion**: Mensaje enviado al Cliente o al Asesor a través de push, correo electrónico o WhatsApp.
- **Cita**: Evento agendado entre un Cliente y un Asesor con fecha, hora y modalidad definidas.
- **Ticket**: Solicitud de soporte abierta por un Cliente para recibir atención de un Asesor.
- **Rol**: Conjunto de permisos asignados a un usuario del sistema (Cliente, Asesor, Administrador).
- **Autenticador**: Componente del Sistema responsable de verificar la identidad de los usuarios.
- **Gestor_Documentos**: Componente del Sistema responsable de almacenar, validar y organizar Documentos.
- **Motor_Notificaciones**: Componente del Sistema responsable de enviar Notificaciones por todos los canales.
- **Motor_Automatizaciones**: Componente del Sistema responsable de ejecutar flujos automáticos basados en eventos o temporizadores.
- **Modulo_Financiero**: Componente del Panel_Admin responsable del registro de pagos, recibos y reportes de ingresos.
- **Modulo_Reportes**: Componente del Panel_Admin responsable de generar estadísticas y reportes operativos.

---

## Requerimientos

---

### Requerimiento 1: Registro e inicio de sesión del Cliente

**Historia de usuario:** Como Cliente, quiero registrarme e iniciar sesión de forma segura en la App_Movil, para acceder a mis trámites y documentos desde cualquier dispositivo.

#### Criterios de aceptación

1. THE App_Movil SHALL permitir al Cliente registrarse proporcionando correo electrónico y número de teléfono.
2. WHEN el Cliente completa el formulario de registro, THE Autenticador SHALL enviar un código de verificación al correo electrónico o al número de teléfono indicado.
3. WHEN el Cliente ingresa el código de verificación correcto, THE Autenticador SHALL activar la cuenta y permitir el acceso.
4. IF el código de verificación ingresado es incorrecto o ha expirado, THEN THE Autenticador SHALL mostrar un mensaje de error descriptivo y ofrecer reenviar el código.
5. THE App_Movil SHALL permitir al Cliente iniciar sesión con correo electrónico y contraseña.
6. THE App_Movil SHALL permitir al Cliente iniciar sesión mediante su cuenta de Google.
7. THE App_Movil SHALL permitir al Cliente iniciar sesión mediante Apple ID en dispositivos iOS.
8. WHEN el Cliente solicita recuperación de contraseña, THE Autenticador SHALL enviar un enlace de restablecimiento al correo electrónico registrado con vigencia de 30 minutos.
9. THE App_Movil SHALL permitir al Cliente editar su nombre, foto de perfil, teléfono y correo electrónico desde la sección de perfil.
10. WHEN el Cliente actualiza su correo electrónico o teléfono, THE Autenticador SHALL requerir verificación del nuevo dato antes de aplicar el cambio.
11. IF se detectan 5 intentos de inicio de sesión fallidos consecutivos, THEN THE Autenticador SHALL bloquear temporalmente el acceso por 15 minutos y notificar al Cliente por correo electrónico.

---

### Requerimiento 2: Dashboard principal del Cliente

**Historia de usuario:** Como Cliente, quiero ver un resumen claro de mi situación migratoria al abrir la app, para conocer el estado de mis trámites, mis próximas citas y los documentos pendientes sin necesidad de navegar por múltiples pantallas.

#### Criterios de aceptación

1. WHEN el Cliente inicia sesión, THE App_Movil SHALL mostrar el dashboard con el estatus actual del Tramite activo más reciente.
2. THE App_Movil SHALL mostrar el porcentaje de progreso del Tramite activo calculado en función de las etapas completadas sobre el total de etapas del proceso.
3. THE App_Movil SHALL mostrar las últimas 3 actualizaciones de estatus del Tramite activo con fecha y descripción.
4. THE App_Movil SHALL mostrar las próximas Citas del Cliente con fecha, hora y nombre del Asesor asignado.
5. THE App_Movil SHALL mostrar la lista de Documentos con estatus "Pendiente" que el Cliente debe cargar.
6. THE App_Movil SHALL mostrar alertas destacadas cuando existan documentos vencidos o fechas límite próximas en los siguientes 7 días.
7. THE App_Movil SHALL mostrar el tiempo estimado restante del proceso migratorio activo, expresado en días hábiles.
8. WHEN no existe un Tramite activo, THE App_Movil SHALL mostrar un acceso directo para iniciar un nuevo Tramite.

---

### Requerimiento 3: Inicio y gestión de trámites desde la App_Movil

**Historia de usuario:** Como Cliente, quiero iniciar y gestionar mis trámites migratorios desde la app, para enviar mi información y documentos sin necesidad de acudir físicamente a las oficinas.

#### Criterios de aceptación

1. THE App_Movil SHALL permitir al Cliente iniciar un nuevo Tramite seleccionando uno de los siguientes tipos: Residencia Temporal, Residencia Permanente, Regularización, Cambio de Condición Migratoria, Visa, Nacionalidad, Permiso de Trabajo, Renovación.
2. WHEN el Cliente selecciona un tipo de Tramite, THE App_Movil SHALL mostrar el formulario de información personal requerido para ese tipo específico.
3. THE App_Movil SHALL permitir al Cliente adjuntar Documentos en formato PDF, JPG o PNG como parte de la solicitud del Tramite.
4. THE App_Movil SHALL permitir al Cliente firmar digitalmente los formatos requeridos dentro del flujo del Tramite.
5. WHEN el Cliente envía la solicitud del Tramite, THE Sistema SHALL asignar un número de pieza único al Tramite y notificar al Cliente por correo electrónico y notificación push.
6. IF el Cliente intenta enviar una solicitud con campos obligatorios vacíos, THEN THE App_Movil SHALL mostrar los campos faltantes resaltados y bloquear el envío hasta que sean completados.
7. THE App_Movil SHALL permitir al Cliente guardar un Tramite en borrador para continuar su llenado en una sesión posterior.

---

### Requerimiento 4: Consulta de estatus del Tramite

**Historia de usuario:** Como Cliente, quiero consultar el estatus de mi trámite en tiempo real, para saber exactamente en qué etapa se encuentra mi proceso y qué acciones debo tomar.

#### Criterios de aceptación

1. THE App_Movil SHALL permitir al Cliente consultar el estatus de su Tramite ingresando el número de pieza y la contraseña del Tramite, sin necesidad de iniciar sesión.
2. WHEN el Cliente accede al detalle de su Tramite, THE App_Movil SHALL mostrar la línea de tiempo completa del proceso con las etapas: Recepción de solicitud, En revisión, En espera de resolución, Aprobado/Rechazado.
3. THE App_Movil SHALL mostrar las observaciones registradas por el Asesor en cada etapa del Tramite.
4. THE App_Movil SHALL mostrar la lista de Documentos faltantes o rechazados con la razón del rechazo.
5. WHEN el Tramite alcanza el estatus "Aprobado" o "Rechazado", THE App_Movil SHALL mostrar la resolución con fecha y permitir al Cliente descargar el comprobante correspondiente.
6. WHEN el estatus del Tramite cambia, THE Motor_Notificaciones SHALL enviar una Notificacion push y por correo electrónico al Cliente en un plazo máximo de 5 minutos.

---

### Requerimiento 5: Gestión documental del Cliente

**Historia de usuario:** Como Cliente, quiero subir, organizar y consultar mis documentos desde la app, para mantener mi Expediente completo y recibir alertas cuando algún documento requiera atención.

#### Criterios de aceptación

1. THE App_Movil SHALL permitir al Cliente subir Documentos en formato PDF, JPG o PNG con un tamaño máximo de 20 MB por archivo.
2. WHEN el Cliente sube un Documento, THE Gestor_Documentos SHALL validar que el archivo no esté corrupto y que cumpla con el formato y tamaño permitidos antes de almacenarlo.
3. IF el Documento subido no cumple con el formato o tamaño permitidos, THEN THE App_Movil SHALL mostrar un mensaje de error descriptivo indicando el problema específico.
4. THE App_Movil SHALL mostrar cada Documento con su estatus: Recibido, En revisión, Aprobado o Rechazado.
5. THE App_Movil SHALL permitir al Cliente descargar cualquier Documento previamente subido desde su Expediente.
6. WHEN un Documento tiene fecha de vencimiento y faltan 30 días o menos para su expiración, THE Motor_Notificaciones SHALL enviar una Notificacion al Cliente por correo electrónico y push.
7. THE App_Movil SHALL organizar los Documentos del Cliente agrupados por Tramite al que pertenecen.

---

### Requerimiento 6: Sistema de notificaciones al Cliente

**Historia de usuario:** Como Cliente, quiero recibir notificaciones oportunas sobre mi trámite por los canales que utilizo habitualmente, para no perder ninguna actualización importante sin tener que revisar la app constantemente.

#### Criterios de aceptación

1. THE Motor_Notificaciones SHALL enviar notificaciones push a la App_Movil del Cliente para los siguientes eventos: cambio de estatus del Tramite, Documento rechazado, Documento faltante, Cita próxima, pago pendiente y mensaje del Asesor.
2. THE Motor_Notificaciones SHALL enviar correos electrónicos automáticos al Cliente para los mismos eventos listados en el criterio anterior.
3. WHERE el Cliente ha proporcionado número de teléfono con WhatsApp, THE Motor_Notificaciones SHALL enviar mensajes de WhatsApp automatizados para recordatorios de Cita y avisos de cambio de estatus.
4. WHEN una Cita está programada, THE Motor_Notificaciones SHALL enviar un recordatorio al Cliente 24 horas antes y otro 1 hora antes de la Cita.
5. THE App_Movil SHALL mostrar un centro de notificaciones donde el Cliente pueda consultar el historial de todas las Notificaciones recibidas.
6. THE App_Movil SHALL permitir al Cliente configurar qué tipos de Notificaciones desea recibir por cada canal disponible (push, correo, WhatsApp).

---

### Requerimiento 7: Módulo de soporte al Cliente

**Historia de usuario:** Como Cliente, quiero contactar a mi asesor de forma rápida y por distintos medios, para resolver dudas y recibir atención personalizada sin fricciones.

#### Criterios de aceptación

1. THE App_Movil SHALL permitir al Cliente abrir un Ticket de soporte describiendo su consulta o problema.
2. WHEN el Cliente abre un Ticket, THE Sistema SHALL asignar el Ticket al Asesor responsable del Tramite activo del Cliente y notificar al Asesor por correo electrónico.
3. THE App_Movil SHALL permitir al Cliente enviar mensajes de texto al Asesor asignado dentro del hilo del Ticket.
4. THE App_Movil SHALL mostrar un botón de acceso directo para iniciar una conversación de WhatsApp con el número de contacto de la empresa.
5. THE App_Movil SHALL mostrar un botón para llamar directamente al número de teléfono de la empresa.
6. THE App_Movil SHALL permitir al Cliente solicitar una videollamada con su Asesor, seleccionando fecha y hora disponibles del calendario del Asesor.
7. WHEN el Asesor responde un Ticket, THE Motor_Notificaciones SHALL enviar una Notificacion push y por correo al Cliente en un plazo máximo de 5 minutos.

---

### Requerimiento 8: Dashboard administrativo

**Historia de usuario:** Como Administrador, quiero ver métricas clave de la operación en tiempo real desde el Panel_Admin, para tomar decisiones informadas sobre la capacidad y el rendimiento del equipo.

#### Criterios de aceptación

1. THE Panel_Admin SHALL mostrar en el dashboard el total de Clientes registrados, el número de Tramites activos, el número de casos aprobados y el número de casos rechazados, actualizados en tiempo real.
2. THE Panel_Admin SHALL mostrar una gráfica de distribución de Tramites por Estatus actualizada cada 5 minutos.
3. THE Panel_Admin SHALL mostrar los indicadores KPI: tiempo promedio de resolución de Tramites (en días hábiles), tasa de aprobación (porcentaje de Tramites aprobados sobre el total cerrado) y tasa de documentos rechazados.
4. THE Panel_Admin SHALL mostrar un listado de las últimas 10 actividades recientes en el sistema con usuario, acción y marca de tiempo.
5. THE Panel_Admin SHALL mostrar las Citas programadas para el día actual con nombre del Cliente, Asesor asignado y hora.
6. THE Panel_Admin SHALL permitir al Administrador filtrar todas las métricas del dashboard por rango de fechas.

---

### Requerimiento 9: Gestión de Clientes en el Panel_Admin

**Historia de usuario:** Como Asesor o Administrador, quiero crear, editar y consultar los expedientes de los Clientes desde el Panel_Admin, para mantener la información organizada y asignar responsabilidades de forma eficiente.

#### Criterios de aceptación

1. THE Panel_Admin SHALL permitir al Asesor crear un nuevo Cliente manualmente ingresando nombre completo, correo electrónico, teléfono y tipo de trámite inicial.
2. THE Panel_Admin SHALL permitir al Asesor editar los datos del perfil de cualquier Cliente asignado a su cartera.
3. THE Panel_Admin SHALL permitir al Administrador asignar o reasignar un Asesor a cualquier Cliente.
4. THE Panel_Admin SHALL permitir buscar Clientes por nombre, correo electrónico, número de pieza o número de teléfono.
5. THE Panel_Admin SHALL permitir filtrar la lista de Clientes por Estatus del Tramite: Todos, En proceso, En revisión, Aprobados, Rechazados.
6. THE Panel_Admin SHALL mostrar el historial completo de actividad de cada Cliente: cambios de estatus, documentos subidos, notas y comunicaciones.
7. THE Panel_Admin SHALL permitir al Asesor agregar notas internas a un Cliente, visibles únicamente para el equipo interno.
8. THE Panel_Admin SHALL permitir al Asesor asignar etiquetas personalizadas a los Clientes para su categorización.

---

### Requerimiento 10: Gestión de Trámites en el Panel_Admin

**Historia de usuario:** Como Asesor, quiero gestionar los trámites de mis clientes desde el Panel_Admin, para actualizar estatus, agregar observaciones, aprobar documentos y controlar fechas límite de forma centralizada.

#### Criterios de aceptación

1. THE Panel_Admin SHALL permitir al Asesor cambiar el Estatus de un Tramite seleccionando el nuevo estatus de una lista predefinida.
2. WHEN el Asesor cambia el Estatus de un Tramite, THE Motor_Notificaciones SHALL notificar al Cliente por push y correo electrónico en un plazo máximo de 5 minutos.
3. THE Panel_Admin SHALL permitir al Asesor asignar un responsable interno a cada Tramite.
4. THE Panel_Admin SHALL permitir al Asesor agregar observaciones escritas a cada etapa del Tramite, visibles para el Cliente en la línea de tiempo.
5. THE Panel_Admin SHALL permitir al Asesor programar tareas internas con fecha límite asociadas a un Tramite.
6. WHEN la fecha límite de una tarea interna está a 48 horas o menos, THE Panel_Admin SHALL mostrar una alerta visual al Asesor responsable.
7. THE Panel_Admin SHALL permitir al Asesor aprobar o rechazar Documentos individuales del Expediente, indicando la razón del rechazo cuando aplique.
8. THE Panel_Admin SHALL permitir al Administrador crear plantillas de proceso personalizadas con etapas y documentos requeridos para cada tipo de Tramite.
9. THE Panel_Admin SHALL generar automáticamente el Expediente digital del Cliente al crear un nuevo Tramite, incluyendo la lista de documentos requeridos según el tipo de Tramite.

---

### Requerimiento 11: Control documental en el Panel_Admin

**Historia de usuario:** Como Asesor, quiero gestionar el expediente digital de cada cliente desde el Panel_Admin, para validar documentos, mantener el historial de cambios y descargar archivos de forma eficiente.

#### Criterios de aceptación

1. THE Panel_Admin SHALL mostrar el Expediente digital completo de cada Cliente con todos sus Documentos organizados por Tramite y categoría.
2. THE Panel_Admin SHALL permitir al Asesor aprobar o rechazar cada Documento con un comentario de retroalimentación.
3. THE Panel_Admin SHALL registrar el historial de cambios de cada Documento: quién lo subió, quién lo revisó, fecha y resultado de la revisión.
4. THE Panel_Admin SHALL permitir al Asesor o Administrador descargar de forma masiva todos los Documentos de un Expediente en un archivo comprimido ZIP.
5. THE Panel_Admin SHALL permitir la firma electrónica de documentos oficiales dentro del flujo del Tramite.
6. THE Gestor_Documentos SHALL clasificar automáticamente los Documentos subidos por el Cliente según el tipo de archivo y el Tramite al que pertenecen.

---

### Requerimiento 12: Agenda y gestión de Citas

**Historia de usuario:** Como Asesor o Administrador, quiero gestionar las citas con clientes desde un calendario integrado, para organizar la agenda del equipo y garantizar que los clientes reciban confirmaciones y recordatorios automáticos.

#### Criterios de aceptación

1. THE Panel_Admin SHALL mostrar un calendario interno con todas las Citas programadas, con vistas diaria, semanal y mensual.
2. THE Panel_Admin SHALL permitir al Asesor crear una Cita asignando Cliente, fecha, hora, duración y modalidad (presencial o videollamada).
3. WHEN se crea o modifica una Cita, THE Motor_Notificaciones SHALL enviar una confirmación automática al Cliente por correo electrónico y WhatsApp con los detalles de la Cita.
4. THE Panel_Admin SHALL permitir reagendar una Cita existente, notificando automáticamente al Cliente con los nuevos datos.
5. WHERE el Asesor ha conectado su cuenta de Google Calendar, THE Sistema SHALL sincronizar las Citas bidireccionalemente con Google Calendar.
6. WHEN una Cita es cancelada, THE Motor_Notificaciones SHALL notificar al Cliente por correo electrónico y push en un plazo máximo de 5 minutos.

---

### Requerimiento 13: Módulo financiero

**Historia de usuario:** Como Administrador, quiero registrar pagos, generar recibos y consultar reportes financieros desde el Panel_Admin, para mantener un control preciso de los ingresos y adeudos de cada cliente.

#### Criterios de aceptación

1. THE Modulo_Financiero SHALL permitir al Asesor registrar un pago asociado a un Cliente y a un Tramite, indicando monto, fecha, método de pago y concepto.
2. THE Modulo_Financiero SHALL generar automáticamente un recibo en formato PDF al registrar un pago, disponible para descarga por el Asesor y el Cliente.
3. THE Modulo_Financiero SHALL mostrar el saldo pendiente de cada Cliente calculado como la diferencia entre el total acordado y los pagos registrados.
4. IF el saldo pendiente de un Cliente es mayor a cero y han transcurrido 7 días desde el último pago registrado, THEN THE Motor_Notificaciones SHALL enviar una Notificacion de recordatorio de pago al Cliente por correo electrónico.
5. THE Modulo_Financiero SHALL registrar los métodos de pago aceptados: transferencia bancaria, tarjeta de crédito/débito y efectivo.
6. THE Modulo_Financiero SHALL mostrar el historial financiero completo de cada Cliente con todos los pagos registrados y recibos generados.
7. THE Modulo_Financiero SHALL generar un reporte mensual de ingresos agrupado por tipo de Tramite y método de pago, exportable en formato CSV y PDF.

---

### Requerimiento 14: Sistema de reportes

**Historia de usuario:** Como Administrador, quiero generar reportes operativos y de rendimiento desde el Panel_Admin, para evaluar el desempeño del equipo y la salud del negocio con datos precisos.

#### Criterios de aceptación

1. THE Modulo_Reportes SHALL generar un reporte de rendimiento por Asesor que incluya: número de Tramites activos, Tramites cerrados, tiempo promedio de resolución y tasa de aprobación, filtrable por rango de fechas.
2. THE Modulo_Reportes SHALL generar un reporte de conversión de Clientes que muestre el número de prospectos que iniciaron un Tramite sobre el total de Clientes registrados en un período.
3. THE Modulo_Reportes SHALL generar un reporte de tiempos promedio por tipo de Tramite, mostrando el tiempo medio desde la creación hasta el cierre.
4. THE Modulo_Reportes SHALL generar un reporte de Documentos pendientes que liste los Clientes con Documentos faltantes o rechazados agrupados por tipo de Tramite.
5. THE Modulo_Reportes SHALL permitir exportar cualquier reporte en formato PDF y CSV.
6. THE Modulo_Reportes SHALL mostrar todos los reportes con gráficas visuales de barras o líneas según el tipo de dato.

---

### Requerimiento 15: Motor de automatizaciones

**Historia de usuario:** Como Administrador, quiero que el sistema ejecute flujos de comunicación y seguimiento de forma automática, para reducir la carga operativa del equipo y garantizar que ningún cliente quede sin atención.

#### Criterios de aceptación

1. WHEN un Cliente no ha actualizado su Expediente ni ha tenido actividad en el Sistema durante 14 días consecutivos, THE Motor_Automatizaciones SHALL enviar un mensaje de seguimiento al Cliente por correo electrónico y WhatsApp.
2. WHEN un Documento del Expediente de un Cliente tiene fecha de vencimiento en los próximos 30 días, THE Motor_Automatizaciones SHALL solicitar automáticamente al Cliente la renovación del Documento por correo electrónico y push.
3. WHEN el Tramite de un Cliente avanza a una nueva etapa, THE Motor_Automatizaciones SHALL enviar al Cliente la lista de documentos requeridos para esa etapa por correo electrónico.
4. WHEN el Tramite de un Cliente alcanza el estatus "Aprobado", THE Motor_Automatizaciones SHALL enviar un mensaje de felicitación al Cliente con el comprobante adjunto por correo electrónico.
5. THE Panel_Admin SHALL permitir al Administrador activar o desactivar cada flujo de automatización de forma individual.
6. THE Motor_Automatizaciones SHALL registrar un log de cada mensaje enviado con fecha, canal, destinatario y resultado del envío (entregado, fallido).

---

### Requerimiento 16: Seguridad y control de acceso

**Historia de usuario:** Como Administrador, quiero que la plataforma proteja los datos personales de los clientes y controle el acceso de los usuarios internos mediante roles y permisos, para cumplir con las obligaciones de privacidad y prevenir accesos no autorizados.

#### Criterios de aceptación

1. THE Sistema SHALL cifrar todas las comunicaciones entre clientes y servidores mediante TLS 1.2 o superior.
2. THE Sistema SHALL cifrar los Documentos almacenados en reposo utilizando AES-256.
3. THE Autenticador SHALL implementar autenticación de dos factores (2FA) como opción disponible para todos los usuarios del Panel_Admin.
4. THE Sistema SHALL definir tres Roles con permisos diferenciados: Cliente (acceso solo a su propio Expediente y Tramites), Asesor (acceso a los Clientes y Tramites asignados) y Administrador (acceso total al Sistema).
5. IF un usuario intenta acceder a un recurso para el que no tiene permiso según su Rol, THEN THE Sistema SHALL denegar el acceso y registrar el intento en el log de actividad.
6. THE Sistema SHALL realizar respaldos automáticos de la base de datos cada 24 horas y almacenarlos en una ubicación geográficamente separada del servidor principal.
7. THE Sistema SHALL mantener un historial de actividad de cada usuario del Panel_Admin que registre: acción realizada, recurso afectado, dirección IP y marca de tiempo.
8. WHEN una sesión de usuario del Panel_Admin permanece inactiva durante 30 minutos, THE Autenticador SHALL cerrar la sesión automáticamente y requerir nuevo inicio de sesión.
9. THE Sistema SHALL proteger todos los endpoints de la API REST mediante tokens de autenticación con expiración máxima de 24 horas.

---

### Requerimiento 17: Infraestructura y rendimiento

**Historia de usuario:** Como Administrador, quiero que la plataforma opere sobre una infraestructura escalable en la nube, para garantizar disponibilidad continua y tiempos de respuesta aceptables conforme crece la base de clientes.

#### Criterios de aceptación

1. THE Sistema SHALL estar desplegado en AWS o Google Cloud con configuración de escalado automático horizontal ante incrementos de carga.
2. THE Sistema SHALL mantener una disponibilidad mínima del 99.5% mensual, excluyendo ventanas de mantenimiento programadas.
3. WHEN el número de usuarios concurrentes supera el umbral configurado, THE Sistema SHALL escalar automáticamente los recursos de cómputo sin interrupción del servicio.
4. THE Sistema SHALL responder a las solicitudes de la API REST en un tiempo máximo de 2 segundos bajo condiciones normales de carga (hasta 500 usuarios concurrentes).
5. THE Gestor_Documentos SHALL utilizar un servicio de almacenamiento en la nube (AWS S3 o Google Cloud Storage) con CDN para la entrega de archivos a los Clientes.
6. THE Sistema SHALL ejecutar migraciones de base de datos y actualizaciones de software sin tiempo de inactividad mediante estrategias de despliegue blue-green o rolling update.

---

### Requerimiento 18: Aplicación móvil multiplataforma

**Historia de usuario:** Como Cliente, quiero acceder a la App_Movil desde mi iPhone o dispositivo Android, para gestionar mis trámites desde el dispositivo que utilizo habitualmente.

#### Criterios de aceptación

1. THE App_Movil SHALL estar disponible para descarga en la App Store de Apple y en Google Play Store.
2. THE App_Movil SHALL ser compatible con iOS 15 o superior y Android 10 o superior.
3. THE App_Movil SHALL desarrollarse con Flutter o React Native para mantener una única base de código para ambas plataformas.
4. THE App_Movil SHALL funcionar en modo de solo lectura cuando el dispositivo no tenga conexión a internet, mostrando los últimos datos sincronizados.
5. IF el dispositivo recupera la conexión a internet, THEN THE App_Movil SHALL sincronizar automáticamente los datos pendientes con el servidor.
6. THE App_Movil SHALL cumplir con las guías de diseño Human Interface Guidelines de Apple y Material Design de Google para garantizar una experiencia nativa en cada plataforma.
