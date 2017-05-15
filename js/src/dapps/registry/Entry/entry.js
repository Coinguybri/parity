// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import { observer } from 'mobx-react';
import React, { Component, PropTypes } from 'react';
import { Card, CardText } from 'material-ui/Card';
import CircularProgress from 'material-ui/CircularProgress';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import DeleteIcon from 'material-ui/svg-icons/action/delete';

import ApplicationStore from '../Application/application.store';
import LookupStore from '../Lookup/lookup.store';
import PromptStore from '../Prompt/prompt.store';

import Address from '../ui/address';
import Image from '../ui/image';

import styles from './entry.css';

@observer
export default class Entry extends Component {
  static propTypes = {
    entry: PropTypes.object.isRequired
  };

  applicationStore = ApplicationStore.get();
  lookupStore = LookupStore.get();
  promptStore = PromptStore.get();

  render () {
    const { entry } = this.props;
    const { owner, address, image, isOwner, content, reversed, reversing } = entry;

    return (
      <Card className={ styles.container }>
        <CardText className={ styles.infoContainer }>
          <Info
            label='Owner'
            isOwner={ isOwner }
            onUpdateMetadata={ this.handleModifyOwner }
            onRefresh={ this.handleRefresh }
          >
            <div>
              <Address
                address={ owner }
                big
                shortenHash={ false }
              />
              {
                reversed
                ? (
                  <div className={ styles.reversed }>
                    Reversed
                  </div>
                )
                : isOwner && (
                  <RaisedButton
                    className={ styles.reverseButton }
                    disabled={ reversing }
                    label='Reverse'
                    icon={ this.renderLoadingIcon(reversing) }
                    onClick={ this.handleReverse }
                    primary
                  />
                )
              }
            </div>
          </Info>

          <Info
            label='Address'
            isOwner={ isOwner }
            onUpdateMetadata={ this.handleModifyAddress }
            onRefresh={ this.handleRefresh }
          >
            <Address
              address={ address }
              big
              shortenHash={ false }
            />
          </Info>

          <Info
            label='Content'
            isOwner={ isOwner }
            onUpdateMetadata={ this.handleModifyContent }
            onRefresh={ this.handleRefresh }
          >
            <code>{ content }</code>
          </Info>

          <Info
            label='Image'
            isOwner={ isOwner }
            onUpdateMetadata={ this.handleModifyImage }
            onRefresh={ this.handleRefresh }
          >
            <Image address={ image } />
          </Info>
        </CardText>
        { this.renderActions(isOwner) }
      </Card>
    );
  }

  renderActions (isOwner) {
    if (!isOwner) {
      return null;
    }

    const { dropping } = this.props.entry;

    return (
      <div className={ styles.actions }>
        <FloatingActionButton
          disabled={ dropping }
          mini
          onTouchTap={ this.handleDrop }
          secondary
          title='Drop'
        >
          <DeleteIcon />
        </FloatingActionButton>
      </div>
    );
  }

  renderLoadingIcon (loading) {
    if (!loading) {
      return null;
    }

    return (
      <CircularProgress
        size={ 25 }
        style={ { transform: 'scale(0.5)', marginLeft: '-15px' } }
        thickness={ 2 }
      />
    );
  }

  handleDrop = () => {
    const { entry } = this.props;

    return this.promptStore
      .ask({
        title: (
          <span>
            Do you want to drop <code>{ entry.name }</code>
          </span>
        )
      })
      .then(() => {
        return entry.drop();
      })
      .then(() => {
        this.handleRefresh();
      });
  };

  handleReverse = () => {
    const { entry } = this.props;

    return entry.checkOwnerReverse()
      .then((reverse) => {
        if (!reverse) {
          return;
        }

        return this.promptStore
          .ask({
            title: (
              <span>
                <code>{ entry.owner }</code> is
                already reversed from <code>{ reverse }</code>.
                Override this reverse?
              </span>
            )
          });
      })
      .then(() => {
        return entry.reverse();
      })
      .then(() => {
        this.handleRefresh();
      });
  };

  handleRefresh = () => {
    this.lookupStore.refresh();
  };

  handleModifyOwner = () => {
    const { entry } = this.props;
    const { owner } = entry;

    return this.promptStore
      .ask({
        defaultValue: owner,
        placeholder: 'Entry owner',
        showInput: true,
        title: 'Enter the new owner of this entry'
      })
      .then((value) => {
        return entry.modifyOwner(value);
      });
  };

  handleModifyAddress = () => {
    const { entry } = this.props;
    const { address } = entry;

    return this.promptStore
      .ask({
        defaultValue: address,
        placeholder: 'Address',
        showInput: true,
        title: 'Enter the new address'
      })
      .then((value) => {
        return entry.modifyMetadata('A', value);
      });
  };

  handleModifyContent = () => {
    const { entry } = this.props;
    const { content } = entry;

    return this.promptStore
      .ask({
        defaultValue: content,
        placeholder: 'Content hash',
        showInput: true,
        title: 'Enter the new content hash'
      })
      .then((value) => {
        return entry.modifyMetadata('CONTENT', value);
      });
  };

  handleModifyImage = () => {
    const { entry } = this.props;
    const { image } = entry;

    return this.promptStore
      .ask({
        defaultValue: image,
        placeholder: 'Image hash',
        showInput: true,
        title: 'Enter the new image hash'
      })
      .then((value) => {
        return entry.modifyMetadata('IMG', value);
      });
  };
}

class Info extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onUpdateMetadata: PropTypes.func.isRequired,
    isOwner: PropTypes.bool
  };

  static defaultProps = {
    isOwner: false
  };

  state = {
    loading: false
  };

  render () {
    const { loading } = this.state;
    const { children, isOwner, label } = this.props;

    const title = isOwner
      ? (
        <a
          className={ styles.title }
          href=''
          onClick={ this.handleUpdateMetadata }
        >
          { label }
        </a>
      )
      : (
        <span className={ styles.title }>
          { label }
        </span>
      );

    return (
      <div className={ styles.info }>
        { title }
        {
          loading
          ? this.renderLoading()
          : children
        }
      </div>
    );
  }

  renderLoading () {
    return (
      <CircularProgress size={ 30 } />
    );
  }

  handleUpdateMetadata = (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ loading: true });
    this.props.onUpdateMetadata()
      .catch((error) => {
        console.error('updating metadata', error);
      })
      .then(() => {
        this.setState({ loading: false });
        this.props.onRefresh();
      });
  };
}