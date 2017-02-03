import { Service, serviceManager } from 'soundworks/client';

const SERVICE_ID = 'service:group-filter';

// mock implementation - should use compass
/**
 * @todo - rename to `GroupFilter`
 *
 * Track the current group in which the player is (whatever it means...)
 * group can be: `'blue', 'pink', 'red', 'yellow'`
 */
class GroupFilter extends Service {
  constructor() {
    super(SERVICE_ID, false);

    this._group = null;
    this._listeners = new Set();
    this._zones = [];
    this._zoneGroupMap = new Map();
    this._emulateMotionTimeout = null;

    const defaults = {
      directions: {},
    };

    this.configure(defaults);

    this._onOrientation = this._onOrientation.bind(this);
    this._emulateMotion = this._emulateMotion.bind(this);
  }

  init() {
    // define zones in degrees for each instruments
    const directions = this.options.directions;

    for (let group in directions) {
      const angle = directions[group];
      let startAngle = angle - 45;
      let endAngle = angle + 45;

      if (startAngle < 0)
        startAngle = 360 + startAngle;

      if (endAngle > 360)
        endAngle = endAngle - 360;

      const zone = [startAngle, endAngle];

      this._zones.push(zone);
      this._zoneGroupMap.set(zone, group);
    }
  }

  start() {
    if (!this.hasStarted)
      this.init();

    this.ready();
  }

  stop() {}

  startListening() {
    this.stopListening();

    if (window.DeviceOrientationEvent)
      window.addEventListener('deviceorientation', this._onOrientation, false);
    else
      this._emulateMotionTimeout = setTimeout(this._emulateMotion, 100);
  }

  stopListening() {
    if (window.DeviceOrientationEvent)
      window.removeEventListener('deviceorientation', this._onOrientation, false);
    else
      clearTimeout(this._emulateMotionTimeout);
  }

  _emulateMotion() {
    const colors = Object.keys(this.options.directions);
    const index = Math.floor(Math.random() * colors.length);
    this._group = colors[index];

    this._propagate('compass', 0);
    this._propagate('group', this._group);

    const delay = Math.random() * 6 + 4;
    this._emulateMotionTimeout = setTimeout(this._emulateMotion, delay * 1000);
  }

  _onOrientation(data) {
    const compass = data.alpha; // degress
    const group = this._group;

    for (let i = 0; i < this._zones.length; i++) {
      const zone = this._zones[i];
      const start = zone[0];
      const end = zone[1];

      if (start < end && compass >= start && compass < end) {
        this._group = this._zoneGroupMap.get(zone);
        break;
      }

      if (start > end && (compass >= start || compass < end)) {
        this._group = this._zoneGroupMap.get(zone);
        break;
      }
    }

    this._propagate('compass', compass);

    if (group !== this._group)
      this._propagate('group', this._group);
  }

  _propagate(channel, ...args) {
    this._listeners.forEach(callback => callback(channel, ...args));
  }

  addListener(callback) {
    this._listeners.add(callback);
  }

  removeListener(callback) {
    this._listeners.delete(callback);
  }

  /**
   * Return the current state among `'blue', 'pink', 'red', 'yellow'`.
   */
  getState() {
    return this._group;
  }

  /**
   * Test a state against the current one.
   */
  test(value) {
    return (value === this._group);
  }
}

serviceManager.register(SERVICE_ID, GroupFilter);

export default GroupFilter;
