FROM ghcr.io/puppeteer/puppeteer:19.11.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /opt/render/project/src/ai-expert1

COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "staging"]