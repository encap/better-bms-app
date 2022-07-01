# JK BMS Better App
Tested on JK-B1A24S15P hw 6.x, sw 6.1.0S, mf 2021-01-22.

## Motivation
Original app is actually not that bad, but there is room for improvement!  
It was freezing and crashing when switching to another apps (i.e Maps) when riding my bike. Password prompt was annoying when riding with gloves. Scraping data from the screen or connecting with tasker was unreliable.  
Qt 5 apk was difficult to modify since it's a compiled .so lib and you can't mess up offsets. I only managed to auto-fill password and change some colors.  
As front-end developer I relialized that with Bluetooth API in the browser, accessible documentation and other projects making my own app in React should be possible!

## Roadmap
- Proof-of-concept using Web Bluetooth API
- Implement specification
- UI
- Offline PWA
- Public Beta release
- Themes
- BMS mock (to not brick the real one during development)
- Switches and Settings
- Integrate GPS to measure wh/km(mi)
- Notifications
- Live Graph
- History


## Similar projects, references
- https://github.com/syssi/esphome-jk-bms - ESPHome component [RS485 BLE, rw] (C++, Python)
- https://github.com/PurpleAlien/jk-bms_grafana - Read data and graph in Grafana [RS485, ro] (Python)
- https://github.com/jblance/jkbms - Read data, used in jblance/mpp-solar [BLE, ro] (Python)
- https://github.com/sshoecraft/jktool - Linux utility [RS485 CAN BLE, ro] (C)
- https://github.com/maxx-ukoo/jk-bms2pylontech - Pylontech low voltage US2000 Bridge [RS485, ro] (C)
- https://github.com/ismarintan98/JK_BMS - Simple data monitor [RS485] (C++)
- https://github.com/Louisvdw/dbus-serialbattery/blob/master/etc/dbus-serialbattery/jkbms.py VenusOS drive [RS485, ro] (Python)
