// Importer les libs
var { startPresenceInterval, createSessionHandle, loginToken, AccountKind, timetableFromIntervals, parseTimetable } = require("pawnote")
const path = require("path")
const { CronJob } = require("cron")
const { google } = require("googleapis")
const envParser = require("./utils/env-parser")
const classnameParser = require("./utils/classnames")
const sendNtfy = require("./utils/ntfy")
const customHours = require("./utils/custom-hours")
const { unstrikethrough, strikethrough } = require("./utils/strikethrough")

var dotenv = envParser.parseEnv(path.join(__dirname, ".env"))

// Convertir une date en un string human-readable et relatif
function dateToString(date){
	if(date.toDateString() == new Date().toDateString()) return "d'aujourd'hui"
	if(date.toDateString() == new Date(new Date().getTime() + 86400000).toDateString()) return "de demain"
	if(date.toDateString() == new Date(new Date().getTime() - 86400000).toDateString()) return "d'hier"
	return `du ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
}

// Enlever les crochets au début et à la fin d'un string
function removeBrackets(string){
	if(string.startsWith("[")) string = string.substring(1)
	if(string.endsWith("]")) string = string.substring(0, string.length - 1)
	return string
}

// Générer un identifieur unique en fonction des éléments de chaque cours
function generateUniqueIdCourse(type, start, end, name){
	var name = name.toLowerCase().replace(/[^a-z0-9]/g, "")
	name = unstrikethrough(name.replace(/̶/g, ""))
	return `${type}-${start.getTime()}-${end.getTime()}-${name}`
}

// Transformer un array de différents éléments de l'EDT en un string
function arrayToStringMasculin(array){
	if(!array?.length) return "aucun"
	return array?.join(", ")
}

// Déterminer le début et la fin de la semaine qu'on va récupérer
function getWeekBounds(){
	// Obtenir les variables de base
	const today = new Date()
	const todayOfWeek = today.getDay()
	const start = new Date(today)

	// En fonction du jour actuel, on détermine le début de la semaine qu'on va récupérer
	if(todayOfWeek == 0) start.setDate(today.getDate()) // Dimanche: on commence à partir d'aujourd'hui
	else start.setDate(today.getDate() - todayOfWeek) // Autres jours: on commence à partir d'hier
	start.setHours(0, 0, 0, 0)

	// On détermine la fin de la semaine qui sera le samedi dans 3 semaines
	const end = new Date(start)
	end.setDate(start.getDate() + (todayOfWeek == 0 ? 6 : 5) + (7 * 3)) // samedi dans 3 semaines
	end.setHours(23, 59, 59, 999)

	// Si le premier jour est avant le 2 septembre, on commence à partir du 2 septembre
	// Jsp si on en aura besoin l'année scolaire prochaine, mais là on vient d'passer en 2025 et j'ai capté qu'ça casse tt mdrrrr js le pire dev
	// if(start.getTime() < new Date(today.getFullYear(), 8, 2).getTime()) start.setTime(new Date(today.getFullYear(), 8, 2).getTime())

	// On retourne les dates
	return {
		start: start,
		end: end
	}
}

// Fonction principale
async function main(){
	// Se connecter à Google
	var perf = performance.now()
	console.log("Authentification à Google...")
	var googleClient
	try {
		googleClient = await google.auth.fromJSON({
			type: "authorized_user",
			client_id: dotenv.GOOGLE_CLIENT_ID,
			client_secret: dotenv.GOOGLE_CLIENT_SECRET,
			refresh_token: dotenv.GOOGLE_REFRESH_TOKEN
		})
	} catch(e){
		console.error("Impossible de s'authentifier à Google :", e)
		await new Promise(resolve => setTimeout(resolve, 45000)) // on attends 45sec avant de quitter pour pas spam l'API si on a un redémarrage automatique
		process.exit(1)
	}
	console.log(`Connecté à Google ! (${(performance.now() - perf).toFixed(2)}ms)`)

	// Gérer la connexion à Pronote
	var pronoteHandler
	var pronoteClient
	var pronoteToken = dotenv.PRONOTE_TOKEN
	async function pronoteLogin(){
		// Récupérer les infos de connexion Pronote depuis le .env
		perf = performance.now()
		console.log("Authentification à Pronote...")
		const pronoteDetails = {
			url: dotenv.PRONOTE_ROOT_URL,
			kind: dotenv.PRONOTE_ACCOUNT_KIND == "6" ? AccountKind.STUDENT : dotenv.PRONOTE_ACCOUNT_KIND,
			username: dotenv.PRONOTE_USERNAME,
			token: pronoteToken,
			deviceUUID: dotenv.PRONOTE_DEVICE_UUID,
		}

		// Se connecter à Pronote
		pronoteHandler = createSessionHandle()
		pronoteClient = await loginToken(pronoteHandler, pronoteDetails).catch(async e => {
			console.error("Impossible de s'authentifier à Pronote :", e)
			await new Promise(resolve => setTimeout(resolve, 45000)) // on attends 45sec avant de quitter pour pas spam l'API si on a un redémarrage automatique (pm2 par ex)
			process.exit(1)
		})
		console.log(`Connecté à Pronote en tant que ${pronoteHandler.user.name} ! (${(performance.now() - perf).toFixed(2)}ms)`)
		startPresenceInterval(pronoteHandler) // permet de garder la session "en vie"

		// Réenregistrer le token de prochaine connexion (il change à chaque connexion)
		pronoteToken = pronoteClient.token
		dotenv.PRONOTE_TOKEN = pronoteClient.token
		envParser.saveEnv(path.join(__dirname, ".env"), dotenv)
	}
	await pronoteLogin()

	// Fonction : obtenir l'emploi du temps
	async function getSchedule(){
		// Préparer des variables
		var calendar = []
		var weekBounds = getWeekBounds()

		// Obtenir l'EDT sur la période détérminée
		var perf = performance.now()
		console.log(`Récupération de l'emploi du temps du ${weekBounds.start.toLocaleDateString()} au ${weekBounds.end.toLocaleDateString()}...`)
		var timetable
		try {
			timetable = await timetableFromIntervals(pronoteHandler, weekBounds.start, weekBounds.end)
		} catch(e){
			console.error("Impossible de récupérer l'emploi du temps :", e)
			if(e.message.includes("The page has expired")) await pronoteLogin()
		}
		if(!timetable) return calendar
		parseTimetable(pronoteHandler, timetable, {
			withSuperposedCanceledClasses: false, // évite d'avoir plusieurs cours sur les mêmes horaires
			withCanceledClasses: true,
			withPlannedClasses: true,
		})

		// Ajouter chaque cours au calendrier
		console.log("before reparsing:", timetable?.classes || timetable)
		timetable.classes.forEach((currentClass) => {
			// Si c'est une activité
			if(currentClass.is == "activity"){
				calendar.push({
					type: "activity",
					start: currentClass.startDate,
					end: currentClass.endDate,
					name: currentClass.title ?? "???",
					teachers: currentClass.attendants ?? [],
					classrooms: [],
					groups: [],
					status: currentClass.status,
					id: generateUniqueIdCourse("activity", currentClass.startDate, currentClass.endDate, currentClass.title),
					canceled: currentClass?.canceled || false
				})
			}

			// Si c'est un cours classique
			else if(currentClass.is == "lesson"){
				calendar.push({
					type: "lesson",
					start: currentClass.startDate,
					end: currentClass.endDate,
					name: currentClass.subject?.name ?? "???",
					teachers: currentClass.teacherNames ?? [],
					classrooms: currentClass.classrooms ?? [],
					groups: currentClass.groupNames ?? [],
					status: currentClass.status,
					id: generateUniqueIdCourse("lesson", currentClass.startDate, currentClass.endDate, currentClass.subject?.name),
					canceled: currentClass.canceled || false
				})
			}
		})

		// Retourner le calendrier
		console.log(`Emploi du temps récupéré ! (${(performance.now() - perf).toFixed(2)}ms)`)
		console.log("after reparsing:", calendar)
		return calendar
	}

	// Vérif périodique : modifs dans l'EDT
	console.log("En attente de la prochaine vérification périodique (toutes les 30 minutes entre 6h et 21h)...")
	CronJob.from({
		cronTime: "00,30 6-21 * * *",
		onTick: async function(){
			console.log("!!! Vérification périodique des changements dans l'EDT !!!")
			console.log(`!!! ${new Date().toLocaleString("fr-FR")} !!!`)

			// Obtenir l'emploi du temps
			var calendar = await getSchedule()

			// Obtenir le calendrier Google
			var perf = performance.now()
			console.log("Obtention de l'agenda Google...")
			const calendarID = dotenv.GOOGLE_CALENDAR_ID
			const calendarAPI = google.calendar({ version: "v3", auth: googleClient })
			const events = await calendarAPI.events.list({
				calendarId: calendarID,
				timeMin: getWeekBounds().start.toISOString(),
				timeMax: getWeekBounds().end.toISOString(),
				singleEvents: true,
				orderBy: "startTime"
			}).catch(e => {
				console.error("Impossible de récupérer les événements de l'agenda Google :", e)
			})
			console.log(`Agenda Google récupéré ! (${(performance.now() - perf).toFixed(2)}ms)`)

			// Remplacer l'heure annoncée par Pronote par l'heure réelle, si disponible
			calendar.forEach(event => {
				event.start = customHours.correctTime(event.start, "start")
				event.end = customHours.correctTime(event.end, "end")
			})

			// Passer sur tout les éléments de l'agenda Google, et vérifier par rapport à l'EDT Pronote
			perf = performance.now()
			console.log("Comparaison des événements...")
			var listChanges = []
			for(const event of (events.data.items || [])){
				// Parser certaines informations à partir de l'événement
				var linesDescription = event?.description?.split("\n") || []
				var uniqueId = linesDescription.find(line => line.startsWith("ID : "))?.replace("ID : ", "") || null
				var groups = linesDescription.find(line => line.startsWith("Groupe : "))?.replace("Groupe : ", "") || ""
				var teachers = linesDescription.find(line => line.startsWith("Professeur : "))?.replace("Professeur : ", "") || ""
				var status = linesDescription.find(line => line.startsWith("Statut : "))?.replace("Statut : ", "") || undefined
				var classrooms = event.location?.replace("Salles ", "")?.replace("Salle ", "") || ""
				var canceled = event.summary.startsWith("̶")

				// Trouver l'événement correspondant dans l'EDT Pronote
				const eventFromPronoteEdt = calendar.find(e => e.id == uniqueId)

				// Si l'événement n'est pas trouvé dans l'EDT Pronote et qu'il a un ID valide (= ajouté par le bot)
				if(!eventFromPronoteEdt && uniqueId){
					var relativeDate = dateToString(new Date(event.start))
					// if(new Date(event.start).getTime() > Date.now()) sendNtfy("Cours supprimé", `Le cours "${unstrikethrough(event.summary.replace(" (annulé)", ""))}" ${relativeDate} à ${new Date(event.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} est annulé`)
					listChanges.push({ type: "delete-in-google", event: event })
				}

				// Si l'événement est trouvé dans l'EDT Pronote, mais qu'il est maintenant annulé
				else if(eventFromPronoteEdt && eventFromPronoteEdt.canceled){
					var relativeDate = dateToString(new Date(event.start))
					// if(new Date(event.start).getTime() > Date.now()) sendNtfy("Cours annulé", `Le cours "${classnameParser(eventFromPronoteEdt.name)}" ${relativeDate} à ${new Date(event.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} est annulé`)
					listChanges.push({ type: "delete-in-google", event: event })
				}

				// Si certaines infos ont changées
				else if(eventFromPronoteEdt && uniqueId){
					if(classnameParser(eventFromPronoteEdt.name) != unstrikethrough(event.summary.replace(" (annulé)", ""))) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
					else if(arrayToStringMasculin(eventFromPronoteEdt.teachers) != teachers) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
					else if((groups && eventFromPronoteEdt?.groups?.length && arrayToStringMasculin(eventFromPronoteEdt.groups.map(grp => removeBrackets(grp))) != groups) || (!groups && eventFromPronoteEdt.groups?.length) || (groups && !eventFromPronoteEdt.groups?.length)) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
					else if((!classrooms?.length && eventFromPronoteEdt?.classrooms?.join(", ")?.length) || (classrooms?.length && !eventFromPronoteEdt?.classrooms?.join(", ")?.length) || eventFromPronoteEdt.classrooms.join(", ") != classrooms) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
					else if((status && eventFromPronoteEdt.status && eventFromPronoteEdt.status != status) || (!status && eventFromPronoteEdt.status) || (status && !eventFromPronoteEdt.status)) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
					else if(eventFromPronoteEdt.canceled != canceled) listChanges.push({ type: "update-in-google", event: event, newEvent: eventFromPronoteEdt })
				}
			}

			// Passer sur tout les éléments de l'EDT Pronote, et vérifier par rapport à l'agenda Google
			for(const eventFromPronoteEdt of calendar){
				// Trouver l'événement correspondant dans l'agenda Google
				const event = events.data.items.find(e => e.description && e.description.split("\nID : ")?.[1] == eventFromPronoteEdt.id)

				// Si l'événement n'est pas trouvé dans l'agenda Google, et que le cours n'est pas annulé
				if(!event && !eventFromPronoteEdt.canceled) listChanges.push({ type: "add-in-google", event: eventFromPronoteEdt })
			}
			console.log(`Comparaison terminée ! (${(performance.now() - perf).toFixed(2)}ms) (${listChanges.length} changement${listChanges.length > 1 ? "s" : ""})`)
			console.log(listChanges)

			// Appliquer les changements
			if(listChanges.length){
				perf = performance.now()
				console.log("Application des changements...")

				for(const change of listChanges){
					var event = change.event

					// Si c'est un ajout
					if(change.type == "add-in-google"){
						const newEvent = {
							summary: event.status == "Prof. absent" || event.canceled ? `${strikethrough(classnameParser(event.name))} (annulé)` : classnameParser(event.name),
							location: event?.classrooms?.length ? `Salle${event?.classrooms?.length > 1 ? "s" : ""} ${event?.classrooms.join(", ")}` : null,
							description: `${event.status ? `Statut : ${event.status}\n\n` : ""}${event.groups.length ? `Groupe : ${arrayToStringMasculin(event.groups.map(grp => removeBrackets(grp)))}\n` : ""}Professeur : ${arrayToStringMasculin(event.teachers)}\n\nID : ${event.id}`,
							start: { dateTime: new Date(event.start).toISOString() },
							end: { dateTime: new Date(event.end).toISOString() },
							reminders: {
								useDefault: false,
								overrides: [{ method: "popup", minutes: 15 }]
							}
						}
						await calendarAPI.events.insert({
							calendarId: calendarID,
							resource: newEvent
						}).catch(e => {
							console.error("Impossible d'ajouter un événement dans l'agenda Google :", e)
						})
					}

					// Si c'est une suppression
					else if(change.type == "delete-in-google"){
						console.log("debug info, delete in google: ", event, event.summary)
						// event.start.dateTime = événement dans le calendrier Google /// event.start = événement dans l'EDT Pronote
						if(new Date(event.start.dateTime).getTime() > Date.now()) sendNtfy("Cours annulé", `Le cours "${classnameParser(event.summary.replace(" (annulé)", ""))}" ${dateToString(new Date(event.start.dateTime))} à ${new Date(event.start.dateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} est annulé`)

						await calendarAPI.events.delete({
							calendarId: calendarID,
							eventId: event.id
						}).catch(e => {
							console.error("Impossible de supprimer un événement dans l'agenda Google :", e)
						})
					}

					// Si c'est une mise à jour
					else if(change.type == "update-in-google"){
						event = change.newEvent
						const newEventInfos = {
							summary: event.status == "Prof. absent" || event.canceled ? `${strikethrough(classnameParser(event.name))} (annulé)` : classnameParser(event.name),
							location: event?.classrooms?.length ? `Salle${event?.classrooms?.length > 1 ? "s" : ""} ${event?.classrooms.join(", ")}` : null,
							description: `${event.status ? `Statut : ${event.status}\n\n` : ""}${event?.groups?.length ? `Groupe : ${arrayToStringMasculin(event.groups.map(grp => removeBrackets(grp)))}\n` : ""}Professeur : ${arrayToStringMasculin(event.teachers)}\n\nID : ${event.id}`,
							start: { dateTime: new Date(event.start).toISOString() },
							end: { dateTime: new Date(event.end).toISOString() },
							reminders: {
								useDefault: false,
								overrides: [{ method: "popup", minutes: 15 }]
							}
						}

						var relativeDate = dateToString(new Date(event.start))
						if(new Date(event.start).getTime() > Date.now()) sendNtfy("Cours modifié", `Le cours "${classnameParser(event.name)}" ${relativeDate} à ${event.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} a été modifié`)

						await calendarAPI.events.update({
							calendarId: calendarID,
							eventId: change.event.id,
							resource: newEventInfos
						}).catch(e => {
							console.error("Impossible de mettre à jour un événement dans l'agenda Google :", e)
						})
					}
				}
				console.log(`Changements appliqués ! (${(performance.now() - perf).toFixed(2)}ms)`)
			}

			console.log("En attente de la prochaine vérification périodique...")
		},
		start: true,
	})
}
main()