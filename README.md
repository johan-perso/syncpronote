# SyncPronote

Un service en arrière-plan qui synchronise votre emploi du temps Pronote sur Google Agenda. Celui-ci vous alerte aussi lorsqu'un cours est modifié ou annulé via [ntfy](https://ntfy.sh/) (optionnel).


## Installation

> Vous aurez besoin d'une version récente de [Node.js](https://nodejs.org/en/)  
> Vous pouvez installer [pm2](https://www.npmjs.com/package/pm2) pour démarrer le service en arrière-plan  
> Vous pouvez installer [ntfy](https://ntfy.sh/) pour recevoir des notifications lors de certaines actions apportées à l'EDT

1. Cloner le dépôt
```sh
git clone https://github.com/johan-perso/syncpronote.git
```

2. Installer les dépendances
```sh
cd syncpronote
npm install
# ou "pnpm install" si vous utilisez pnpm
```

3. Configurer le service
```sh
cd cli

node auth-pronote.js
# Suivez les instructions pour configurer l'accès à Pronote

node auth-google.js
# Suivez les instructions pour configurer l'accès à Google Calendar
# Important : un fichier `google-credentials.json` doit exister à la racine du projet, il doit correspondre au fichier JSON téléchargé sur le dashboard Google (détails d'authentification du client, choissisez "application de bureau")

nano .env
# Ajouter une ligne `GOOGLE_CALENDAR_ID=` avec l'identifiant de l'agenda Google qui contiendra les nouveaux événements (similaire à une adresse mail)
# Vous pouvez ajouter `NTFY_URL` et `NTFY_USERNAME` + `NTFY_PASSWORD` pour recevoir des notifications lors de la modification ou suppression d'un cours. Le topic utilisé sera `pronote`.
```

4. Lancer le service
```sh
npm start
# ou vous pouvez utiliser pm2 pour le lancer en arrière plan
pm2 start index.js --name "SyncPronote"
```


## Fonctionnement

Toutes les demies-heures (x:00 et x:30) entre 6h et 21h, les cours sur la semaine actuelle ainsi que les trois semaines à venir seront récupérés depuis Pronote et comparés aux entrées de l'agenda Google. Les événements manquants seront ajoutés, les cours modifiés seront mis à jour et les cours annulés seront supprimés.

> Seules les entrées considérées comme des cours peuvent être mises à jour ou supprimées. Les autres événements du calendrier ne seront pas touchés.


## Personnalisation du nom des cours

Vous pouvez modifier le fichier `utils/classnames.js` pour personnaliser le nom affiché dans votre agenda pour chacune de vos matières. Certaines matières sont déjà préconfigurées et seront utilisées sans modification à effectuer.

## Licence

MIT © [Johan](https://johanstick.fr). Soutenez moi via [Ko-Fi](https://ko-fi.com/johan_stickman) ou [PayPal](https://paypal.me/moipastoii) si vous souhaitez m'aider 💙