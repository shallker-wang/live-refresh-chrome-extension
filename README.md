live-refresh-chrome-extension
==========

LiveRefresh Chrome extension.


## Installation
1. Save link [Chrome Extension](https://github.com/shallker-wang/live-refresh-chrome-extension/raw/build/live-refresh-chrome-extension.crx) as file to your computer.
2. Drag saved file live-refresh-chrome-extension.crx to Chrome extensions page chrome://extensions/
3. Done.


## Write a server
1. Create a WebSocket server listening on port 35730.
2. Receive a first handshake message from this extension:

  ```json
    {
      "type": "handshake",
      "protocol": "LR",
      "version": "1.0"
    }
  ```

3. Respond with a handshake message, state server status:

  ```json
  {
    "type": "handshake",
    "protocol": "LR",
    "version": "1.0"
  }
  ```

4. Send a message after a file is changed:

  ```json
  {
    "type": "status",
    "status": "change",
    "file": "index.css"
  }
  ```


## Todo
- write test
