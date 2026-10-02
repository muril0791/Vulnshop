# Frontend React/Vite — dev server para facilitar o treino (NAO usar em producao)
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
# --host 0.0.0.0 permite acessar de fora do container (do seu navegador)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
