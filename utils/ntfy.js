const path = require("path")
const envParser = require("./env-parser.js")
var dotenv = envParser.parseEnv(path.join(__dirname, "..", ".env"))

var url = dotenv.NTFY_URL
if(url && !url.endsWith("/")) url += "/"

module.exports = async function(title, message){
	if(!url) return console.log("Envois d'alertes via ntfy désactivé (valeur manquante dans le .env)")
	else console.log(`Envoi d'une alerte via ntfy : ${title} - ${message}`)

	var statusCode = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			topic: dotenv.NTFY_TOPIC || "pronote",
			title,
			message
		}),
		headers: {
			"Authorization": dotenv.NTFY_USERNAME && dotenv.NTFY_PASSWORD ? `Basic ${Buffer.from(`${dotenv.NTFY_USERNAME}:${dotenv.NTFY_PASSWORD}`).toString("base64")}` : "",
			"Content-Type": "application/json"
		}
	}).then(res => res.status).catch(() => 999)

	return statusCode
}