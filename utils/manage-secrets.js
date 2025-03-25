const fs = require("fs")
const path = require("path")

module.exports.parse = function (secretsPath) {
	if(!fs.existsSync(secretsPath)){
		fs.mkdirSync(path.dirname(secretsPath), { recursive: true })
		fs.writeFileSync(secretsPath, "{}")

		console.log(`Fichier situé à ${secretsPath} créé. Ajoutez le au .gitignore`)
	}

	const secrets = fs.readFileSync(secretsPath, "utf8")
	var secretsParsed
	try { secretsParsed = JSON.parse(secrets) } catch (error) {
		console.error(`Erreur lors de la lecture du fichier ${secretsPath}: ${error.message || error}`)
		process.exit(1)
	}

	return secretsParsed
}

module.exports.save = function (secretsPath, json = {}) {
	if(!fs.existsSync(secretsPath)){
		fs.mkdirSync(path.dirname(secretsPath), { recursive: true })
		fs.writeFileSync(secretsPath, "{}")

		console.log(`Fichier situé à ${secretsPath} créé. Ajoutez le au .gitignore`)
	}

	fs.writeFileSync(secretsPath, JSON.stringify(json, null, 2))

	return true
}