import '@/styles/index.scss'
import '@/styles/social.scss'
import './globals.css';
import '@/styles/graduationWishes.scss'; // ensure SCSS is loaded globally
import SocialBar from '@/components/SocialBar';

export const metadata = {
  title: 'MC Haywai Games',
}



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Floating variant */}
        <SocialBar />

        {/* Or footer variant */}
        {/* <SocialBar position="footer" /> */}
      </body>
    </html>
  );
}

