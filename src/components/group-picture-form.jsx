import React from 'react';

import throbber16 from '../../assets/images/throbber-16.gif';
import { preventDefault } from '../utils';

export default class GroupPictureForm extends React.Component {
  savePicture = () => {
    const [newFile] = this.refs.pictureFile.files;
    if (newFile && this.props.status !== 'loading') {
      this.props.updateGroupPicture(this.props.group.username, newFile);
    }
  };

  componentWillUnmount() {
    this.props.resetGroupUpdateForm();
  }

  render() {
    return (
      <form onSubmit={preventDefault(this.savePicture)}>
        <h3>Profile picture</h3>

        <div className="form-group avatar">
          <img src={this.props.group.profilePictureLargeUrl} width="75" height="75"/>
        </div>

        <div className="form-group">
          <input type="file" ref="pictureFile"/>
        </div>

        <div className="form-group">
          <button className="btn btn-default" type="submit">Update</button>

          {this.props.status === 'loading' ? (
            <span className="settings-throbber">
              <img width="16" height="16" src={throbber16}/>
            </span>
          ) : false}
        </div>

        {this.props.status === 'success' ? (
          <div className="alert alert-info" role="alert">Profile picture has been updated</div>
        ) : this.props.status === 'error' ? (
          <div className="alert alert-danger" role="alert">{this.props.errorMessage}</div>
        ) : false}
      </form>
    );
  }
}
