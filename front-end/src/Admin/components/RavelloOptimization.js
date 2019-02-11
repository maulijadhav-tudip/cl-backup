import React, { Component } from "react";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";

class RavelloOptimization extends Component {
  static propTypes = {
    changeLevel: PropTypes.func.isRequired,
    optimizationLevel: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadLevels = this.loadLevels.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      optimizationLevel: "",
      selected: 0,
      optimizationLevels: []
    };
  }
  //This function loads the dates of the data sets
  loadLevels() {
    let levels = ["COST_OPTIMIZED", "PERFORMANCE_OPTIMIZED"];
    let index = levels.indexOf(this.props.optimizationLevel);
    if (index === -1) index = 0;
    this.setState({
      optimizationLevels: levels,
      optimizationLevel: levels[index],
      selected: index
    });
    this.props.changeLevel(levels[index]);
  }

  componentDidMount() {
    this.loadLevels();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeLevel(this.state.optimizationLevels[e.value]);

    this.setState({
      level: this.state.optimizationLevels[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.optimizationLevels.length; j++) {
      options.push({
        value: j,
        label: this.state.optimizationLevels[j]
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

export default RavelloOptimization;
