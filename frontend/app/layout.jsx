import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { LabProvider } from '../lib/LabContext';

export const metadata = {
  title: 'Smart Laboratory Sample Processing & Deadline Scheduler',
  description: 'Next.js Frontend for Lab Sample Scheduler with Spring Boot REST Backend',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LabProvider>
          {children}
        </LabProvider>
      </body>
    </html>
  );
}
