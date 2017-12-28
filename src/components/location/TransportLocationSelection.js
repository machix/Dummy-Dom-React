import React, { Component } from 'react'
import LocationSearch from './LocationSearch'
import TransportMapHOC from './TransportMapHOC'

import { locationMapContainerStyle } from '../../Styles/styles'

// ENTIRE LOCATION COMPONENT (DEPARTURE + ARRIVAL + ADDRESS + SHARED MAP)

class TransportLocationSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mapIsOpen: false,
      mapLocationType: null
    }
  }

  selectLocation (location, type) {
    if (location.openingHours) {
      location.openingHours = JSON.stringify(location.openingHours)
    }

    this.props.selectLocation(location, type)

    this.setState({mapIsOpen: false})
    this.setState({mapLocationType: null})
  }

  toggleMap (type) {
    this.setState({mapIsOpen: !this.state.mapIsOpen})
    if (type) {
      this.setState({mapLocationType: type})
    } else {
      this.setState({mapLocationType: null})
    }
  }

  render () {
    return (
      <div>
        <LocationSearch selectLocation={location => this.selectLocation(location, 'departure')} toggleMap={() => this.toggleMap('departure')} placeholder={'Departure Location'} currentLocation={this.props.departureLocation} />
        {/* DEPARTURE PLACEHOLDER OVERFLOW NOT SEEN */}
        <p style={{textAlign: 'center'}}>to</p>
        <LocationSearch selectLocation={location => this.selectLocation(location, 'arrival')} toggleMap={() => this.toggleMap('arrival')} placeholder={'Arrival Location'} currentLocation={this.props.arrivalLocation} />

        {this.state.mapIsOpen &&
        <div style={locationMapContainerStyle}>
          <TransportMapHOC toggleMap={() => this.toggleMap()} selectLocation={(obj) => this.selectLocation(obj, this.state.mapLocationType)} departureLocation={this.props.departureLocation} arrivalLocation={this.props.arrivalLocation} mapLocationType={this.state.mapLocationType} />
        </div>
        }
      </div>
    )
  }
}

export default TransportLocationSelection