- `auth-pronote.js` :
	Permet de générer un token d'authentification à Pronote via un QR Code et de l'enregistrer dans le .env, requis pour se connecter à Pronote

- `auth-google.js` :
	Permet de générer les tokens permettant de gérer le calendrier, requis pour lire et ajouter des événements
	Un fichier `google-credentials.json` doit exister à la racine du projet, contenant le JSON du fichier téléchargé contenant les détails d'authentification du client ("application de bureau" sur le dashboard)
	Il faudra rajouter `GOOGLE_CALENDAR_ID` (l'identifiant de l'agenda, similaire à une adresse mail) dans le fichier .env

- Autres valeurs optionelles à ajouter manuellement dans le fichier .env :
	`NTFY_URL`, `NTFY_USERNAME`, `NTFY_PASSWORD`
	Permet d'envoyer des alertes via un serveur ntfy lorsqu'un cours est modifié ou annulé