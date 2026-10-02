# Backend Node/Express — imagem de treino (NAO usar em producao)
FROM node:22-alpine
WORKDIR /app

# instala dependencias primeiro (cache de camadas)
COPY package*.json ./
RUN npm install

# copia o codigo
COPY . .

# garante a pasta de uploads (avatares — usada a partir da Fase 3)
RUN mkdir -p uploads

EXPOSE 4000
CMD ["npm", "start"]
