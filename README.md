<a name="readme-top"></a>

<div align="center"> <img src="./public/icon.png" alt="Barradas Nexus Logo" width="40" height="auto" /> <h2><b>Barradas Nexus ⚡</b></h2> <p><i>Dashboard comercial interno conectado 100% en tiempo real con Shopify.</i></p> <img src="./app/assets/banner_nexus.png" alt="Barradas Nexus Banner"/> </div>
📘 Table of Contents

📖 About the Project

🛠 Built With

Tech Stack

Key Features

🚀 Getting Started

Prerequisites

Setup

Environment Variables

Install

Run

📊 Modules Overview

👥 Authors

🙏 Acknowledgements

🔮 Future Features

🤝 Contributing

⭐ Show Your Support

📝 License

📖 Barradas Nexus <a name="about-project"></a>

Barradas Nexus is an internal, production-ready commercial dashboard designed for Barradas.mx.
It integrates directly with Shopify Admin API, providing real-time analytics, catalog insights, sales tracking, lead management, and auto-generated PDF business reports—all within an elegant and responsive interface.

This app replaces the need for manual reports and fragmented data by centralizing KPIs, trends, growth indicators, and operational information in a single unified tool.

🛠 Built With <a name="built-with"></a>

Next.js 14 (App Router + Server Components)

TailwindCSS

Shopify Admin REST API

Recharts

jsPDF + jspdf-autotable

Node.js 20+

Tech Stack <a name="tech-stack"></a>
<details> <summary>Client</summary> <ul> <li>Next.js App Router</li> <li>TailwindCSS</li> <li>Recharts</li> </ul> </details> <details> <summary>Server</summary> <ul> <li>Next.js Server Components</li> <li>Shopify Admin API</li> </ul> </details> <details> <summary>Utilities</summary> <ul> <li>jsPDF</li> <li>jspdf-autotable</li> </ul> </details>
✨ Key Features <a name="key-features"></a>
📊 Overview Dashboard

KPIs: ventas, productos, leads, órdenes.

Gráficas de crecimiento del catálogo.

Tendencia de ventas por día.

Tendencia de leads acumulados.

Selector de rango dinámico: 30d, 90d, YTD, All time.

Exportación a PDF empresarial.

💰 Sales Module

Listado de órdenes sincronizadas con Shopify.

Total de ventas, estados, clientes y fechas.

Gráfica de ventas por día (real time).

📦 Products

Catálogo directo desde Shopify.

Soporte para paginación y grandes inventarios.

👥 Leads (Clientes)

Lista de clientes/leads registrados en Shopify.

Crecimiento acumulado por día.

Estadísticas de adquisición.

📈 Insights

Top productos por ingresos.

Ventas por mes.

Leads por mes.

Tendencias automáticas.

Reporte PDF corporativo completo.

⚙️ Settings

Información del usuario.

Estado de API e integraciones.

Future system config.

🚀 Getting Started <a name="getting-started"></a>
📌 Prerequisites <a name="prerequisites"></a>

Asegúrate de tener instalado:

Node.js v18+

npm 9+

Una tienda de Shopify y un Admin API Token con permisos:

read_products

read_customers

read_orders

🧩 Setup <a name="setup"></a>

Clona el repositorio:

git clone git@github.com:rudicarrilloypr/barradas-nexus.git


Entra al proyecto:

cd barradas-nexus

🔐 Environment Variables <a name="env"></a>

Crea un archivo:

.env.local


Agrega:

SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_api_token

📦 Install <a name="install"></a>
npm install

▶️ Run <a name="run"></a>

Modo desarrollo:

npm run dev


Luego visita:

http://localhost:3000

📊 Modules Overview <a name="modules"></a>
Módulo	Descripción
Overview	KPIs globales + rango + PDF
Sales	Detalle de órdenes desde Shopify
Products	Catálogo en tiempo real
Leads	Clientes/leads + crecimiento
Insights	Inteligencia comercial + PDF avanzado
Settings	Información del usuario y estado del sistema
👥 Authors <a name="authors"></a>

👤 Rodolfo Carrillo

GitHub: @rudicarrilloypr

Twitter: @__rudicarrillo

LinkedIn: Rudi Carrillo

🙏 Acknowledgements <a name="acknowledgements"></a>

A todo el equipo de Barradas por confiar en el desarrollo del nuevo ecosistema digital.
Y a todos quienes aportaron ideas para la evolución del dashboard.

🔮 Future Features <a name="future-features"></a>

Multi-sucursal & multi-inventario.

Gráficas avanzadas (funnels, cohortes, heatmaps).

Alerts automáticos (ventas bajas, alta demanda, SKUs agotados).

User roles y permisos por perfil.

Exportación en Excel.

Dark/Light theme switch.

🤝 Contributing <a name="contributing"></a>

Contribuciones son bienvenidas.
Haz un fork, crea un branch, envía un pull request.

⭐ Show Your Support <a name="support"></a>

Si este proyecto te es útil, dale una ⭐ en GitHub o compártelo con tu equipo.

📝 License <a name="license"></a>

Este proyecto está bajo la licencia MIT.