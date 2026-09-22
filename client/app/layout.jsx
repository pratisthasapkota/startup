import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
  title: {
    default: 'VoltMart — Buy & Sell Electronics, Hardware and Books',
    template: '%s · VoltMart',
  },
  description:
    'VoltMart is Nepal’s fair-price marketplace for Arduino, ESP32-CAM, sensors, components, robotics parts and maker books. Buy or sell with verified sellers.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#4f46e5' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}