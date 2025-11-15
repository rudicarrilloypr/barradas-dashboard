import './globals.css';
import Layout from './components/Layout';

export const metadata = {
  title: 'Barradas Nexus',
  description: 'Panel de gestión comercial y marketing digital de Barradas',
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-50">
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
