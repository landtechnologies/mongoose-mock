'use strict';

var sinon = require('sinon');
var events = require('events');

var mongoose = {};
module.exports = mongoose;

// Mongoose-mock emits events
// when Models or Documents are created.
// This allows for the mock injector to get notifications
// about use of the mock and get a chance to access
// the mocked models and document produced.
events.EventEmitter.call(mongoose);
mongoose.__proto__ = events.EventEmitter.prototype; // jshint ignore:line

// ## Schema
var Schema = function () {

  function Model(properties) {

    var self = this;

    if (properties) {
      Object.keys(properties).forEach(function (key) {
        self[key] = properties[key];
      });
    }

    this.save = sinon.stub();
    this.increment = sinon.stub();
    this.remove = sinon.stub();

    mongoose.emit('document', this);
  }

  Model.statics = {};
  Model.methods = {};
  Model.static = sinon.stub();
  Model.method = sinon.stub();
  Model.pre = sinon.stub();
  Model.path = sinon.stub();
  Model.post = sinon.stub();
  Model.exec = sinon.stub();

  Model.path.returns({
    validate: sinon.stub(),
  });

  Model.virtual = function () {

    function SetterGetter() {

      var _set = sinon.stub();
      var _get = sinon.stub();
      var _ret = { set: _set, get: _set };

      _set.returns(_ret);
      _get.returns(_ret);

      return _ret;
    }

    return new SetterGetter();
  };

  [
    'aggregate',
    'allowDiskUse',
    'count',
    'create',
    'distinct',
    'ensureIndexes',
    'find',
    'findById',
    'findByIdAndRemove',
    'findByIdAndUpdate',
    'findOne',
    'findOneAndRemove',
    'findOneAndUpdate',
    'geoNear',
    'geoSearch',
    'index',
    'mapReduce',
    'plugin',
    'populate',
    'remove',
    'select',
    'set',
    'update',
    'where'
  ].forEach(function (fn) {

    var stub = sinon.stub();
    stub.returns(Model);

    Model[fn] = stub;
  });

  mongoose.emit('model', Model);

  return Model;
};

// compiled models are stored in models_
// and may be retrieved by name.
var models_ = {};
function createModelFromSchema(name, Type) {

  if (!Type) {
    return models_[name];
  }

  if (Type.statics) {
    Object.keys(Type.statics).forEach(function (key) {
      Type[key] = Type.statics[key];
    });
  }

  if (Type.methods) {
    Object.keys(Type.methods).forEach(function (key) {
      Type.prototype[key] = Type.methods[key];
    });
  }

  models_[name] = Type;

  return models_[name];
}

mongoose.Schema = Schema;
mongoose.Schema.Types = { ObjectId: '' };  // Defining mongoose types as dummies.
mongoose.Types = mongoose.Schema.Types;
mongoose.model = createModelFromSchema;
mongoose.set = sinon.stub();
mongoose.connect = sinon.stub();
mongoose.connection = {
    once: sinon.spy(),
    on: sinon.spy()
};
