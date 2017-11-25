import React, { Component } from 'react';

import createEventHandlers from './create-event-handlers';
import getCurriedOnLoad from './helpers/get-curried-on-load';
import getPlayerOpts from './helpers/get-player-opts';
import initialize from './helpers/initialize';
import installPlayerScript from './helpers/install-player-script';
import removeJWPlayerInstance from './helpers/remove-jw-player-instance';

import defaultProps from './default-props';
import propTypes from './prop-types';

const displayName = 'ReactJWPlayer';

class ReactJWPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adHasPlayed: false,
      hasPlayed: false,
      hasFired: {},
    };
    this.eventHandlers = createEventHandlers(this);
    this.uniqueScriptId = 'jw-player-script';

    if (props.useMultiplePlayers) {
      this.uniqueScriptId += `-${props.playerId}`;
    }

    this._initialize = this._initialize.bind(this);
  }
  componentDidMount() {
    const isJWPlayerScriptLoaded = !!window.jwplayer;
    const existingScript = document.getElementById(this.uniqueScriptId);
    const isUsingMultiplePlayers = this.props.useMultiplePlayers;

    if (!isUsingMultiplePlayers && isJWPlayerScriptLoaded) {
      this._initialize();
      return;
    }

    if (isUsingMultiplePlayers && existingScript) {
      this._initialize();
      return;
    }

    if (!existingScript) {
      installPlayerScript({
        context: document,
        onLoadCallback: this._initialize,
        scriptSrc: this.props.playerScript,
        uniqueScriptId: this.uniqueScriptId,
      });
    } else {
      existingScript.onload = getCurriedOnLoad(existingScript, this._initialize);
    }
  }
  shouldComponentUpdate(nextProps) {
    const hasFileChanged = this.props.file !== nextProps.file;
    const hasPlaylistChanged = this.props.playlist !== nextProps.playlist;

    return hasFileChanged || hasPlaylistChanged;
  }
  componentDidUpdate() {
    if (window.jwplayer && window.jwplayer(this.props.playerId)) {
      this._initialize();
    }
  }
  componentWillUnmount() {
    removeJWPlayerInstance(this.props.playerId, window);
  }
  _initialize() {
    const { playerId, useMultiplePlayers } = this.props;

    if (useMultiplePlayers) {
      const playerConfigs = window.__JW_PLAYER_CONFIGS__ = (window.__JW_PLAYER_CONFIGS__ || {});
      const existingConfig = playerConfigs[playerId];

      if (existingConfig) {
        window.jwplayer.defaults = existingConfig;
      } else {
        playerConfigs[playerId] = window.jwplayer.defaults;
      }
    }

    const component = this;
    const player = window.jwplayer(this.props.playerId);
    const playerOpts = getPlayerOpts(this.props);

    initialize({ component, player, playerOpts });
  }
  render() {
    return (
      <div
        className={this.props.className}
        dangerouslySetInnerHTML={{ // eslint-disable-line react/no-danger
          __html: `<div id="${this.props.playerId}"></div>`,
        }}
      />
    );
  }
}

ReactJWPlayer.defaultProps = defaultProps;
ReactJWPlayer.displayName = displayName;
ReactJWPlayer.propTypes = propTypes;
export default ReactJWPlayer;
