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

    const defaults = {
      directions: {},
    };

    this.configure(defaults);

    this.motionInput = this.require('motion-input', {
      descriptors: ['orientation'],
    });

    this._onOrientation = this._onOrientation.bind(this);
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

    if (this.motionInput.isAvailable('orientation'))
      this.motionInput.addListener('orientation', this._onOrientation);
    else
      console.warn('@todo: no orientation');

    this.ready();
  }

  stop() {}

  _onOrientation(data) {
    const compass = data[0]; // degress
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
