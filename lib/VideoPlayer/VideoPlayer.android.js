import React, { Component, PropTypes } from 'react';
import { noop } from 'lodash';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  requireNativeComponent,
  CameraRoll,
  UIManager,
  findNodeHandle
} from 'react-native';
import { getActualSource } from '../utils';

const ProcessingUI = UIManager.RNVideoProcessing;

export class VideoPlayer extends Component {
  static propTypes = {
    ...View.propTypes,
    play: PropTypes.bool,
    replay: PropTypes.bool,
    volume: PropTypes.number,
    onChange: PropTypes.func,
    currentTime: PropTypes.number,
    endTime: PropTypes.number,
    startTime: PropTypes.number,
    progressEventDelay: PropTypes.number,
    source: PropTypes.string.isRequired
  };
  static defaultProps = {
    onChange: noop
  };

  constructor(props) {
    super(props);
    this._receiveVideoInfo = this._receiveVideoInfo.bind(this);
    this._receivePreviewImage = this._receivePreviewImage.bind(this);
    this._receiveTrimmedSource = this._receiveTrimmedSource.bind(this);
    this._onVideoProgress = this._onVideoProgress.bind(this);
    this.trim = this.trim.bind(this);
    this.getInfoPromisesResolves = [];
    this.getPreviewForSecondResolves = [];
    this.trimResolves = [];
  }

  getVideoInfo() {
    if (!this.props.source) {
      console.warn('Video source is empty');
      return Promise.reject();
    }
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      ProcessingUI.Commands.getInfo,
      [],
    );
    return new Promise((resolve) => {
      this.getInfoPromisesResolves.push(resolve);
    });
  }

  trim(options) {
    if (typeof options === 'string') {
      console.warn('There is no need to pass source for trimming, this is deprecated and will be removed on the next version');
      return Promise.reject();
    }
    const { startTime, endTime } = options;
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      ProcessingUI.Commands.trim,
      [startTime, endTime],
    );
    return new Promise((resolve) => {
      this.trimResolves.push(resolve);
    });
  }

  compress() {
    return Promise.resolve(this.props.source);
  }

  getPreviewForSecond(forSecond = 0) {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      ProcessingUI.Commands.getPreviewForSecond,
      [forSecond],
    );
    return new Promise((resolve) => {
      this.getPreviewForSecondResolves.push(resolve);
    });
  }

  _receiveTrimmedSource(e) {
    this.trimResolves.forEach((resolve) => resolve(e.nativeEvent.source));
    this.trimResolves = [];
  }

  _receiveVideoInfo({ nativeEvent }) {
    const event = {
      size: { width: nativeEvent.width, height: nativeEvent.height },
      duration: nativeEvent.duration
    };
    this.getInfoPromisesResolves.forEach((resolve) => resolve(event));
    this.getInfoPromisesResolves = [];
  }

  _receivePreviewImage({ nativeEvent }) {
    this.getPreviewForSecondResolves.forEach((resolve) => resolve(nativeEvent));
    this.getPreviewForSecondResolves = [];
  }

  _onVideoProgress(e) {
    if (typeof this.props.onChange === 'function') {
      this.props.onChange(e);
    }
  }

  render() {
    const {
      source,
      play,
      currentTime,
      endTime,
      startTime,
      replay,
      volume,
      style,
      ...props
    } = this.props;
    const mSource = getActualSource(source);
    return (
      <RNVideoPlayer
        style={style}
        source={mSource}
        play={play}
        onVideoProgress={this._onVideoProgress}
        getVideoInfo={this._receiveVideoInfo}
        getPreviewImage={this._receivePreviewImage}
        getTrimmedSource={this._receiveTrimmedSource}
        currentTime={currentTime}
        endTime={endTime}
        startTime={startTime}
        replay={replay}
        volume={volume}
        {...props}
      />
    );
  }
}

const RNVideoPlayer = requireNativeComponent('RNVideoProcessing', VideoPlayer, {
  nativeOnly: {
    getVideoInfo: true,
    getPreviewImage: true,
    getTrimmedSource: true,
    onVideoProgress: true
  }
});