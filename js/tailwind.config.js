/* CMC stages — Tailwind theme (CDN build)
   Must be loaded right after the Tailwind CDN script. */

tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
};