import React, { Component } from 'react'
import { graphql } from 'react-apollo'
import Radium, { Style } from 'radium'
import moment from 'moment'

import { labelStyle, createEventFormContainerStyle, createEventFormBoxShadow, createEventFormLeftPanelStyle, greyTintStyle, eventDescriptionStyle, eventDescContainerStyle, createEventFormRightPanelStyle, attachmentsStyle, bookingNotesContainerStyle } from '../../Styles/styles'

import FlightSearchParameters from '../eventFormComponents/FlightSearchParameters'
import FlightSearchResults from '../eventFormComponents/FlightSearchResults'
import FlightSearchDetailsContainer from '../eventFormComponents/FlightSearchDetailsContainer'
import BookingDetails from '../eventFormComponents/BookingDetails'
import Notes from '../eventFormComponents/Notes'

import Attachments from '../eventFormComponents/Attachments'
import SubmitCancelForm from '../eventFormComponents/SubmitCancelForm'

import { createFlightBooking } from '../../apollo/flight'
import { queryItinerary } from '../../apollo/itinerary'

import retrieveToken from '../../helpers/cloudstorage'
import countriesToCurrencyList from '../../helpers/countriesToCurrencyList'

const defaultBackground = `${process.env.REACT_APP_CLOUD_PUBLIC_URI}flightDefaultBackground.jpg`

class CreateFlightForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      currencyList: [], // not submitted
      ItineraryId: this.props.ItineraryId,
      paxAdults: null,
      paxChildren: null,
      paxInfants: null,
      cost: 0,
      currency: '',
      classCode: '',
      bookedThrough: '',
      bookingConfirmation: '',
      backgroundImage: defaultBackground,
      attachments: [],
      flightInstances: [],
      // ARR OF FLIGHTINSTANCE INPUT
      // input createFlightInstanceInput {
        // flightNumber: Int
        // airlineCode: String
        // airlineName: String
        // departureIATA: String
        // arrivalIATA: String
        // departureTerminal: String
        // arrivalTerminal: String
        // departureGate: String
        // arrivalGate: String
        // startDate: Int
        // endDate: Int
        // startDay: Int
        // endDay: Int
        // startTime: Int
        // endTime: Int
        // startLoadSequence: Int
        // endLoadSequence: Int
        // notes: String
      // }
      flights: [],
      searching: false,
      bookingDetails: false,
      selected: 0,
      tripType: '',
      flightDetailsPage: 1,
      searchClicked: 1
    }
  }

  handleSearch (flights, tripType, adults, children, infants, classCode) {
    this.setState({
      flights,
      tripType: tripType,
      paxAdults: adults,
      paxChildren: children,
      paxInfants: infants,
      classCode: classCode,
      searching: true
    })
    console.log(this.state)
  }

  handleSubmit () {
    console.log('handle submit flight')
    // NEEDS TESTING AGAINST CREATEFLIGHTBOOKING MUTATION

    var bookingStatus = this.state.bookingConfirmation ? true : false

    var newFlight = {
      ItineraryId: parseInt(this.state.ItineraryId),
      paxAdults: this.state.paxAdults,
      paxChildren: this.state.paxChildren,
      paxInfants: this.state.paxInfants,
      cost: this.state.cost,
      currency: this.state.currency,
      classCode: this.state.classCode,
      bookingStatus: bookingStatus,
      bookedThrough: this.state.bookedThrough,
      bookingConfirmation: this.state.bookingConfirmation,
      backgroundImage: this.state.backgroundImage,
      attachments: this.state.attachments,
      flightInstances: this.state.flightInstances
    }

    console.log('newFlight', newFlight)

    this.props.createFlightBooking({
      variables: newFlight,
      refetchQueries: [{
        query: queryItinerary,
        variables: { id: this.props.ItineraryId }
      }]
    })

    this.resetState()
    this.props.toggleCreateEventType()
  }

  closeCreateFlight () {
    this.state.attachments.forEach(info => {
      var uri = info.fileName.replace('/', '%2F')
      var uriBase = process.env.REACT_APP_CLOUD_DELETE_URI
      var uriFull = uriBase + uri

      fetch(uriFull, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      })
      .then(response => {
        console.log(response)
        if (response.status === 204) {
          console.log('delete from cloud storage succeeded')
        }
      })
      .catch(err => console.log(err))
    })
    this.resetState()
    this.props.toggleCreateEventType()
  }

  resetState () {
    this.setState({
      paxAdults: null,
      paxChildren: null,
      paxInfants: null,
      cost: 0,
      currency: '',
      classCode: '',
      bookedThrough: '',
      bookingConfirmation: '',
      backgroundImage: defaultBackground,
      attachments: [],
      flightInstances: [],
      flights: [] // clear flight search results
    })
  }

  handleFileUpload (e) {
    e.preventDefault()
    var file = e.target.files[0]
    console.log('file', file)
    if (file) {
      var ItineraryId = this.state.ItineraryId
      var timestamp = Date.now()
      var uriBase = process.env.REACT_APP_CLOUD_UPLOAD_URI
      var uriFull = `${uriBase}Itinerary${ItineraryId}/${file.name}_${timestamp}`
      fetch(uriFull,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': file.type,
            'Content-Length': file.size
          },
          body: file
        }
      )
      .then(response => {
        return response.json()
      })
      .then(json => {
        console.log('json', json)
        if (json.name) {
          var kilobytes = json.size / 1000
          if (kilobytes >= 1000) {
            var megabytes = kilobytes / 1000
            megabytes = Math.round(megabytes * 10) / 10
            var fileSizeStr = megabytes + 'MB'
          } else {
            kilobytes = Math.round(kilobytes)
            fileSizeStr = kilobytes + 'KB'
          }
          // this.setState({attachments: this.state.attachments.concat([json.name])})
          this.setState({
            attachments: this.state.attachments.concat([
              {
                fileName: json.name,
                fileAlias: file.name,
                fileSize: fileSizeStr,
                fileType: file.type
              }
            ])
          })
        }
      })
      .catch(err => {
        console.log('err', err)
      })
    }
  }

  removeUpload (index) {
    var objectName = this.state.attachments[index].fileName
    objectName = objectName.replace('/', '%2F')
    var uriBase = process.env.REACT_APP_CLOUD_DELETE_URI
    var uriFull = uriBase + objectName

    fetch(uriFull, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    })
    .then(response => {
      console.log(response)
      if (response.status === 204) {
        console.log('delete from cloud storage succeeded')
      }
    })
    .then(() => {
      var files = this.state.attachments
      var newFilesArr = (files.slice(0, index)).concat(files.slice(index + 1))

      this.setState({attachments: newFilesArr})
      this.setState({backgroundImage: defaultBackground})
    })
    .catch(err => {
      console.log(err)
    })
  }

  setBackground (previewUrl) {
    previewUrl = previewUrl.replace(/ /gi, '%20')
    this.setState({backgroundImage: `${previewUrl}`})
  }

  handleSelectFlight (index) {
    const datesUnix = this.props.dates.map(e => {
      return moment(e).unix()
    })
    console.log(datesUnix)
    this.setState({
      selected: index,
      flightDetailsPage: 1,
      flightInstances: this.state.flights[index].flights.map((flight, i) => {
        const startDayUnix = moment.utc(flight.departureDateTime.slice(0, 10)).unix()
        const endDayUnix = moment.utc(flight.arrivalDateTime.slice(0, 10)).unix()
        const startTime = moment.utc(flight.departureDateTime).unix() - startDayUnix
        const endTime = moment.utc(flight.arrivalDateTime).unix() - endDayUnix
        console.log(startTime, endTime)
        return {
          flightNumber: flight.flightNum,
          airlineCode: flight.carrierCode,
          airlineName: flight.airlineName,
          departureIATA: flight.departureAirportCode,
          arrivalIATA: flight.arrivalAirportCode,
          departureTerminal: flight.departureTerminal,
          arrivalTerminal: flight.arrivalTerminal,
          startDay: datesUnix.indexOf(startDayUnix) + 1,
          endDay: datesUnix.indexOf(endDayUnix) + 1,
          startTime: startTime,
          endTime: endTime,
          startLoadSequence: 1,
          endLoadSequence: 2,
          notes: String,
          firstFlight: i === 0
        }
      })
    })
    console.log(this.state)
  }

  handleChange (e, field, subfield, index) {
    if (subfield) {
      let newState = this.state[field].slice(0)
      newState[index][subfield] = e.target.value
      this.setState({
        [field]: newState
      })
      console.log(this.state)
    } else {
      this.setState({
        [field]: e.target.value
      })
    }
  }

  componentDidMount () {
    retrieveToken()
      .then(retrieved => {
        this.apiToken = retrieved
      })

    var currencyList = countriesToCurrencyList(this.props.countries)
    this.setState({currencyList: currencyList})
    this.setState({currency: currencyList[0]})
  }

  render () {
    return (
      <div style={createEventFormContainerStyle}>
        {/* BOX SHADOW WRAPS LEFT AND RIGHT PANEL ONLY */}
        <div style={createEventFormBoxShadow}>

          {/* LEFT PANEL --- LOCATION X 2, DATE DAY X 2, PAX, SELECTED FLIGHT */}
          <div style={createEventFormLeftPanelStyle(this.state.backgroundImage, 'flight')}>
            <div style={greyTintStyle} />
            <div style={eventDescContainerStyle}>
              <FlightSearchParameters searchClicked={this.state.searchClicked} bookingDetails={this.state.bookingDetails} searching={this.state.searching} dates={this.props.dates} date={this.props.date} handleSearch={(flights, tripType, adults, children, infants, classCode) => this.handleSearch(flights, tripType, adults, children, infants, classCode)} closeCreateForm={() => this.closeCreateFlight()} />
              {(this.state.searching || (!this.state.searching && this.state.bookingDetails)) && <FlightSearchDetailsContainer searching={this.state.searching} flights={this.state.flights} selected={this.state.selected} tripType={this.state.tripType} page={this.state.flightDetailsPage} />}
            </div>
          </div>
          {/* RESULTS PANEL(CHILD OF SEARCH PARAMS) */}

          {/* RIGHT PANEL --- SUBMIT/CANCEL, BOOKINGS, MULTIPLE DETAILS/NOTES */}
          <div style={createEventFormRightPanelStyle('flight')}>
            <div style={bookingNotesContainerStyle}>
              <SubmitCancelForm flight handleSubmit={() => this.handleSubmit()} closeCreateForm={() => this.closeCreateFlight()} />
              {this.state.bookingDetails && (
                <div>
                  <h4 style={{fontSize: '24px'}}>Booking Details</h4>
                  <BookingDetails flight handleChange={(e, field) => this.handleChange(e, field)} currency={this.state.currency} currencyList={this.state.currencyList} cost={this.state.cost} />
                  {this.state.flights[this.state.selected].flights.map((flight, i) => {
                    return (
                      <div key={i}>
                        <h4 style={{fontSize: '24px'}} key={i}>{flight.departureAirportCode} to {flight.arrivalAirportCode}</h4>
                        <div style={{display: 'inline-block', width: '40%'}}>
                          <label style={labelStyle}>
                            Departure Gate
                          </label>
                          <input style={{width: '90%'}} type='text' name='departureGate' onChange={(e) => this.handleChange(e, 'flightInstances', 'departureGate', i)} />
                          <label style={labelStyle}>
                            Arrival Gate
                          </label>
                          <input style={{width: '90%'}} type='text' name='arrivalGate' onChange={(e) => this.handleChange(e, 'flightInstances', 'arrivalGate', i)} />
                        </div>
                        <div style={{display: 'inline-block', width: '50%', verticalAlign: 'top'}}>
                          <Notes flight index={i} handleChange={(e, field, subfield, index) => this.handleChange(e, field, subfield, index)} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{width: '100%', height: '91%', margin: '2% 0 6% 0', overflowY: 'auto'}}>
                {this.state.searching && <FlightSearchResults flights={this.state.flights} searching={this.state.searching} selected={this.state.selected} handleSelectFlight={(index) => this.handleSelectFlight(index)} tripType={this.state.tripType} />}
              </div>
            </div>
            <div style={{position: 'absolute', right: '0', bottom: '0', padding: '10px'}}>
              {this.state.searching && <button style={{color: 'black'}} onClick={() => this.setState({searchClicked: this.state.searchClicked + 1})}>Search</button>}
              {this.state.searching && <button style={{color: 'black'}} onClick={() => {
                this.setState({
                  searching: false,
                  bookingDetails: true
                })
              }}>Confirm</button>}
              {this.state.bookingDetails && <button style={{color: 'black'}} onClick={() => this.setState({bookingDetails: false, searching: true})}>Back</button>}
              {this.state.bookingDetails && <button style={{color: 'black'}} onClick={() => this.handleSubmit()}>Save</button>}
            </div>
          </div>

        </div>
        {/* BOTTOM PANEL --- ATTACHMENTS */}
        <div style={attachmentsStyle}>
          <Attachments handleFileUpload={(e) => this.handleFileUpload(e)} attachments={this.state.attachments} removeUpload={i => this.removeUpload(i)} setBackground={url => this.setBackground(url)} />
        </div>
      </div>
    )
  }
}

export default graphql(createFlightBooking, {name: 'createFlightBooking'})(Radium(CreateFlightForm))
