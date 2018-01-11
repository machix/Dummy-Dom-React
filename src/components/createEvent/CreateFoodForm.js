import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import { connect } from 'react-redux'
import Radium from 'radium'
import { retrieveCloudStorageToken } from '../../actions/cloudStorageActions'

import { createEventFormContainerStyle, createEventFormBoxShadow, createEventFormLeftPanelStyle, greyTintStyle, eventDescriptionStyle, eventDescContainerStyle, eventWarningStyle, createEventFormRightPanelStyle, attachmentsStyle, bookingNotesContainerStyle } from '../../Styles/styles'

import SingleLocationSelection from '../location/SingleLocationSelection'
import DateTimePicker from '../eventFormComponents/DateTimePicker'
import BookingDetails from '../eventFormComponents/BookingDetails'
import LocationAlias from '../eventFormComponents/LocationAlias'
import Notes from '../eventFormComponents/Notes'
import Attachments from '../eventFormComponents/Attachments'
import SubmitCancelForm from '../eventFormComponents/SubmitCancelForm'

import { createFood } from '../../apollo/food'
import { changingLoadSequence } from '../../apollo/changingLoadSequence'
import { queryItinerary } from '../../apollo/itinerary'

import { retrieveToken, removeAllAttachments } from '../../helpers/cloudStorage'
import { allCurrenciesList } from '../../helpers/countriesToCurrencyList'
import newEventLoadSeqAssignment from '../../helpers/newEventLoadSeqAssignment'
import latestTime from '../../helpers/latestTime'
import moment from 'moment'
import { constructGooglePlaceDataObj, constructLocationDetails } from '../../helpers/location'
import { findDayOfWeek, findOpenAndCloseUnix } from '../../helpers/openingHoursValidation'
import newEventTimelineValidation from '../../helpers/newEventTimelineValidation'
import checkStartAndEndTime from '../../helpers/checkStartAndEndTime'

const defaultBackground = `${process.env.REACT_APP_CLOUD_PUBLIC_URI}foodDefaultBackground.jpg`

class CreateFoodForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ItineraryId: this.props.ItineraryId,
      startDay: this.props.day,
      endDay: this.props.day,
      googlePlaceData: {},
      locationAlias: '',
      description: '',
      notes: '',
      defaultTime: null,
      startTime: null, // if setstate, will change to unix
      endTime: null, // if setstate, will change to unix
      cost: 0,
      currency: '',
      currencyList: [],
      bookedThrough: '',
      bookingConfirmation: '',
      attachments: [],
      backgroundImage: defaultBackground,
      locationDetails: {
        address: null,
        telephone: null,
        openingHours: null
      },
      openingHoursValidation: null
    }
  }

  updateDayTime (field, value) {
    this.setState({
      [field]: value
    })
  }

  handleChange (e, field) {
    this.setState({
      [field]: e.target.value
    })
  }

  handleSubmit () {
    var bookingStatus = this.state.bookingConfirmation ? true : false

    var newFood = {
      ItineraryId: parseInt(this.state.ItineraryId),
      locationAlias: this.state.locationAlias,
      startDay: this.state.startDay,
      endDay: this.state.endDay,
      startTime: this.state.startTime,
      endTime: this.state.endTime,
      description: this.state.description,
      notes: this.state.notes,
      currency: this.state.currency,
      cost: parseInt(this.state.cost),
      bookingStatus: bookingStatus,
      bookedThrough: this.state.bookedThrough,
      bookingConfirmation: this.state.bookingConfirmation,
      attachments: this.state.attachments,
      backgroundImage: this.state.backgroundImage,
      openingHoursValidation: this.state.openingHoursValidation
    }
    if (this.state.googlePlaceData.placeId) newFood.googlePlaceData = this.state.googlePlaceData

    // VALIDATE START AND END TIMES
    if (typeof (newFood.startTime) !== 'number' || typeof (newFood.endTime) !== 'number') {
      console.log('time is missing')
      return
    }

    // VALIDATE AND ASSIGN MISSING TIMINGS
    // if (typeof (newFood.startTime) !== 'number' && typeof (newFood.endTime) !== 'number') {
    //   newFood = checkStartAndEndTime(this.props.events, newFood, 'allDayEvent')
    // } else if (typeof (newFood.startTime) !== 'number') {
    //   newFood = checkStartAndEndTime(this.props.events, newFood, 'startTimeMissing')
    // } else if (typeof (newFood.startTime) !== 'number') {
    //   newFood = checkStartAndEndTime(this.props.events, newFood, 'endTimeMissing')
    // }

    // VALIDATE PLANNER TIMINGS
    var output = newEventTimelineValidation(this.props.events, 'Food', newFood)
    console.log('output', output)

    if (!output.isValid) {
      window.alert(`time ${newFood.startTime} --- ${newFood.endTime} clashes with pre existing events.`)
      console.log('ERROR ROWS', output.errorRows)
    }

    var helperOutput = newEventLoadSeqAssignment(this.props.events, 'Food', newFood)
    console.log('helper output', helperOutput)

    this.props.changingLoadSequence({
      variables: {
        input: helperOutput.loadSequenceInput
      }
    })

    this.props.createFood({
      variables: helperOutput.newEvent,
      refetchQueries: [{
        query: queryItinerary,
        variables: { id: this.props.ItineraryId }
      }]
    })

    this.resetState()
    this.props.toggleCreateEventType()
  }

  closeCreateFood () {
    removeAllAttachments(this.state.attachments, this.apiToken)
    this.resetState()
    this.props.toggleCreateEventType()
  }

  resetState () {
    this.setState({
      startDay: this.props.startDay,
      endDay: this.props.endDay,
      googlePlaceData: {},
      locationAlias: '',
      description: '',
      notes: '',
      type: '',
      startTime: null, // should be Int
      endTime: null, // should be Int
      cost: 0,
      currency: this.state.currencyList[0],
      bookedThrough: '',
      bookingConfirmation: '',
      attachments: [],
      backgroundImage: defaultBackground,
      locationDetails: {
        address: null,
        telephone: null,
        openingHours: null
      },
      openingHoursValidation: null
    })
    this.apiToken = null
  }

  selectLocation (place) {
    var googlePlaceData = constructGooglePlaceDataObj(place)
    this.setState({googlePlaceData: googlePlaceData}, () => {
      var locationDetails = constructLocationDetails(this.state.googlePlaceData, this.props.dates, this.state.startDay)
      this.setState({locationDetails: locationDetails})
    })
  }

  handleFileUpload (attachmentInfo) {
    this.setState({attachments: this.state.attachments.concat([attachmentInfo])})
  }

  removeUpload (index) {
    var files = this.state.attachments
    var newFilesArr = (files.slice(0, index)).concat(files.slice(index + 1))

    this.setState({attachments: newFilesArr})
    this.setState({backgroundImage: defaultBackground})
  }

  setBackground (previewUrl) {
    previewUrl = previewUrl.replace(/ /gi, '%20')
    this.setState({backgroundImage: `${previewUrl}`})
  }

  componentDidMount () {
    this.props.retrieveCloudStorageToken()

    this.props.cloudStorageToken.then(obj => {
      this.apiToken = obj.token
    })

    var currencyList = allCurrenciesList()
    this.setState({currencyList: currencyList})
    this.setState({currency: currencyList[0]})

    var defaultUnix = latestTime(this.props.events, this.props.day)
    var defaultTime = moment.utc(defaultUnix * 1000).format('HH:mm')
    this.setState({defaultTime: defaultTime})
    this.setState({startTime: defaultUnix, endTime: defaultUnix})
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.googlePlaceData) {
      if (prevState.startDay !== this.state.startDay) {
        var locationDetails = constructLocationDetails(this.state.googlePlaceData, this.props.dates, this.state.startDay)
        this.setState({locationDetails: locationDetails})
      }
      if (prevState.locationDetails !== this.state.locationDetails || prevState.startDay !== this.state.startDay || prevState.endDay !== this.state.endDay || (this.state.startTime && prevState.startTime !== this.state.startTime) || (this.state.endTime && prevState.endTime !== this.state.endTime)) {
        this.validateOpeningHours()
      }
      // if time has been cleared out remove the warning text
      if (!this.state.startTime && this.state.startTime !== prevState.startTime) {
        this.setState({openingHoursValidation: null})
      }
      if (!this.state.endTime && this.state.endTime !== prevState.endTime) {
        this.setState({openingHoursValidation: null})
      }
    }
  }

  validateOpeningHours () {
    this.setState({openingHoursValidation: null})
    var openingHoursText = this.state.locationDetails.openingHours

    if (!openingHoursText || openingHoursText.indexOf('Open 24 hours') > -1) return

    if (openingHoursText.indexOf('Closed') > -1) {
      this.setState({openingHoursValidation: '1 -> Place is closed on selected day'})
    } else {
      var dayOfWeek = findDayOfWeek(this.props.dates, this.state.startDay)

      var openingAndClosingArr = findOpenAndCloseUnix(dayOfWeek, this.state.googlePlaceData)
      var openingUnix = openingAndClosingArr[0]
      var closingUnix = openingAndClosingArr[1]

      var startUnix = this.state.startTime
      var endUnix = this.state.endTime

      if (this.state.endDay === this.state.startDay) {
        if (startUnix && startUnix < openingUnix) {
          this.setState({openingHoursValidation: '2 -> Start time is before opening'})
        }
        if (endUnix && endUnix > closingUnix) {
          this.setState({openingHoursValidation: '3 -> End time is after closing'})
        }
        if (startUnix && endUnix && startUnix > endUnix) {
          this.setState({openingHoursValidation: '4 -> start time is after end time'})
        }
      } else if (this.state.endDay === this.state.startDay + 1) {
        // day 2 unix is 1 full day + unix from midnight
        endUnix += (24 * 60 * 60)
        if (startUnix && startUnix < openingUnix) {
          this.setState({openingHoursValidation: '2 -> Start time is before opening'})
        }
        if (endUnix && endUnix > closingUnix) {
          this.setState({openingHoursValidation: '3 -> End time is after closing'})
        }
      } else if (this.state.endDay > this.state.startDay + 1) {
        this.setState({openingHoursValidation: '5 -> Location is closed sometime between selected days'})
      }
    }
  }

  render () {
    return (
      <div style={createEventFormContainerStyle}>

        {/* BOX SHADOW WRAPS LEFT AND RIGHT PANEL ONLY */}
        <div style={createEventFormBoxShadow}>

          {/* LEFT PANEL --- BACKGROUND, LOCATION, DATETIME */}
          <div style={createEventFormLeftPanelStyle(this.state.backgroundImage)}>
            <div style={greyTintStyle} />
            <div style={{...eventDescContainerStyle, ...{marginTop: '120px'}}}>
              <SingleLocationSelection selectLocation={place => this.selectLocation(place)} currentLocation={this.state.googlePlaceData} locationDetails={this.state.locationDetails} />
            </div>
            <div style={eventDescContainerStyle}>
              <input className='left-panel-input' placeholder='Input Description' type='text' name='description' value={this.state.description} onChange={(e) => this.handleChange(e, 'description')} autoComplete='off' style={eventDescriptionStyle(this.state.backgroundImage)} key='fooddescription' />
            </div>
            {/* CONTINUE PASSING DATE AND DATESARR DOWN */}
            <DateTimePicker updateDayTime={(field, value) => this.updateDayTime(field, value)} dates={this.props.dates} date={this.props.date} startDay={this.state.startDay} endDay={this.state.endDay} defaultTime={this.state.defaultTime} />

            {this.state.openingHoursValidation &&
              <div>
                <h4 style={eventWarningStyle(this.state.backgroundImage)}>Warning: {this.state.openingHoursValidation}</h4>
              </div>
            }
          </div>

          {/* RIGHT PANEL --- SUBMIT/CANCEL, BOOKINGNOTES */}
          <div style={createEventFormRightPanelStyle()}>
            <div style={bookingNotesContainerStyle}>
              <SubmitCancelForm handleSubmit={() => this.handleSubmit()} closeCreateForm={() => this.closeCreateFood()} />
              <h4 style={{fontSize: '24px'}}>Booking Details</h4>
              <BookingDetails handleChange={(e, field) => this.handleChange(e, field)} currency={this.state.currency} currencyList={this.state.currencyList} cost={this.state.cost} />
              <h4 style={{fontSize: '24px', marginTop: '50px'}}>
                  Additional Notes
              </h4>
              <LocationAlias handleChange={(e) => this.handleChange(e, 'locationAlias')} />
              <Notes handleChange={(e, field) => this.handleChange(e, field)} />
            </div>
          </div>
        </div>

        {/* BOTTOM PANEL --- ATTACHMENTS */}
        <div style={attachmentsStyle}>
          <Attachments handleFileUpload={(e) => this.handleFileUpload(e)} attachments={this.state.attachments} ItineraryId={this.state.ItineraryId} removeUpload={i => this.removeUpload(i)} setBackground={url => this.setBackground(url)} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    events: state.plannerActivities,
    cloudStorageToken: state.cloudStorageToken
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    retrieveCloudStorageToken: () => {
      dispatch(retrieveCloudStorageToken())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(compose(
  graphql(createFood, {name: 'createFood'}),
  graphql(changingLoadSequence, {name: 'changingLoadSequence'})
)(Radium(CreateFoodForm)))
