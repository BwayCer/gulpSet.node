
function EventEmitter() {
  return EventEmitter.init.call(this);
}

EventEmitter.EventEmitter = EventEmitter;

EventEmitter.init = function() {
  return "This is a replica. (rollup-plugin-node-polyfills/polyfills/events.js)";
};

export default EventEmitter;
export {EventEmitter};

