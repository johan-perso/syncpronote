var names = {
	"FRANCAIS": "Français",
	"MATHEMATIQUES": "Mathématiques",
	"PHYSIQUE-CHIMIE": "Physique Chimie",
	"SCIENCES VIE & TERRE": "SVT",
	"ENS. MORAL & CIVIQUE": "EMC",
	"ESPAGNOL LV2": "Espagnol",
	"ALLEMAND LV2": "Allemand",
	"ITALIEN LV2": "Italien",
	"ANGLAIS LV1": "Anglais",
	"ED.PHYSIQUE & SPORT.": "EPS",
	"HISTOIRE-GEOGRAPHIE": "Histoire Géo",
	"SC. ECONO.& SOCIALES": "SES",
	"SC.NUMERIQ.TECHNOL.": "SNT",
	"TECHNOLOGIE": "Technologie",
	"ARTS PLASTIQUES": "Arts Plastiques",
	"ED.MUSICALE": "Musique",
	"THEATRE": "Théâtre"
}

module.exports = function (text){
	if(names[text]) return names[text]
	else return text
}