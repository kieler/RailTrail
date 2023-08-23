# Folder: `Components`

This folder contains various React components, that should have general purpose
(i.e. useful for more than one route.)

As these are co-located in the `app`-directory, these files are server-components
by default. But as many of them use client side side-effects, they are explicitly
declared to be client-components using the `"use client"`-directive.
See: <https://nextjs.org/docs/getting-started/react-essentials>