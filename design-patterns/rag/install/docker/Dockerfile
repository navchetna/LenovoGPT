FROM node:20-alpine
WORKDIR /usr/src/app

# Install dependencies
COPY ui/package*.json ./
RUN npm cache clean --force && npm ci --legacy-peer-deps

# Bundle app source
COPY ui/ .

# Accept build arguments
ARG SERVER_URL
ARG API_BASE_URL
ARG DATAPREP_URL

# Set environment variables for build time
ENV NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL:-${SERVER_URL}}
ENV NEXT_PUBLIC_DATAPREP_URL=${DATAPREP_URL}

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
