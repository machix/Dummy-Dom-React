import moment from 'moment'

export function findDayOfWeek (datesArr, dayInt) {
  var dateUnix = datesArr[dayInt - 1]
  var momentTime = moment.utc(dateUnix)
  var momentDayInt = parseInt(momentTime.format('d'))
  return momentDayInt
}

export function findOpenAndCloseUnix (dayOfWeek, googlePlaceData) {
  var allPeriods = googlePlaceData.openingHours
  var period = allPeriods.find(e => {
    return e.open.day === dayOfWeek
  })
  var output = ['open', 'close'].map(e => {
    var hours = parseInt(period[e].time.substring(0, 2))
    var mins = parseInt(period[e].time.substring(2, 4))
    return (hours * 3600) + (mins * 60)
  })

  if (period.close.day === period.open.day + 1) {
    output[1] += (24 * 60 * 60)
  }

  return output
}

// given googlePlaceData (containing both arr of periods and arr of text), datesArr and startDay, return validation error type
export function validateOpeningHours (googlePlaceData, datesArr, startDayInt, endDayInt, startTime, endTime) {
  var errorTypes = {
    '1': 'Place is closed on selected day',
    '2': 'Selected start time is before opening time',
    '3': 'Selected end time is after closing time',
    '4': 'Location is closed sometime between selected start and end days',
    '5': 'Start time is after end time'
  }
  // find opening hours str
  var dateUnix = datesArr[startDayInt - 1]
  var momentTime = moment.utc(dateUnix)
  var momentDayStr = momentTime.format('dddd')
  if (googlePlaceData.openingHoursText) {
    var textArr = googlePlaceData.openingHoursText.filter(e => {
      return e.indexOf(momentDayStr) > -1
    })
    var openingHoursStr = textArr[0]
  }

  if (!openingHoursStr || openingHoursStr.indexOf('Open 24 hours') > -1) return

  if (openingHoursStr.indexOf('Closed') > -1) {
    return errorTypes['1']
  }

  // if not 24 hrs, closed, then continue validating
  var dayOfWeekInt = findDayOfWeek(datesArr, startDayInt)
  var openAndCloseUnixArr = findOpenAndCloseUnix(dayOfWeekInt, googlePlaceData)
  var openingUnix = openAndCloseUnixArr[0]
  var closingUnix = openAndCloseUnixArr[1]
  // compare timings
  if (startDayInt === endDayInt) {
    if (startTime && endTime && startTime > endTime) {
      return errorTypes['5']
    }
    if (startTime && startTime < openingUnix) {
      return errorTypes['2']
    }
    if (endTime && endTime > closingUnix) {
      return errorTypes['3']
    }
  } else if (endDayInt === startDayInt + 1) {
    endTime = endTime + (24 * 60 * 60)
    if (startTime && startTime < openingUnix) {
      return errorTypes['2']
    }
    if (endTime && endTime > closingUnix) {
      return errorTypes['3']
    }
  } else if (endDayInt > startDayInt + 1) {
    return errorTypes['4']
  }

  // if no returns happened above (time is missing, or no errors), return no error
  return null
}
