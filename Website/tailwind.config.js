/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            zIndex: {
                '1100': '1100',
            }
        },
    },
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@tailwindcss/forms')
    ],
    safelist: [
        'rotatingIconContainerContainer',
        'rotatingIconContainer',
        'rotatingIcon',
        'w-64', 'flex', 'p-1.5', 'flex-row', 'flex-wrap'
    ]
}
