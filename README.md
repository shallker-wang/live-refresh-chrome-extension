live-refresh-chrome-extension
==========

LiveRefresh Chrome extension.


## Installation
[Install from Chrome web store](https://chrome.google.com/webstore/detail/liverefresh/anjedjjhoempagnghcgbeembkdniplnn)

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
