import React, { Component } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
// package css
import CustomDatePicker from './CustomDatePicker'
// custom input style

import { dateTimePickerContainerStyle } from '../Styles/styles'

import moment from 'moment'
import Radium from 'radium'

const dayStyle = {
  background: 'inherit', border: 'none', outline: 'none', fontSize: '24px', fontWeight: 300, margin: '10px 25px 10px 0px', ':hover': {boxShadow: '0 1px 0 #FFF'}
}

const timeStyle = {
  background: 'inherit', marginLeft: '20px', fontWeight: '300', fontSize: '24px', outline: 'none', border: 'none', textAlign: 'center', ':hover': {boxShadow: '0 1px 0 #FFF'}
}

class DateTimePicker extends Component {
  constructor (props) {
    super(props)
    this.state = {
      // THESE ARE FOR RENDER PURPOSES ONLY. DAY AND TIME(UNIX) STILL KEPT IN PARENT COMPONENT FOR FORM SUBMISSION
      dates: this.props.dates.map(e => {
        return moment(e).unix()
      }),
      date: (new Date(this.props.date)).toISOString().substring(0, 10),
      startDate: moment(new Date(this.props.date)),
      endDate: moment(new Date(this.props.date)),
      startTime: '', // '10:00AM'
      endTime: ''
    }
  }

  handleChange (e, field) {
    // HANDLING TIME INPUT
    if (field === 'startTime' || field === 'endTime') {
      // convert time in '10:00AM' string to Int
      // time is relative to 1970 1st jan
      this.setState({
        [field]: e.target.value
      })

      var timeStr = e.target.value
      if (field === 'startTime') {
        var hours = timeStr.split(':')[0]
        var mins = timeStr.split(':')[1]
        var unix = (hours * 60 * 60) + (mins * 60)
      }
      if (field === 'endTime') {
        if (timeStr === '00:00') {
          timeStr = '24:00'
        }
        hours = timeStr.split(':')[0]
        mins = timeStr.split(':')[1]
        unix = (hours * 60 * 60) + (mins * 60)
      }
      this.props.updateDayTime(field, unix)
    }

    // HANDLING DAY INPUT
    if (field === 'startDay' || field === 'endDay') {
      var newUnix = this.state.dates[e.target.value - 1]
      var newDate = moment.unix(newUnix)

      if (field === 'startDay') {
        this.props.updateDayTime('startDay', e.target.value)
        this.setState({startDate: newDate})
        if (e.target.value > this.props.endDay) {
          this.props.updateDayTime('endDay', e.target.value)
          this.setState({endDate: newDate})
        }
      }
      if (field === 'endDay') {
        this.props.updateDayTime('endDay', e.target.value)
        this.setState({endDate: newDate})
      }
    }

    // HANDLING DATE INPUT
    if (field === 'startDate' || field === 'endDate') {
      // set the new start/end date
      this.setState({
        [field]: moment(e._d)
      })

      var selectedUnix = moment(e._d).unix()
      var newDay = this.state.dates.indexOf(selectedUnix) + 1

      if (field === 'startDate') {
        // this.setState({startDay: newDay})
        this.props.updateDayTime('startDay', newDay)
        if (selectedUnix > this.state.endDate.unix()) {
          this.setState({endDate: moment(e._d)})
          // this.setState({endDay: newDay})
          this.props.updateDayTime('endDay', newDay)
        }
      } else if (field === 'endDate') {
        // this.setState({endDay: newDay})
        this.props.updateDayTime('endDay', newDay)
      }
    }
  }


  render () {
    return (
      <div style={dateTimePickerContainerStyle}>
        <div className='planner-date-picker'>
          <select key={'startDaySelect'} name='startDay' onChange={(e) => this.handleChange(e, 'startDay')} value={this.props.startDay} style={dayStyle}>
            {this.state.dates.map((indiv, i) => {
              return <option style={{background: '#6D6A7A'}} value={i + 1} key={i}>Day {i + 1}</option>
            })}
          </select>
          <DatePicker customInput={<CustomDatePicker />} selected={this.state.startDate} dateFormat={'ddd DD MMM YYYY'} minDate={moment.unix(this.state.dates[0])} maxDate={moment.unix(this.state.dates[this.state.dates.length - 1])} onSelect={(e) => this.handleChange(e, 'startDate')} />
          <input key='startTime' style={timeStyle} type='time' name='startTime' value={this.state.startTime} onChange={(e) => this.handleChange(e, 'startTime')} />
        </div>
        <div className='planner-time-picker' style={{margin: '10px 0'}}>
          <span style={{padding: '0 10px'}}>to</span>
        </div>
        <div className='planner-date-picker'>
          <select key={'endDaySelect'} name='endDay' onChange={(e) => this.handleChange(e, 'endDay')} value={this.props.endDay} style={dayStyle}>
            {this.state.dates.map((indiv, i) => {
              if (i + 1 >= this.props.startDay) {
                return <option style={{background: '#6D6A7A'}} value={i + 1} key={i}>Day {i + 1}</option>
              }
            })}
          </select>
          <DatePicker customInput={<CustomDatePicker />} selected={this.state.endDate} dateFormat={'ddd DD MMM YYYY'} minDate={this.state.startDate} maxDate={moment.unix(this.state.dates[this.state.dates.length - 1])} onSelect={(e) => this.handleChange(e, 'endDate')} />
          <input key='endTime' style={timeStyle} type='time' name='endTime' value={this.state.endTime} onChange={(e) => this.handleChange(e, 'endTime')} />
        </div>
      </div>
    )
  }
}

export default Radium(DateTimePicker)
