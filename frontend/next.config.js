import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	outputFileTracingRoot: path.join(currentDirectory, ".."),
	turbopack: { root: path.join(currentDirectory, "..") },
};

export default nextConfig;
