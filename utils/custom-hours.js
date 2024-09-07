// Format : hh:mm (commencer l'heure par un zéro)
// <heure annoncé par Pronote> : <heure réelle>
var startHours = {
	'10:00': '10:10',
	'11:00': '11:10',
	'12:00': '12:10',
	'13:00': '13:10',
	'14:00': '14:10',
	'15:00': '15:20',
	'16:00': '16:20',
	'17:00': '17:20',
}

var endHours = {
	'09:00': '08:55',
	'10:00': '09:55',
	'11:00': '11:05',
	'12:00': '12:05',
	'13:00': '13:05',
	'14:00': '14:05',
	'15:00': '15:05',
	'16:00': '16:15',
	'17:00': '17:15',
	'18:00': '18:15',
}

module.exports.correctTime = function (date, type) { // type = 'start' | 'end'
	var hours = date.getHours();
	var minutes = date.getMinutes();
	if (minutes < 10) minutes = '0' + minutes;
	if (hours < 10) hours = '0' + hours;
	var time = hours + ':' + minutes;

	if (type == 'start' && startHours[time]) {
		var newTime = startHours[time].split(':');
		date.setHours(newTime[0]);
		date.setMinutes(newTime[1]);
	}
	if (type == 'end' && endHours[time]) {
		var newTime = endHours[time].split(':');
		date.setHours(newTime[0]);
		date.setMinutes(newTime[1]);
	}

	return date;
}