import Layout from '@/app/components/layout_base'
import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    )
}