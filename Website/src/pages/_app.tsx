import BaseLayout from '@/app/components/base_layout'
import type { AppProps } from 'next/app'

/**
 * Together with _document.tsx the equivalent of magic things to get the base layout
 * to apply for pages in the pages-directory.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <BaseLayout>
            <Component {...pageProps} />
        </BaseLayout>
    )
}