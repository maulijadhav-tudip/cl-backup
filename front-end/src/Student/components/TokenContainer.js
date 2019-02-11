import React, { Component } from "react";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

const yesterday = Datetime.moment().subtract(23, "hour");
class TokenContainer extends Component {
  valid = currentDate => currentDate.isAfter(yesterday);
  render() {
    return (
      <section>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Tag</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input
                  className="input"
                  name="tag"
                  type="text"
                  ref="tag"
                  placeholder="Token Tag"
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Number</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input
                  className="input"
                  name="number"
                  type="number"
                  ref="number"
                  placeholder="Number of Tokens"
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Expiration</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <Datetime
                  closeOnSelect
                  ref="expiration"
                  inputProps={{
                    readOnly: true,
                    placeholder: "mm/dd/yyyy"
                  }}
                  timeFormat={false}
                  isValidDate={this.valid}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default TokenContainer;
