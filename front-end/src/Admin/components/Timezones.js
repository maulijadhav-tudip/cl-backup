import React, { Component } from "react";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import moment from "moment";
import "moment-timezone";

class Timezones extends Component {
  static propTypes = {
    changeTimezone: PropTypes.func.isRequired,
    currentTimezone: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadTimezones = this.loadTimezones.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      timezone: "",
      selected: 0,
      timezones: []
    };
  }
  //This function loads the dates of the data sets
  loadTimezones() {
    let timezones = moment.tz.names();
    let index = timezones.indexOf(this.props.currentTimezone);
    this.setState({
      timezones: timezones,
      timezone: timezones[index],
      selected: index
    });
    this.props.changeTimezone(timezones[index]);
  }

  componentDidMount() {
    this.loadTimezones();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeTimezone(this.state.timezones[e.value]);
    this.setState({
      timezone: this.state.timezones[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.timezones.length; j++) {
      options.push({
        value: j,
        label:
          this.state.timezones[j] +
          " " +
          moment.tz(this.state.timezones[j]).format("Z z")
      });
    }

    return (
      <div>
        <Select
          className="is-fullwidth"
          value={this.state.selected}
          options={options}
          onChange={e => this.handleChange(e)}
        />
      </div>
    );
  }
}

export default Timezones;
