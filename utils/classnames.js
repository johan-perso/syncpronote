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
	"INGENIER.&DEV.DURAB.": "I2D",
	"INGEN.INNOV.DEV.DUR.": "2I2D",
	"INNOVATION TECHNOL.": "Innovation Techno.",
	"PHYSIQ.CHIMIE&MATHS": "Physique Chimie & Maths",
	"ENSEIGNEMENT TECHNOLOGIQUE EN LANGUE VIVANTE 1": "ETLV",
	"ACCOMP.CHOIX ORIENT.": "Accomp. Orientation",
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