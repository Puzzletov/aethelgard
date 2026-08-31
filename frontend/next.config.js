const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	outputFileTracingRoot: path.join(__dirname, ".."),
	turbopack: { root: path.join(__dirname, "..") },
};

module.exports = nextConfig;
