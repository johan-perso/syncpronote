var { loginQrCode, createSessionHandle } = require("pawnote")
var readline = require("readline")
var path = require("path")
const envParser = require("../utils/env-parser")
const { randomUUID } = require("crypto")

// Fonction pour demander un string
async function askString(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})
	return new Promise(resolve => {
		rl.question(question, (answer) => {
			rl.close()
			resolve(answer)
		})})
}

(async () => {
	// Log
	console.log("Connecter vous à Pronote (bureau) sur votre navigateur et générer un QR code.")
	console.log("Vous devrez entrer le code PIN ainsi que la valeur du QR code (via une extension par exemple) ici.\n")

	// Demander les infos
	const pin = await askString("Code PIN: ")
	var qr = await askString("Valeur du QR code: ")

	// Parse les infos du QR en JSON
	try {
		qr = JSON.parse(qr)
	} catch (e) {
		console.error("Erreur: Le QR code n'est pas un JSON valide.")
		return
	}

	// S'authentifier
	console.log("\nAuthentification...")
	var deviceUUID = randomUUID()
	const pronoteHandler = createSessionHandle()
	const pronote = await loginQrCode(pronoteHandler, { pin, qr, deviceUUID }).catch(e => {
		console.error("Impossible de s'authentifier:", e)
		process.exit(1)
	})
	console.log(`Connecté à Pronote en tant que ${pronote.username} !`)

	// Demander si on enregistre les infos
	const saveDetails = await askString("\nVoulez-vous enregistrer les détails de reconnexion (requis pour utiliser le service) ? (Y/n): ")
	if (saveDetails.toLowerCase() === "y" || saveDetails === "") {
		console.log("Enregistrement des détails...")

		var env = envParser.parseEnv(path.join(__dirname, "..", ".env"))
		env.PRONOTE_ROOT_URL = pronote.url
		env.PRONOTE_TOKEN = pronote.token
		env.PRONOTE_ACCOUNT_KIND = pronote.kind
		env.PRONOTE_USERNAME = pronote.username
		env.PRONOTE_DEVICE_UUID = deviceUUID
		envParser.saveEnv(path.join(__dirname, "..", ".env"), env)

		console.log("Fichier .env enregistré !")
		console.log("Note : ce fichier ne doit pas être partagé, penser à l'ajouter à votre .gitignore.")
	}

	// Log quand meme les infos
	console.log("\nToken de réauthentification:", pronote.token)
	console.log("Type de compte:", pronote.kind)
	console.log("Nom d'utilisateur:", pronote.username)
	console.log("UUID de l'appareil:", deviceUUID)
	console.log("URL de Pronote:", pronote.url)
})()