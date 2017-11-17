import React, { Component } from 'react'
import { graphql } from 'react-apollo'
import { updateItineraryDetails, itinerariesByUser } from '../apollo/itinerary'

class UpdateItineraryDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {
      id: this.props.itinerary.id,
      name: this.props.itinerary.name,
      days: this.props.itinerary.days,
      startDate: this.props.itinerary.startDate,
      endDate: this.props.itinerary.endDate,
      pax: this.props.itinerary.pax,
      travelInsurance: this.props.itinerary.travelInsurance,
      budget: this.props.itinerary.budget
    }
  }
  handleChange (e, field) {
    this.setState({
      [field]: e.target.value
    })
  }
  updateItineraryDetails (e) {
    e.preventDefault()
    console.log(this.state)
    // these dates are different from those in the render. render takes props. this takes state.

    // convert to unix int only if state was changed to a string by input type 'date'. else this.state.startDate is already a unix
    if (typeof (this.state.startDate) !== 'number') {
      var startDate = new Date(this.state.startDate)
      var startUnix = startDate.getTime() / 1000
    } else {
      startUnix = this.state.startDate
    }
    if (typeof (this.state.endDate) !== 'number') {
      var endDate = new Date(this.state.endDate)
      var endUnix = endDate.getTime() / 1000
    } else {
      endUnix = this.state.endDate
    }

    this.props.updateItineraryDetails({
      variables: {
        id: this.state.id,
        name: this.state.name,
        days: this.state.days,
        startDate: startUnix,
        endDate: endUnix,
        pax: this.state.pax,
        travelInsurance: this.state.travelInsurance,
        budget: this.state.budget
      },
      refetchQueries: [{
        query: itinerariesByUser
      }]
    })
    this.props.toggleUpdateForm()
  }
  render () {
    var startDate = (new Date(this.props.itinerary.startDate * 1000).toISOString()).substring(0, 10)
    var endDate = (new Date(this.props.itinerary.endDate * 1000).toISOString()).substring(0, 10)
    return (
      <div>
        <h3>update itinerary form</h3>
        <form onSubmit={(e) => this.updateItineraryDetails(e)}>
          <label>
            Name:
            <input type='text' defaultValue={this.state.name} onChange={(e) => this.handleChange(e, 'name')} />
          </label>
          <label>
            startDate:
            <input type='date' defaultValue={startDate} onChange={(e) => this.handleChange(e, 'startDate')} />
          </label>
          <label>
            endDate:
            <input type='date' defaultValue={endDate} onChange={(e) => this.handleChange(e, 'endDate')} />
          </label>
          <label>
            pax:
            <input type='number' defaultValue={this.state.pax} onChange={(e) => this.handleChange(e, 'pax')} />
          </label>
          <label>
            travelInsurance:
            <input type='text' defaultValue={this.state.travelInsurance} onChange={(e) => this.handleChange(e, 'travelInsurance')} />
          </label>
          <label>
            budget:
            <input type='number' defaultValue={this.state.budget} onChange={(e) => this.handleChange(e, 'budget')} />
          </label>
          <button type='submit'>Submit changes</button>
        </form>
      </div>
    )
  }
}

export default graphql(updateItineraryDetails, {name: 'updateItineraryDetails'})(UpdateItineraryDetails)
