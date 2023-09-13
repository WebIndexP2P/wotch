var secondsToHuman = function(seconds) {
    if (seconds == 0) return "Just now";
    if (seconds / 60 / 60 / 24 / 365 > 1) {
        var num = Math.round(seconds / 60 / 60 / 24 / 365);
        return num + ' year' + ((num > 1) ? 's': '');
    }
    if (seconds / 60 / 60 / 24 / 30 > 1) {
        var num = Math.round(seconds / 60 / 60 / 24 / 30);
        return num + ' month' + ((num > 1) ? 's': '');
    }
    if (seconds / 60 / 60 / 24 > 7) {
        var num = Math.round(seconds / 60 / 60 / 24 / 7);
        return num + ' week' + ((num > 1) ? 's': '');
    }
    if (seconds / 60 / 60 / 24 > 1) {
        var num = Math.round(seconds / 60 / 60 / 24);
        return num + ' day' + ((num > 1) ? 's': '');
    }
    if (seconds / 60 / 60 > 1) {
        var num = Math.round(seconds / 60 / 60);
        return num + ' hour' + ((num > 1) ? 's': '');
    }
    else if (seconds / 60 > 1) {
        var num  = Math.round(seconds / 60);
        return num + ' minute' + ((num > 1) ? 's': '');
    }
    else {
        return Math.round(seconds) + ' second' + ((seconds >= 2) ? 's': '');
    }
}

var dateSimpleFormat = function(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

export default {
    secondsToHuman: secondsToHuman,
    dateSimpleFormat: dateSimpleFormat
}
