# --- 构建阶段 ---
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
# 使用 npm ci 保证版本一致性
RUN npm ci

# 复制源码并构建
COPY . .
# 这一步会生成 dist 目录
RUN npm run build

# --- 运行阶段 (Nginx) ---
FROM nginx:alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制 React 构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]