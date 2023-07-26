import '../../components/globals.css'
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

export default function Layout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className='h-full min-h-screen flex flex-initial flex-col'>
            <Header/>
            {children}
            <Footer/>
        </div>
    )
  }