# RailTrail Admin Website

This is the source tree for the administrative website for the RailTrail System.
It is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Formatting

This project uses `prettier` for typescript formatting, in addition with the utility
`pretty-quick`. To format your staged files, run `npx pretty-quick --staged`

## Directory Structure

Important files and directories in this project are

```
├───public                  # static files, like images
│   (...)
├───src                     # source folder, contains all dynamic routes
│   │   middleware.ts       # middleware, doing request logging
│   │
│   ├───app                 # app router dir, preferred place for new pages
│   │   │   favicon.ico
│   │   │   layout.tsx      # root layout here
│   │   │   page.tsx        # The page for the `/`-path
│   │   │
│   │   ├───components      # multi-purpose components. See `src/components/Readme.md`
│   │   │       (...)
│   │   │
│   │   ├───(...)           # files for further paths. File system path is HTTP path
│   │   │
│   │   └───webapi          # routes for the API from web page to server. Mostly (...)
│   │          (...)        # (...) proxying to the backend, to bypass CORS-restrictions.
│   │
│   ├───pages               # pages router dir. Legacy next-js way for pages
│   │       logout.tsx      # logout route. Needs features currently unavailable in app-router
│   │       _app.tsx        # together with _document.tsx roughtly equivalent to (...)
│   │       _document.tsx   # (...) `app/layout.tsx`.
│   │
│   └───utils               # library-style functions for things that are not components
│           api.ts          # type definitions for the API of the backend (see Server)
│           api.website.ts  # type definitions for specific website APIs (see Server)
│           common.ts       # Metadata about this application for inclusion in the html
│           data.ts         # Various functions for talking to the backend (from the server)
│           helpers.ts      # miscelanious functions
│           rotatingIcon.ts # A special Leafleet Marker with a rotating layer and static foreground
│           types.ts        # Some internal type definitions.
│
│   .env.development        # 
│   .dockerignore
│   Dockerfile
│   next.config.js
│   package.json
│   tailwind.config.js
```

## Starting a development server

To start a development server, simply run

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.


