# Barradas Nexus

Dashboard comercial interno para Barradas, conectado a Shopify.

En palabras simples: esta app toma informacion de la tienda Shopify y la convierte en pantallas faciles de leer para saber como va el negocio, que productos estan listos para vender, que contactos se pueden trabajar y que acciones conviene tomar.

Repositorio: `rudicarrilloypr/barradas-dashboard`

## Que hace la app

Barradas Nexus es una app web interna. No es la tienda publica, no vende directamente y no reemplaza Shopify. Su trabajo es leer datos de Shopify y mostrarlos como reportes comerciales.

La app ayuda a responder preguntas como:

- Cuantos productos activos hay en el catalogo.
- Si hay productos sin imagen, sin tipo, sin precio o sin stock.
- Cuantas ordenes existen y cuanto se ha vendido.
- Cual es el ticket promedio.
- Cuantos clientes o leads hay registrados.
- Cuantos leads tienen datos utiles para seguimiento.
- Que acciones comerciales conviene revisar primero.
- Como generar un PDF sencillo para compartir un resumen.

## Que NO hace

Para evitar confusiones:

- No procesa pagos.
- No modifica productos en Shopify.
- No cambia inventario.
- No envia correos ni WhatsApps.
- No crea campanas de marketing.
- No mide palabras buscadas dentro del buscador de la tienda todavia.
- No muestra informacion si Shopify no esta conectado o si faltan permisos.

## De donde salen los datos

La app lee datos desde la Shopify Admin API:

- Productos: `read_products`
- Ordenes: `read_orders`
- Clientes/leads: `read_customers`

Si se quiere leer historial de ordenes mas antiguo, Shopify puede requerir:

- `read_all_orders`

Los datos se consultan desde el servidor de Next.js. Las llaves de Shopify viven en `.env.local`, por eso no se suben a GitHub.

## Secciones de la app

### Resumen

Es la pantalla principal.

Sirve para ver rapidamente el estado general del negocio:

- Ventas del rango seleccionado.
- Ordenes totales.
- Ticket promedio.
- Productos activos.
- Leads registrados.
- Leads del periodo.
- Graficas de ventas, catalogo y leads.
- Boton para descargar un PDF de resumen comercial.

Uso recomendado: abrir esta seccion para una lectura rapida antes de tomar decisiones.

### Ventas

Muestra las ordenes que vienen de Shopify.

Ayuda a revisar:

- Total vendido.
- Numero de ordenes.
- Estado de pago.
- Cliente.
- Fecha.
- Evolucion de ventas por dia.

Uso recomendado: revisar si hay ventas nuevas, pagos pendientes o comportamiento por periodo.

### Catalogo

Antes se sentia como una lista de productos. Ahora funciona mas como una auditoria comercial del catalogo.

Mide:

- Productos activos.
- Productos en borrador.
- Productos archivados.
- Productos con alertas.
- Productos sin imagen.
- Productos sin tipo.
- Productos con stock bajo.
- Productos sin stock.
- Categorias con mas productos.
- Lista de productos con precio, stock y alertas.

Uso recomendado: revisar que el catalogo este listo antes de invertir en publicidad o enviar trafico a la tienda.

### Leads

Muestra clientes/contactos registrados en Shopify.

Mide:

- Leads totales.
- Leads contactables.
- Leads con email.
- Leads con telefono.
- Leads incompletos.
- Pais principal.
- Evolucion mensual de leads.
- Calidad de cada contacto.

Un lead contactable es alguien que tiene email o telefono. Un lead incompleto puede tener datos faltantes como nombre, telefono, email o pais.

Uso recomendado: saber si los contactos realmente sirven para seguimiento comercial.

### Inteligencia

Es la seccion ejecutiva.

Cruza ventas, catalogo y leads para dar una lectura mas practica:

- Resumen ejecutivo.
- Ventas del periodo.
- Ticket promedio.
- Catalogo activo.
- Leads contactables.
- Acciones recomendadas.
- Prioridades por area.
- Mix de catalogo.
- Captacion de leads.
- Top productos por ingresos cuando ya existan ventas.
- PDF de reporte ejecutivo.

Uso recomendado: usar esta seccion para juntas, decisiones semanales o revision comercial.

### Conexion

Muestra si la app esta conectada correctamente con Shopify.

Ayuda a revisar:

- Dominio de tienda conectado.
- Version de API de Shopify.
- Modo de autenticacion.
- Permisos necesarios.
- Estado de conexion.

Uso recomendado: revisar esta seccion cuando la app no carga datos o cuando se cambian permisos en Shopify.

## Rangos de fecha

Varias secciones permiten elegir el rango:

- Ultimos 30 dias.
- Ultimos 90 dias.
- Ano en curso.
- Todo el historial.

Esto sirve para comparar informacion reciente contra informacion historica.

## PDF de reportes

La app puede generar PDFs desde:

- Resumen: PDF de resumen comercial.
- Inteligencia: PDF de reporte ejecutivo.

Los PDFs estan pensados para compartir una lectura rapida, no para reemplazar un reporte contable formal.

## MVP de asistente para Shopify

La app incluye un primer MVP de asistente virtual para la tienda. El asistente
se llama Barry y usa un icono de pinguino como mascota.

Barry ya no funciona como conversacion abierta. Ahora usa un flujo guiado de
opciones multiples para que el cliente elija lo que necesita y, al final, se
genere un ticket para el asesor digital.

