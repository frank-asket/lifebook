FROM node:20-slim

WORKDIR /app

# Install dependencies first so this layer is cached unless package.json changes
COPY package.json package-lock.json* ./
RUN npm install

# Then copy the rest of the source
COPY . .

# Runs via tsx (already a dependency) rather than a separate tsc build step —
# this avoids a compiled-output-vs-source-assets mismatch, since verses.json,
# groups.json, and library.json are read at runtime via fs + __dirname
# relative to the TypeScript source files, not bundled by tsc.
ENV NODE_ENV=production
EXPOSE 8787

CMD ["npm", "start"]
