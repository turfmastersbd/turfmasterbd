import '../styles/scss/main.scss';
import Header from '@/components/Header'
import Footer from '@/components/Footer';

import { Providers } from './Providers/providers';
import ToastProvider from './Providers/ToastProvider';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import { Suspense } from 'react';

export const metadata = {
  title: "Royel Turf & Swimming Zone",
  description: "The Home of Football in Buchi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          <Header />
          <Suspense fallback={null}>
            <PaymentStatusHandler />
          </Suspense>
          {children}
          <ToastProvider />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
