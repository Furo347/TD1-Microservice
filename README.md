<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# TD1 - Microservices avec NestJS et NATS

## Description

Ce projet démontre une architecture microservices basée sur [NestJS](https://github.com/nestjs/nest) utilisant **NATS** comme système de messagerie pour la communication inter-services.

### Composants du projet

- **Microservice 1** : Service principal qui orchestre la communication et expose les endpoints `ping` et `communicate`
- **Microservice 2** : Service secondaire qui écoute les messages et répond aux requêtes
- **Serveur NATS** : Broker de messages pour la communication asynchrone entre les microservices

## Prérequis

- **Node.js** : v18+ 
- **npm/pnpm** : gestionnaire de paquets
- **Docker** : pour exécuter le serveur NATS

## Installation

### 1. Installer les dépendances du projet principal

```bash
$ pnpm install
```

### 2. Démarrer le serveur NATS (via Docker)

```bash
$ docker run -d --name nats-server -p 4222:4222 -p 8222:8222 nats:2.10-alpine
```

Si un conteneur NATS existe déjà, supprimez-le d'abord :

```bash
$ docker stop nats-server
$ docker rm nats-server
```

## 🐳 Docker et Docker Compose

### Déploiement avec Docker Compose (Recommandé)

La manière la plus simple de déployer tous les services (microservice 1, microservice 2, et serveur NATS) est d'utiliser Docker Compose. Tous les services sont automatiquement configurés et communiquent via le réseau Docker :

```bash
# Démarrer tous les services en arrière-plan
$ docker-compose up -d

# Vérifier le statut des services
$ docker-compose ps

# Voir les logs en direct
$ docker-compose logs -f

# Voir les logs d'un service spécifique
$ docker-compose logs -f microservice1
$ docker-compose logs -f microservice2
$ docker-compose logs -f nats

# Arrêter tous les services
$ docker-compose down

# Arrêter et supprimer les volumes
$ docker-compose down -v
```

### Architecture Docker Compose

Le fichier `docker-compose.yml` orchestre les services suivants :

1. **nats** : Serveur NATS (port 4222 interne, 8222 pour l'admin)
2. **microservice1** : Service principal (écoute sur NATS)
3. **microservice2** : Service secondaire (écoute sur NATS)

Les services sont liés entre eux via un réseau Docker interne et disposent de healthchecks pour assurer la disponibilité.

### Construire et déployer manuellement

Si vous préférez construire les images Docker manuellement :

```bash
# Construire l'image du Microservice 1
$ docker build -t microservice1:latest -f Dockerfile .

# Construire l'image du Microservice 2
$ docker build -t microservice2:latest -f Dockerfile.microservice2 .

# Démarrer le serveur NATS
$ docker run -d --name nats-server -p 4222:4222 -p 8222:8222 nats:2.10-alpine

# Attendre que NATS soit prêt
$ sleep 2

# Démarrer Microservice 1
$ docker run -d --name microservice1 \
  --network bridge \
  --link nats-server:nats-server \
  -e NATS_SERVERS=nats://nats-server:4222 \
  microservice1:latest

# Démarrer Microservice 2
$ docker run -d --name microservice2 \
  --network bridge \
  --link nats-server:nats-server \
  -e NATS_SERVERS=nats://nats-server:4222 \
  microservice2:latest

# Vérifier les conteneurs
$ docker ps

# Voir les logs
$ docker logs -f microservice1
$ docker logs -f microservice2

# Arrêter les conteneurs
$ docker stop microservice1 microservice2 nats-server
$ docker rm microservice1 microservice2 nats-server
```

### Fichiers Docker

- **`Dockerfile`** : Image pour Microservice 1 (build multi-étapes pour optimiser la taille)
  - Compile le projet TypeScript
  - Lance `node dist/main`

- **`Dockerfile.microservice2`** : Image pour Microservice 2
  - Compile le projet TypeScript
  - Lance `node dist/microservice2/main`

- **`docker-compose.yml`** : Orchestration complète des services
  - Configure les variables d'environnement
  - Gère les dépendances entre services
  - Expose les ports nécessaires

- **`.dockerignore`** : Exclut les fichiers inutiles lors de la construction
  - `node_modules`, `.git`, logs, caches, etc.

### Développement avec Docker

Pour développer localement tout en utilisant NATS dans Docker :

```bash
# Démarrer seulement le serveur NATS
$ docker run -d --name nats-dev -p 4222:4222 -p 8222:8222 nats:2.10-alpine

# Ensuite, lancez les microservices localement
$ pnpm run start:dev

# Dans un autre terminal, lancez Microservice 2
$ cd microservice2 && pnpm run start:dev

# Arrêter NATS quand vous avez terminé
$ docker stop nats-dev && docker rm nats-dev
```

## Structure du projet

```
TD1-Microservice/
├── src/                    # Microservice 1 (Principal)
│   ├── main.ts            # Point d'entrée du microservice 1
│   ├── app.module.ts      # Module applicatif
│   ├── app.controller.ts  # Contrôleur avec MessagePattern
│   └── app.service.ts     # Service avec client NATS
├── microservice2/          # Microservice 2 (Secondaire)
│   └── src/
│       ├── main.ts        # Point d'entrée du microservice 2
│       ├── app.module.ts  # Module applicatif
│       ├── app.controller.ts
│       └── app.service.ts
├── test-communication.ts  # Script de test inter-services
├── package.json
└── README.md
```

## Lancer l'application

### Démarrer Microservice 1

```bash
$ pnpm run start:dev
```

### Démarrer Microservice 2 (dans un autre terminal)

```bash
$ cd microservice2
$ pnpm run start:dev
```

Ou directement depuis la racine :

```bash
$ npx ts-node microservice2/src/main.ts
```

## Communication entre les microservices

### Microservice 1 expose deux patterns NATS :

- **`ping`** : Retourne "Hello World!"
  ```javascript
  client.send('ping', {})
  ```

- **`communicate`** : Communique avec Microservice 2
  ```javascript
  client.send('communicate', {})
  ```

### Microservice 2 écoute :

- **`hello`** : Traite les messages reçus de Microservice 1
  ```javascript
  Réponse: "Hello from Microservice 2! Received: {...}"
  ```

## Test de la communication

Pour tester la communication complète entre les deux microservices :

```bash
$ npx ts-node test-communication.ts
```

Résultat attendu :

```
Response from Service 1: Hello World!
Response from Service 1 communicating with Service 2: Hello from Microservice 2! Received: {"message":"Hello from Microservice 1"}
```

## Commandes disponibles

```bash
# Démarrage en mode développement
$ pnpm run start:dev

# Démarrage en production
$ pnpm run start:prod

# Construction du projet
$ pnpm run build

# Tests unitaires
$ pnpm run test

# Tests e2e
$ pnpm run test:e2e

# Coverage
$ pnpm run test:cov

# Linting
$ pnpm run lint

# Formatage du code
$ pnpm run format
```

## Configuration NATS

Les microservices se connectent au serveur NATS via l'URL `nats://localhost:4222`. Cette configuration est définie dans :

- `src/app.service.ts` pour Microservice 1 (client)
- `src/main.ts` pour Microservice 1 (serveur)
- `microservice2/src/main.ts` pour Microservice 2 (serveur)

Pour modifier le serveur NATS, mettez à jour l'option `servers` dans les fichiers `main.ts` et `app.service.ts`.

## Dépannage

### Erreur : "Empty response. There are no subscribers listening to that message"
- Assurez-vous que les deux microservices sont actuellement en cours d'exécution
- Vérifiez que le serveur NATS est démarré (`docker ps`)

### Erreur de connexion NATS
- Vérifiez que le port 4222 n'est pas déjà utilisé
- Assurez-vous que Docker est en cours d'exécution

### Port 4222 déjà utilisé
Arrêtez les conteneurs existants :

```bash
$ docker ps
$ docker stop <container-id>
```

## Ressources supplémentaires

- [Documentation NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Documentation NATS](https://nats.io/docs/)
- [Docker Hub - NATS](https://hub.docker.com/_/nats)

## License

Ce projet est sous licence MIT.
