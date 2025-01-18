# HTML Info Wallpaper

Displays system information and resource utilization. Code and CSS can be customised.

Uses Python as a server to provide the webpage with info with `psutil`.

`flask` and `flask-socketio` is used for websocket communication (sorry)

You will have to download `socket.io.min.js` from [https://cdn.socket.io/4.8.1/socket.io.min.js](https://cdn.socket.io/4.8.1/socket.io.min.js)

Also needed for socket.io: install `eventlet` or `gevent`

You will need to find a way to set a webpage as a desktop wallpaper. Set `localhost:5000` as your wallpaper URL.

The background image displayed is to be named `desktop.png` and placed in the project folder.

Required Python packages: `flask`, `flask-socketio`, `psutil`, `eventlet` or `gevent`

To start server: `python3 server.py`

Webpage is at `localhost:5000` (port can be changed)

Preview:![Screenshot_20250118_144507](https://github.com/user-attachments/assets/31202baa-2d76-4c06-bbbb-85cc63529abc)

Supported Operating Systems: Linux, Windows (Untested)
May or may not work on MacOS
