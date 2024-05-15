// Textes barrés
var strikethroughChars = {
	"a": "̶a̶", "A": "̶A̶",
	"b": "̶b̶", "B": "̶B̶",
	"c": "̶c̶", "C": "̶C̶",
	"d": "̶d̶", "D": "̶D̶",
	"e": "̶e̶", "E": "̶E̶",
	"f": "̶f̶", "F": "̶F̶",
	"g": "̶g̶", "G": "̶G̶",
	"h": "̶h̶", "H": "̶H̶",
	"i": "̶i̶", "I": "̶I̶",
	"j": "̶j̶", "J": "̶J̶",
	"k": "̶k̶", "K": "̶K̶",
	"l": "̶l̶", "L": "̶L̶",
	"m": "̶m̶", "M": "̶M̶",
	"n": "̶n̶", "N": "̶N̶",
	"o": "̶o̶", "O": "̶O̶",
	"p": "̶p̶", "P": "̶P̶",
	"q": "̶q̶", "Q": "̶Q̶",
	"r": "̶r̶", "R": "̶R̶",
	"s": "̶s̶", "S": "̶S̶",
	"t": "̶t̶", "T": "̶T̶",
	"u": "̶u̶", "U": "̶U̶",
	"v": "̶v̶", "V": "̶V̶",
	"w": "̶w̶", "W": "̶W̶",
	"x": "̶x̶", "X": "̶X̶",
	"y": "̶y̶", "Y": "̶Y̶",
	"z": "̶z̶", "Z": "̶Z̶"
}

module.exports.strikethrough = function (text){
	return text.split("").map(char => strikethroughChars[char] || char).join("")
}
module.exports.unstrikethrough = function (text){
	return text.replace(/̶/g, "")
}