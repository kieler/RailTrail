import Layout from "@/app/components/layout_base"
import {inter, meta_info} from "@/lib/common";

export const metadata = meta_info;

export default function RootLayout({children,}: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Layout>
                    {children}
                </Layout>
            </body>
        </html>
    )
}


