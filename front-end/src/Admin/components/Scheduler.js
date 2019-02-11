import React, { Component } from "react";
import Timezones from "./Timezones";
import moment from "moment-timezone";
import PropTypes from "prop-types";
import momentPropTypes from "react-moment-proptypes";
import Flatpickr from "react-flatpickr";

class Scheduler extends Component {
  static propTypes = {
    changeDate: PropTypes.func.isRequired,
    timezone: PropTypes.string.isRequired,
    time: momentPropTypes.momentObj.isRequired
  };
  constructor(props) {
    super(props);
    this.state = {
      selectedTime: moment
        .tz(this.props.time, this.props.timezone)
        .clone()
        .tz(moment.tz.guess(), true),
      timezone: this.props.timezone
    };
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(date, timezone) {
    this.setState({
      selectedTime: moment.tz(date, moment.tz.guess()),
      timezone: timezone
    });
    this.props.changeDate(
      moment
        .tz(date, moment.tz.guess())
        .clone()
        .tz(timezone, true)
        .utc(),
      timezone
    );
  }
  render() {
    return (
      <div>
        <Flatpickr
          value={this.state.selectedTime.toISOString()}
          onChange={x => this.handleChange(moment(x[0]), this.state.timezone)}
          options={{ enableTime: true }}
          className="input"
        />

        <Timezones
          currentTimezone={this.state.timezone}
          changeTimezone={x => this.handleChange(this.state.selectedTime, x)}
        />
      </div>
    );
  }
}

export default Scheduler;
