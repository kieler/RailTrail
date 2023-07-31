import BaseLayout from "@/app/components/base_layout"
import {inter, meta_info} from "@/utils/common";

export const metadata = meta_info;

/**
 * The Layout to use on all pages in the app-directory.
 * Effectively defers to BaseLayout with minimal adjustments.
 */
export default function RootLayout({children,}: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <BaseLayout>
                    {children}
                </BaseLayout>
            </body>
        </html>
    )
}


