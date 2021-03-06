/**
 * Class for handling profile tracks
 *
 * @param {String} trackid
 * @param {Number} width
 * @param {Number} height
 * @param {Object} metadata
 */
var TrackOrientedProfile = function(trackid, width, height, metadata) {
  var self = this;
  TrackProfile.call(this, trackid, width, height, metadata);
  self.zeroline = null;
};

TrackOrientedProfile.prototype = new TrackProfile;

/**
 * Display the track
 * Calls the parent's method and add a line at y=0
 */
TrackOrientedProfile.prototype.display = function(seqid, start, end) {
  TrackProfile.prototype.display.call(this, seqid, start, end);
  this.resize(this.canvas.width, 140);
  this.zeroline = this.canvas.path('M50,'+(this.canvas.height/2+5.5)+'l'+(this.width-100)+',0');
  this.zeroline.toBack();
}

/**
 * Request data of the track between 2 positions of a seqid.
 * The callback is triggered with the collected data
 *
 * @param {string} seqid
 * @param {Number} start
 * @param {Number} end
 * @param {Function} callback
 * @api private
 */
TrackOrientedProfile.prototype.getData = function(seqid, strand, start, end, callback, force) {
  force = force || false;
  var self = this;
  var reqURL = '/'+ window.location.href.split('/').slice(3, 5).join('/');
  var cstrand = strand === '+' ? 'plus' : 'minus';
  if (!force && seqid === self.seqid && start === self.start && end === self.end) {
    callback(self.data[cstrand]);
  }
  else {
    $.ajax({
      type: "POST"
    , url: reqURL
    , data: {
        seqid: seqid
      , strand: strand
      , start: start
      , end: end
      , trackID: self.trackid
      }
    , dataType: "json"
    , beforeSend: function() {
        $('#track'+self.trackid).append(self.spinner);
        try { self.zeroline.toBack(); }
        catch(err) {}
      }
    , complete: function(data) {
        $('#spinner'+self.trackid).remove();
      }
    , success: function(data) {
        self.seqid = seqid;
        self.start = start;
        self.end = end;
        self.data = data;
        callback(data);
      }
    });
  }
};

/**
 * Draw the track's data.
 *
 * @param {Array} data
 * @param {Number} start
 * @param {Number} end
 * @see drawData()
 */
TrackOrientedProfile.prototype.draw = function(seqid, start, end) {
  var self = this;
  async.parallel({
    plus: function(callback) {
      self.getData(seqid, '+', start, end, function(data) {
        callback(null, data);
      });
    },
    minus: function(callback) {
      self.getData(seqid, '-', start, end, function(data) {
        callback(null, data);
      });
    }
  },
  function(err, data) {
    self.data = data;
    self.drawData(data, start, end);
  });
};

/**
 * Draw the profile in the track canvas
 *
 * @param {Array} data
 * @param {Number} start
 * @param {Number} end
 */
TrackOrientedProfile.prototype.drawData = function(data, start, end) {
  var self = this;
  var xtvals = [];
  var xbvals = [];
  var ytvals = [];
  var ybvals = [];
  var myvals = 0;
  if (data.plus.length !== 0 && data.minus.length !== 0) {
    data.plus.forEach(function(doc) {
      xtvals.push(~~((doc.start + doc.end) / 2));
      ytvals.push(doc.score);
    });
    data.minus.forEach(function(doc) {
      xbvals.push(~~((doc.start + doc.end) / 2));
      ybvals.push(-doc.score);
    });
    myval = Math.max.apply(Math, [self.maxvalue, Math.max.apply(Math, ytvals), -Math.min.apply(Math, ybvals)]);
    self.documents = self.canvas.linechart(
        25, 5,
        self.width-50, self.canvas.height,
        [xtvals, xbvals, [xtvals[0]], [xbvals[0]]],
        [ytvals, ybvals, [myval], [-myval]],
        self.metadata.style
    ).hoverColumn(
      function() {
        this.popups = self.canvas.set();
        this.popups.push(self.canvas.popup(
          this.x, this.y[0],
          ~~(this.values[0])+' | '+~~(this.axis),
          'up'
        ).insertBefore(this));
        this.popups.push(self.canvas.popup(
          this.x, this.y[1],
          ~~(this.values[1])+' | '+~~(this.axis),
          'down'
        ).insertBefore(this));
      },
      function() {
        this.popups && this.popups.remove();
      }
    );
    self.zeroline.toFront();
  }
};

