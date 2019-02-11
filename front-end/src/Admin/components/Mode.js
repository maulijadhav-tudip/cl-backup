import React, { Component } from "react";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";

class Mode extends Component {
  static propTypes = {
    changeMode: PropTypes.func.isRequired,
    mode: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadModes = this.loadModes.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      mode: "",
      selected: 0,
      modes: []
    };
  }
  //This function loads the dates of the data sets
  loadModes() {
    let modes = ["class", "request"];
    let index = modes.indexOf(this.props.mode);
    if (index === -1) index = 0;
    this.setState({
      modes: modes,
      mode: modes[index],
      selected: index
    });
    this.props.changeMode(modes[index]);
  }

  componentDidMount() {
    this.loadModes();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeMode(this.state.modes[e.value]);

    this.setState({
      mode: this.state.modes[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.modes.length; j++) {
      options.push({
        value: j,
        label: this.state.modes[j]
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

export default Mode;