- Pagina interna de prueba: `http://localhost:3000/assistant`
- Preview del widget: `http://localhost:3000/assistant-widget-preview.html`
- Endpoint: `POST /api/shopify-assistant`
- Widget publico: `/shopify-assistant.js`

El flujo pregunta por datos como:

- Necesidad principal.
- Categoria o tipo de soporte.
- Uso o contexto.
- Urgencia.
- Presupuesto.

Con esas respuestas, Barry arma un mensaje de WhatsApp para el asesor digital.
El WhatsApp por defecto del asesor es:

```text
2281335996
```

El link de WhatsApp se genera con lada de Mexico (`52`) y un ticket prellenado.
Si el cliente completo suficientes opciones, el ticket incluye esas respuestas.
Si no hay suficiente informacion, el mensaje base es:

```text
Hola, vengo de la pagina de Barradas y busco asesoria personalizada.
```

Para incrustarlo en Shopify despues de desplegar la app:

```html
<script
  src="https://TU-DOMINIO/shopify-assistant.js"
  data-store-name="Barradas"
  data-assistant-name="Barry"
  data-advisor-url="https://wa.me/52NUMERO?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor"
  defer
></script>
```

Opcionalmente se puede personalizar:

```html
<script
  src="https://TU-DOMINIO/shopify-assistant.js"
  data-store-name="Barradas"
  data-assistant-name="Barry"
  data-accent="#2563eb"
  data-mascot-url="https://TU-DOMINIO/barry-avatar.png"
  data-advisor-url="https://wa.me/52NUMERO?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor"
  defer
></script>
```

Variables opcionales:

```env
SHOPIFY_STOREFRONT_DOMAIN=barradas.mx
SHOPIFY_ASSISTANT_ALLOWED_ORIGIN=https://barradas.mx,https://www.barradas.mx
SHOPIFY_ASSISTANT_WHATSAPP_PHONE=522281335996
```

Como alternativa, se puede configurar una URL completa:

```env
SHOPIFY_ASSISTANT_ADVISOR_URL=https://wa.me/522281335996
```

Si no se configura `SHOPIFY_STOREFRONT_DOMAIN`, los links de productos usan
`SHOPIFY_SHOP_DOMAIN`.

## Rendimiento y carga

La app consulta Shopify en vivo, pero usa una cache corta para que no se sienta lenta al cambiar de seccion.

Por defecto, la cache dura 60 segundos.

Se puede cambiar con:

```env
SHOPIFY_CACHE_TTL_MS=60000
```

Si el valor es `0`, se desactiva la cache y cada seccion consulta Shopify desde cero.

## Tecnologias usadas

- Next.js 16
- React 19
- Tailwind CSS
- Shopify Admin REST API
- Recharts
- jsPDF
- jspdf-autotable

## Como correr la app en local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear `.env.local`

En la raiz del proyecto, crear un archivo llamado:

```text
.env.local
```

### 3. Configurar Shopify

Para una app nueva de Shopify Dev Dashboard:

```env
SHOPIFY_SHOP_DOMAIN=tu-tienda.myshopify.com
SHOPIFY_CLIENT_ID=tu_client_id
SHOPIFY_CLIENT_SECRET=tu_client_secret
```

Importante: `SHOPIFY_SHOP_DOMAIN` debe ser el dominio original de Shopify, normalmente termina en `.myshopify.com`. No uses el dominio conectado en GoDaddy.

Si se usa una app legacy con token fijo:

```env
SHOPIFY_SHOP_DOMAIN=tu-tienda.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=tu_admin_api_token
```

### 4. Revisar permisos en Shopify

La app necesita permisos de lectura:

```text
read_products
read_orders
read_customers
```

Opcional:

```text
read_all_orders
```

### 5. Levantar la app

```bash
npm run dev
```

Luego abrir:

```text
http://localhost:3000
```

## Comandos utiles

Revisar errores de estilo/codigo:

```bash
npm run lint
```

Crear build de produccion:

```bash
npm run build
```

Arrancar build de produccion:

```bash
npm run start
```

## Problemas comunes

### La app no carga datos

Revisar:

- Que `.env.local` exista.
- Que el dominio sea `tu-tienda.myshopify.com`.
- Que las llaves de Shopify esten correctas.
- Que la app de Shopify tenga permisos actualizados.
- Que la app este instalada en la tienda correcta.

### Las ordenes no aparecen completas

Shopify puede limitar historial de ordenes si no esta aprobado o configurado el permiso `read_all_orders`.

### La app tarda en cargar

La primera carga puede tardar porque consulta Shopify. Despues, la cache corta ayuda a que navegar entre secciones sea mas rapido.

### Veo cero ventas

Eso puede ser normal si la tienda todavia no tiene ordenes reales o si el rango seleccionado no incluye ventas.

## Estado actual del proyecto

La app ya cuenta con:

- Conexion a Shopify.
- Dashboard general.
- Modulo de ventas.
- Salud del catalogo.
- Calidad de leads.
- Inteligencia comercial.
- Exportacion a PDF.
- Cache corta para mejorar velocidad.
- Pantalla de carga.
- Navegacion interna.

Pendientes posibles a futuro:

- Medir palabras buscadas en el buscador de la tienda.
- Exportar reportes a Excel.
- Alertas automaticas de stock o ventas bajas.
- Comparativos contra periodos anteriores.
- Roles de usuario.
- Instalacion como app de escritorio o PWA mas completa.

## Autor

Rodolfo Carrillo

GitHub: `@rudicarrilloypr`

## Licencia

Proyecto interno/comercial de Barradas.
