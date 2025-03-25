const fs = require("fs")
const path = require("path")
const { authenticate } = require("@google-cloud/local-auth")
const manageSecrets = require("../utils/manage-secrets")

var secrets = manageSecrets.parse(path.join(__dirname, "..", ".config", "secrets.json"))

function saveCredentials(client) {
	const content = fs.readFileSync(path.join(__dirname, "..", "google-credentials.json"))
	const keys = JSON.parse(content)
	const key = keys.installed || keys.web
	secrets.GOOGLE_CLIENT_ID = key.client_id
	secrets.GOOGLE_CLIENT_SECRET = key.client_secret
	secrets.GOOGLE_REFRESH_TOKEN = client.credentials.refresh_token
	manageSecrets.save(path.join(__dirname, "..", ".config", "secrets.json"), secrets)
}

async function authorize() {
	var client = await authenticate({
		scopes: ["https://www.googleapis.com/auth/calendar"], // si on modifie les scopes, il faudra supprimer les infos de connexion générées
		keyfilePath: path.join(__dirname, "..", "google-credentials.json"),
	})
	if (client.credentials) saveCredentials(client)
	console.log("Connexion réussie")
}

authorize().then(() => console.log("Enregistré dans le fichier .config/secrets.json")).catch(console.error)