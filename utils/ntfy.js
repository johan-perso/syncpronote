const path = require("path")
const manageSecrets = require("./manage-secrets")

var secrets = manageSecrets.parse(path.join(__dirname, "..", ".config", "secrets.json"))

var url = secrets.NTFY_URL
if(url && !url.endsWith("/")) url += "/"

module.exports = async function(title, message){
	if(!url) return console.log("Envois d'alertes via ntfy désactivé (valeur manquante dans le .env)")
	else console.log(`Envoi d'une alerte via ntfy : ${title} - ${message}`)

	var statusCode = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			topic: secrets.NTFY_TOPIC || "pronote",
			title,
			message
		}),
		headers: {
			"Authorization": secrets.NTFY_USERNAME && secrets.NTFY_PASSWORD ? `Basic ${Buffer.from(`${secrets.NTFY_USERNAME}:${secrets.NTFY_PASSWORD}`).toString("base64")}` : "",
			"Content-Type": "application/json"
		}
	}).then(res => res.status).catch(() => 999)

	return statusCode
}