import './globals.css'
import { Inter } from 'next/font/google'
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>
            <div className='h-full min-h-screen flex flex-initial flex-col'>
                <Header/>
                {children}
                <Footer/>
            </div>
        </body>
      </html>
    )
  }