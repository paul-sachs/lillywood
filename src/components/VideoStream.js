//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React, { PropTypes } from 'react';
import { render } from 'react-dom';


export default class VideoStream extends React.Component {

  static props = {
    stream:    PropTypes.object.isRequired
  };


  render() {
    return (
      <div className="video-container" style={{border: '2px dotted blue'}}>
        <video src={URL.createObjectURL(this.props.stream)} autoPlay></video>
      </div>
    );
  }
}
