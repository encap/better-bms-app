# [JK BMS Better App](https://encap.github.io/better-bms-app/)
## Add it to homescreen for best experience!

Tested on JK-B1A24S15P hw 6.x, sw 6.1.0S, mf 2021-01-22.


# Installation and usage
1. Make sure you have `Node >=16` installed and `yarn` package manager.  
2. Install dependecies 
    ```sh
    yarn install
    ```
3. Fire up dev server
    ```sh
    yarn start
    ```
4. Make sure to turn on bluetooth, allow permissions and enable this browser flags: 
    - [Experimental web platform features](chrome://flags/#enable-experimental-web-platform-features)
    - [Web Bluetooth API](chrome://flags/#enable-web-bluetooth)
    - [Bluetooth new permissions backend](chrome://flags/#enable-web-bluetooth-new-permissions-backend)
## Motivation
Original app is actually not that bad, but there is room for improvement!  
It was freezing and crashing when switching to another apps (i.e Maps) when riding my bike. Password prompt was annoying when riding with gloves. Scraping data from the screen or connecting with tasker was unreliable.  
Qt 5 apk was difficult to modify since it's a compiled .so lib and you can't mess up offsets. I only managed to auto-fill password and change some colors.  
As front-end developer I relialized that with Bluetooth API in the browser, "accessible documentation" and other projects making my own app in React should be possible!

## Roadmap
- :white_check_mark: Proof-of-concept using Web Bluetooth API
- :white_check_mark: Implement specification
- :hammer_and_wrench: UI
- Offline PWA
- Public Beta release
- Themes
- :wastebasket: BMS mock (to not brick the real one during development)
- Switches and Settings
- Integrate GPS to measure wh/km(mi)
- Notifications
- :white_check_mark: Live Chart
- History


## Similar projects, references
- https://github.com/syssi/esphome-jk-bms - ESPHome component [RS485 BLE, rw] (C++, Python)
- https://github.com/PurpleAlien/jk-bms_grafana - Read data and graph in Grafana [RS485, ro] (Python)
- https://github.com/jblance/jkbms - Read data, used in jblance/mpp-solar [BLE, ro] (Python)
- https://github.com/sshoecraft/jktool - Linux utility [RS485 CAN BLE, ro] (C)
- https://github.com/maxx-ukoo/jk-bms2pylontech - Pylontech low voltage US2000 Bridge [RS485, ro] (C)
- https://github.com/ismarintan98/JK_BMS - Simple data monitor [RS485] (C++)
- https://github.com/Louisvdw/dbus-serialbattery/blob/master/etc/dbus-serialbattery/jkbms.py VenusOS drive [RS485, ro] (Python)
