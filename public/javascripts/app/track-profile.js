/**
 * Class for handling profile tracks
 *
 * @param {String} trackid
 * @param {Number} width
 * @param {Number} height
 * @param {Object} metadata
 */
var TrackProfile = function(trackid, width, height, metadata) {
  var self = this;
  TrackBase.call(this, trackid, width, height, metadata);
};

TrackProfile.prototype = new TrackBase;

/**
 * Draw the track's data.
 *
 * @param {Array} data
 * @param {Number} start
 * @param {Number} end
 * @see drawData()
 */
TrackProfile.prototype.draw = function(seqid, start, end) {
  var self = this;
  self.getData(seqid, start, end, function(data) {
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
TrackProfile.prototype.drawData = function(data, start, end) {
  var self = this;
  var xvals = [];
  var yvals = [];
  var i = 0;
  if (data.length !== 0) {
    data.forEach(function(doc) {
      xvals.push(~~((doc.start + doc.end) / 2));
      yvals.push(doc.score);
    });
    self.resize(self.canvas.width, 110);
    self.documents = self.canvas.linechart(
        25, 5,
        self.width-50, 110,
        [xvals, [xvals[0]]],
        [yvals, [self.maxvalue]],
        self.metadata.style
    ).hoverColumn(
      function(){
        this.popups = self.canvas.set();
        this.popups.push(self.canvas.popup(
          this.x, this.y[0],
          ~~(this.values[0])+' | '+~~(this.axis)
        ).insertBefore(this));
      },
      function() {
        this.popups && this.popups.remove();
      }
    );
  }
};

