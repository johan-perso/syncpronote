const fs = require("fs")
const path = require("path")
const { authenticate } = require("@google-cloud/local-auth")
const envParser = require("../utils/env-parser")

var dotenv = envParser.parseEnv(path.join(__dirname, "..", ".env"))

function saveCredentials(client) {
	const content = fs.readFileSync(path.join(__dirname, "..", "google-credentials.json"))
	const keys = JSON.parse(content)
	const key = keys.installed || keys.web
	dotenv.GOOGLE_CLIENT_ID = key.client_id
	dotenv.GOOGLE_CLIENT_SECRET = key.client_secret
	dotenv.GOOGLE_REFRESH_TOKEN = client.credentials.refresh_token
	envParser.saveEnv(path.join(__dirname, "..", ".env"), dotenv)
}

async function authorize() {
	var client = await authenticate({
		scopes: ["https://www.googleapis.com/auth/calendar"], // si on modifie les scopes, il faudra supprimer les infos de connexion générées
		keyfilePath: path.join(__dirname, "..", "google-credentials.json"),
	})
	if (client.credentials) saveCredentials(client)
	console.log("Connexion réussie")
}

authorize().then(() => console.log("Enregistré dans le fichier .env")).catch(console.error)