/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false,
    images: {
        domains: [],
    },
    // experimental: {
    //     esmExternals: 'loose',
    // },
};

module.exports = nextConfig;
