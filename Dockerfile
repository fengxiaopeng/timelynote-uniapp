FROM node:22.20.0-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
ENV HUSKY=0
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm rebuild esbuild vue-demi && pnpm init-baseFiles && pnpm build:h5

FROM nginx:stable-alpine
COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
