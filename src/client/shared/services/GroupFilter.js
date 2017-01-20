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

    this._color = null;
    this._listeners = new Set();
    this._zones = [];
    this._zoneColorMap = new Map();

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

    for (let color in directions) {
      const angle = directions[color];
      let startAngle = angle - 45;
      let endAngle = angle + 45;

      if (startAngle < 0)
        startAngle = 360 + startAngle;

      if (endAngle > 360)
        endAngle = endAngle - 360;

      const zone = [startAngle, endAngle];

      this._zones.push(zone);
      this._zoneColorMap.set(zone, color);
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

    for (let i = 0; i < this._zones.length; i++) {
      const zone = this._zones[i];
      const start = zone[0];
      const end = zone[1];

      if (start < end && compass >= start && compass < end) {
        this._color = this._zoneColorMap.get(zone);
        break;
      }

      if (start > end && (compass >= start || compass < end)) {
        this._color = this._zoneColorMap.get(zone);
        break;
      }
    }

    this._propagate(compass, this._color);
  }

  _propagate(compassValue, color) {
    this._listeners.forEach(callback => callback(compassValue, color));
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
    return this._color;
  }

  /**
   * Test a state against the current one.
   */
  test(value) {
    return (value === this._color);
  }
}

serviceManager.register(SERVICE_ID, GroupFilter);

export default GroupFilter;
