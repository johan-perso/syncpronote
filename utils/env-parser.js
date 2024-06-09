var fs

module.exports.parseEnv = function (envPath) {
	if(!fs) fs = require("fs")
	if(!fs.existsSync(envPath)) return {}

	const env = fs.readFileSync(envPath, "utf8")
	const envParsed = {}

	env.split("\n").forEach(line => {
		if(line.startsWith("#")) return // on ignore si c'est un commentaire
		var [key, value] = line.split("=")
		if(!value) return
		if(value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1) // enlever les " au début et à la fin si y'en a
		if(value.includes("#")) value = value.split("#")[0] // enlever le commentaire s'il est dans la valeur
		envParsed[key] = value.replace(/\\n/g, "\n") // remplacer les \n par des vrais sauts de ligne
	})

	return envParsed
}

module.exports.saveEnv = function (envPath, json = {}) {
	if(!fs) fs = require("fs")

	const env = Object.entries(json).map(([key, value]) => {
		if(!value) return `# ${key}= (pas de valeur)` // si la valeur est vide, on met un commentaire
		else if(!key) return `#${value} (pas de clé)` // si la clé est vide, on met un commentaire
		else if(typeof value == "string" && value.includes("\n")) return `${key}="${value.replace(/"/g, "\\\"")}"` // si la valeur contient des sauts de ligne, on met des guillemets
		else return `${key}=${value}`
	}).join("\n")
	fs.writeFileSync(envPath, env)

	return true
}