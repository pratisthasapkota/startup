import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 380px)' }}>{children}</main>
      <Footer />
    </>
  );
}