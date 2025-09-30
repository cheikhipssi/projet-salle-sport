# Image Node officielle
FROM registry.access.redhat.com/ubi8/nodejs-20

# Dossier de travail
WORKDIR /app

# Copier package.json et installer dépendances
COPY package*.json ./

USER 0
RUN npm install && npm cache clean --force
USER 1001


# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]

