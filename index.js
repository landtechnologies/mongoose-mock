'use strict';

var sinon = require('sinon'),
    events = require('events'),
    Module = require('module');

var mongoose = {};
module.exports = mongoose;

// do something a bit like proxyquire, but this ensures there is only ever
// one instance of mongoose, which is good for npm link.
var originalLoad = Module._load;
Module._load = function (path, module){
  return (path==="mongoose") ? mongoose : originalLoad(path, module);
};
    

// Mongoose-mock emits events
// when Models or Documents are created.
// This allows for the mock injector to get notifications
// about use of the mock and get a chance to access
// the mocked models and document produced.
events.EventEmitter.call(mongoose);
mongoose.__proto__ = events.EventEmitter.prototype; // jshint ignore:line

function stubWithNoThrowYeilds(sandbox){
  // sinon.yeilds throws an error if no callback, but we dont want that...
  var callbackArguments = [];
  var returns = null;
  var stub = sandbox.spy(function(){
    for(var i=0; i< arguments.length; i++)if (typeof arguments[i] === "function") {
      return arguments[i].apply(null, callbackArguments);
    }
    return returns;
  });
  stub.yields = function(){
    callbackArguments = Array.prototype.slice.call(arguments, 0);
  }
  stub.returns = r => returns = r;
  return stub;
}

// ## Schema
var Schema = function () {

  function Model(properties) {
    var self = this;

    if (properties) {
      Object.keys(properties).forEach(function (key) {
        self[key] = properties[key];
      });
    }

    this.save = stubWithNoThrowYeilds(Model._sandbox);
    this.increment = stubWithNoThrowYeilds(Model._sandbox);
    this.remove = stubWithNoThrowYeilds(Model._sandbox);
    this.save.returns(Promise.resolve(this));
    this.increment.returns(Promise.resolve(this));
    this.remove.returns(Promise.resolve(this));
    
    this.toObject = () => {
      var ret = Object.assign({}, this);
      delete ret.save;
      delete ret.increment;
      delete ret.remove;
      delete ret.toObject;
      return ret;
    } 

    mongoose.emit('document', this);
  }

  Model.statics = {};
  Model.methods = {};
  Model.options = {};

  Model.useSandbox = function(sb){
    Model._sandbox = sb;
    Model.static = Model._sandbox.stub();
    Model.method = Model._sandbox.stub();
    Model.pre = Model._sandbox.stub();
    Model.path = Model._sandbox.stub();
    Model.post = Model._sandbox.stub();
    Model.add = Model._sandbox.stub();
    Model.plugin = Model._sandbox.spy(()=>null);
    Model.path.returns({
      validate: Model._sandbox.stub(),
    });

    Model.virtual = function () {
      function SetterGetter() {

        var _set = Model._sandbox.stub();
        var _get = Model._sandbox.stub();
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
      'exec',
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
      'limit',
      'lean',
      'mapReduce',
      'populate',
      'remove',
      'select',
      'set',
      'sort',
      'update',
      'where',
    ].forEach(function (fn) {
      var stub = stubWithNoThrowYeilds(Model._sandbox);
      stub.yields(null, null)
      stub.returns(Model);
      Model[fn] = stub;
    });

    Model.update.yields(null, {n: 1});
  }

  Model.useSandbox(sinon);
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
mongoose.getModelsList = function() {return Object.keys(models_)};
mongoose.set = sinon.stub();
mongoose.connect = sinon.stub();
mongoose.connection = {
    once: sinon.spy(),
    on: sinon.spy(),
    useDb: (name) => mongoose
};

