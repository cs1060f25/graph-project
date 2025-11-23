/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PUBLIC_URL: ''
  },
  // Remove CRA compatibility as we're using App Router now
  // experimental: {
  //   craCompat: true,
  // },
  // Remove this to leverage Next.js' static image handling
  // read more here: https://nextjs.org/docs/api-reference/next/image
  images: {
    disableStaticImages: true
  },
  // TypeScript will be handled by tsconfig.json
}

module.exports = nextConfig
