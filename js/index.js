window.onload = function() {
  var dragComponent = {
    props: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      lockX: { type: Boolean, default: false },
      lockY: { type: Boolean, default: false }
    },
    template: `<div class="dragComponent" @mousedown="mousedown" :style="dragComponentStyle" @touchstart="touchstart" @touchend="touchend" @touchmove="touchmove">
				<slot></slot>
			</div>`,
    data: function() {
      return {
        dragX: 0,
        dragY: 0,
        pageX: 0,
        pageY: 0,
        dragStartBool: false,
        draggingBool: false,
        targetPosX: 0,
        targetPosY: 0,
        originalPosX: 0,
        originalPosY: 0
      };
    },
    beforeMount: function() {},
    mounted: function() {
      this.targetPosX = this.$el.offsetLeft + this.$el.clientLeft;
      this.targetPosY = this.$el.offsetTop + this.$el.clientTop;
    },
    watch: {
      x: function(val) {
        this.targetPosX = val;
      },
      y: function(val) {
        this.targetPosY = val;
      },
      targetPosX: function(val) {
        this.$emit("update:x", val);
      },
      targetPosY: function(val) {
        this.$emit("update:y", val);
      }
    },
    methods: {
      touchesPoint: function(pTouches) {
        var p = new Array();
        var c = {
          x: 0,
          y: 0
        };
        var d = 0;
        if (pTouches) {
          var len = pTouches.length;
          for (var i = 0; i < len; i++) {
            c.x += pTouches[i].pageX;
            c.y += pTouches[i].pageY;
            p.push({
              x: pTouches[i].pageX,
              y: pTouches[i].pageY
            });
          }
          c.x /= len;
          c.y /= len;
          if (len == 2) {
            var xx = p[1].x - p[0].x;
            var yy = p[1].y - p[0].y;
            d = Math.sqrt(xx * xx + yy * yy);
          }
        }
        return {
          pos: c,
          dis: d
        };
      },
      touchstart: function(e) {
        if (e.touches.length > 1) {
          return;
        }
        var touches = this.touchesPoint(e.touches);
        this.dragstart(e, touches.pos.x, touches.pos.y);
      },
      touchend: function(e) {
        this.dragend(e);
      },
      touchmove: function(e) {
        if (e.touches.length > 1) {
          return;
        }
        var touches = this.touchesPoint(e.touches);
        this.dragmove(e, touches.pos.x, touches.pos.y);
      },
      mousedown: function(e) {
        if (e.button && e.button !== 0) {
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        this.dragstart(e, e.pageX, e.pageY);
        document.documentElement.addEventListener("mousemove", this.mousemove);
        document.documentElement.addEventListener("mouseup", this.mouseup);
      },
      mouseup: function(e) {
        this.dragend(e);
        document.documentElement.removeEventListener("mousemove", this.mousemove);
        document.documentElement.removeEventListener("mouseup", this.mouseup);
      },
      mousemove: function(e) {
        e.stopPropagation();
        this.dragmove(e, e.pageX, e.pageY);
      },
      dragstart: function(e, px, py) {
        this.originalPosX = this.$el.offsetLeft + this.$el.clientLeft;
        this.originalPosY = this.$el.offsetTop + this.$el.clientTop;
        this.pageX = px;
        this.pageY = py;
        this.dragStartBool = true;
        this.draggingBool = false;
        this.$emit("dragstart", e);
      },
      dragend: function(e) {
        if (!this.dragStartBool) {
          return;
        }
        this.dragStartBool = false;
        this.draggingBool = false;
        this.dragX = 0;
        this.dragY = 0;
        this.originalPosX = this.targetPosX + this.dragX;
        this.originalPosY = this.targetPosY + this.dragY;
        this.$emit("dragend", e);
      },
      dragmove: function(e, px, py) {
        if (!this.dragStartBool) {
          return;
        }
        this.dragX = px - this.pageX;
        this.dragY = py - this.pageY;
        if (!this.draggingBool) {
          if (this.dragX === 0 && this.dragY === 0) {
            return;
          }
          this.$emit("beforedragmove", e);
        }
        this.draggingBool = true;
        this.targetPosX = this.originalPosX + this.dragX;
        this.targetPosY = this.originalPosY + this.dragY;
        this.$emit(
          "dragmove",
          e,
          { x: this.targetPosX, y: this.targetPosY },
          { x: this.dragX, y: this.dragY },
          function(x, y) {
            this.targetPosX = x;
            this.targetPosY = y;
          }.bind(this)
        );
      }
    },
    computed: {
      dragComponentStyle: function() {
        var style = {};
        if (!this.lockX) {
          style.left = this.targetPosX + "px";
        }
        if (!this.lockY) {
          style.top = this.targetPosY + "px";
        }
        return style;
      }
    }
  };
  var dragBarComponent = {
    props: {
      rateX: { type: Number, default: 0 },
      rateY: { type: Number, default: 0 }
    },
    components: {
      "drag-component": dragComponent
    },
    template: `<div class="dragBarComponent">
				<drag-component class="progress" ref="progress" @dragstart="dragstart" @dragend="dragend" @dragmove="dragmove"  @beforedragmove="beforedragmove" :lock-x="true" :lock-y="true">
					<div class="bg"></div>
					<div class="rate" :style="{width:targetRateX*100+'%'}"></div>
					<div class="drag_btn" ref="drag" :style="{left:targetRateX*100+'%'}">
						<slot></slot>
					</div>
				</drag-component>
			</div>`,
    data: function() {
      return {
        targetRateX: 0,
        targetRateY: 0,
        targetPosX: 0,
        targetPosY: 0,
        originalPosX: 0,
        originalPosY: 0
      };
    },
    mounted: function() {
      this.targetRateX = this.rateX;
      this.targetRateY = this.rateY;
      window.addEventListener("resize", this.resize);
    },
    watch: {
      rateX: function(val) {
        this.targetRateX = val;
      },
      rateY: function(val) {
        this.targetRateY = val;
      },
      targetRateX: function(val) {
        var ww = this.$el.offsetWidth - this.$refs.drag.offsetWidth;
        this.targetPosX = val * ww;
        this.$emit("update:rateX", val);
      },
      targetRateY: function(val) {
        var hh = this.$el.offsetHeight - this.$refs.drag.offsetHeight;
        this.targetPosY = val * hh;
        this.$emit("update:rateY", val);
      },
      targetPosX: function(val) {
        var ww = this.$el.offsetWidth - this.$refs.drag.offsetWidth;
        this.targetRateX = val / ww;
      },
      targetPosY: function(val) {
        var hh = this.$el.offsetHeight - this.$refs.drag.offsetHeight;
        this.targetRateY = val / hh;
      }
    },
    methods: {
      getRect: function(el) {
        var parent = el.offsetParent;
        var parentLeft = 0;
        var parentTop = 0;
        while (parent) {
          parentLeft += parent.offsetLeft + parent.clientLeft;
          parentTop += parent.offsetTop + parent.clientTop;
          parent = parent.offsetParent;
        }
        return {
          left: parentLeft + el.offsetLeft + el.clientLeft,
          top: parentTop + el.offsetTop + el.clientTop,
          right: parentLeft + el.offsetLeft + el.offsetWidth + el.clientLeft,
          bottom: parentTop + el.offsetTop + el.offsetHeight + el.clientTop
        };
      },
      dragstart: function(e) {
        var bool = false;
        var c = e.target;
        while (c) {
          if (c === this.$refs.drag) {
            bool = true;
            break;
          }
          c = c.parentElement;
        }
        if (bool) {
          this.originalPosX = this.$refs.drag.offsetLeft + this.$refs.drag.clientLeft;
          this.originalPosY = this.$refs.drag.offsetTop + this.$refs.drag.clientTop;
        } else {
          var rect = this.getRect(this.$refs.progress.$el);
          if (e.targetTouches) {
            this.originalPosX = e.targetTouches[0].pageX - rect.left;
            this.originalPosY = e.targetTouches[0].pageY - rect.top;
          } else {
            this.originalPosX = e.pageX - rect.left;
            this.originalPosY = e.pageY - rect.top;
          }
        }
        this.$emit("dragstart", e, bool ? "button" : "timebar");
      },
      dragend: function(e) {
        this.$emit("dragend", e);
      },
      beforedragmove: function(e) {
        this.$emit("beforedragmove", e);
      },
      dragmove: function(e, pos, drag) {
        var ww = this.$el.offsetWidth - this.$refs.drag.offsetWidth;
        var hh = this.$el.offsetHeight - this.$refs.drag.offsetHeight;
        this.targetRateX = Math.max(0, Math.min(1, (this.originalPosX + drag.x) / ww));
        this.targetRateY = Math.max(0, Math.min(1, (this.originalPosY + drag.y) / hh));
        this.$emit("dragmove", e, { x: this.targetRateX, y: this.targetRateY });
      },
      resize: function() {
        var ww = this.$el.offsetWidth - this.$refs.drag.offsetWidth;
        var hh = this.$el.offsetHeight - this.$refs.drag.offsetHeight;
        this.targetPosX = this.targetRateX * ww;
        this.targetPosY = this.targetRateY * hh;
      }
    }
  };
  var app = new Vue({
    el: "#app",
    components: {
      "drag-component": dragComponent,
      "drag-bar-component": dragBarComponent
    },
    data: {
      albums: [
        [
          { song: "Species", singer: "Diamond Ortiz", src: "song/album01/Species.mp3", bg: "song/album01/Species.jpg" },
          { song: "Irie", singer: "Quincas Moreira", src: "song/album01/Irie.mp3", bg: "song/album01/Irie.jpg" },
          { song: "Bed and Breakfast02", singer: "The 126ers", src: "song/album01/Bed_and_Breakfast.mp3", bg: "song/album01/Bed_and_Breakfast.jpg" },
          { song: "Central Park", singer: "Quincas Moreira", src: "song/album01/Central_Park.mp3", bg: "song/album01/Central_Park.jpg" },
          { song: "There's Life Out There", singer: "Cooper Cannell", src: "song/album01/There_s_Life_Out_There.mp3", bg: "song/album01/There_s_Life_Out_There.jpg" },
          { song: "Ticker", singer: "Silent Partner", src: "song/album01/Ticker.mp3", bg: "song/album01/Ticker.jpg" },
          { song: "Urban Lullaby", singer: "Jimmy Fontanez/Doug Maxwell", src: "song/album01/Urban_Lullaby.mp3", bg: "song/album01/Urban_Lullaby.jpg" },
          { song: "Mamas", singer: "Josh Lippi & The Overtimers", src: "song/album01/Mamas.mp3", bg: "song/album01/Mamas.jpg" },
          { song: "Corporate Mellow Groove", singer: "Doug Maxwell", src: "song/album01/Corporate_Mellow_Groove.mp3", bg: "song/album01/Corporate_Mellow_Groove.jpg" }
        ]
      ],
      albumIndex: 0,
      songIndex: 0,
      playing: false,
      temp_playing: false,
      currentlyTime: 0,
      totalTime: 0,
      timeRate: 0,
      volumeRate: 1,
      audio: null,
      repeatIndex: 1,
      repeatTypes: ["", "all", "one"],
      shufflePlayback: false,
      playList: [],
      playListBool: false,
      advertiseBool: false,
      nextPlay: {
        albumIndex: 0,
        songIndex: 0
      },
      dataArray: null,
      canvasCtx: null,
      analyser: null,
      wave: [],
      mute: false,
      message001: "aaa"
    },
    mounted: function() {
      try {
        alert("bbb0");
        this.audio = new Audio(this.currentlySrc);
        this.audio.addEventListener("canplay", this.canplay);
        this.audio.addEventListener("timeupdate", this.timeupdate);
        this.audio.addEventListener("ended", this.ended);
        this.playList = this.getNumberList(this.albums[this.albumIndex].length, this.shufflePlayback);
        this.songIndex = this.playList[0];
        this.wave = new Array(32);
        for (var i = 0; i < this.wave.length; i++) {
          this.wave[i] = 255 * 0.5;
        }
        this.$refs.wave.width = this.$refs.wave.offsetWidth;
        this.$refs.wave.height = this.$refs.wave.offsetHeight;
        this.canvasCtx = this.$refs.wave.getContext("2d");
        this.updateAnimation();
      } catch (e) {
        alert("ccc0");
      }
    },
    watch: {
      mute: function(val) {
        if (val) {
          this.audio.volume = 0;
        } else {
          this.audio.volume = this.volumeRate;
        }
      },
      timeRate: function(val) {
        this.currentlyTime = val * this.totalTime;
      },
      volumeRate: function(val) {
        this.audio.volume = val;
        this.mute = false;
      },
      currentlyTime: function(val) {
        var timeRate = 0;
        if (this.totalTime > 0) {
          timeRate = val / this.totalTime;
        }
        this.timeRate = timeRate;
      },
      shufflePlayback: function(val) {
        this.playList = this.getNumberList(this.albums[this.albumIndex].length, this.shufflePlayback);
      }
    },
    methods: {
      createWave: function() {
        if (!this.analyser) {
          var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

          this.analyser = audioCtx.createAnalyser();
          //analyser.fftSize = 2048;
          this.bufferLength = this.analyser.fftSize;
          this.dataArray = new Uint8Array(this.bufferLength);

          var source1 = audioCtx.createMediaElementSource(this.audio);
          source1.connect(this.analyser);
          this.analyser.connect(audioCtx.destination);
        }
      },
      updateAnimation: function() {
        requestAnimationFrame(this.updateAnimation);
        if (this.playing) {
          this.analyser.getByteTimeDomainData(this.dataArray);
          for (var i = 0; i < this.wave.length; i++) {
            //this.wave[i] = this.dataArray[i*this.bufferLength/this.wave.length];
            this.wave[i] = this.wave[i] + (this.dataArray[(i * this.bufferLength) / this.wave.length] - this.wave[i]) * 0.7;
          }
        } else {
          for (var i = 0; i < this.wave.length; i++) {
            this.wave[i] = this.wave[i] + (255 * 0.5 - this.wave[i]) * 0.05;
          }
        }

        var WIDTH = this.$refs.wave.width;
        var HEIGHT = this.$refs.wave.height;

        //this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        this.canvasCtx.save();
        this.canvasCtx.globalCompositeOperation = "destination-out";
        this.canvasCtx.fillStyle = "rgba(0,0,0,0.3)";
        this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        this.canvasCtx.restore();

        this.canvasCtx.save();
        this.canvasCtx.globalCompositeOperation = "source-over";
        var sliceWidth = WIDTH / this.wave.length;
        var grd = this.canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
        grd.addColorStop(0, "#00007f");
        grd.addColorStop(0.5, "#DEDEDE");
        grd.addColorStop(1, "#00007f");

        this.canvasCtx.strokeStyle = grd;
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(0, HEIGHT * 0.5);
        for (var i = 0; i < this.wave.length; i++) {
          var temp = this.wave[i] - 255 * 0.5;
          var rate = (0.5 * this.bezier(0, 2, 0, i / (this.wave.length - 1)) * temp) / (255 * 0.5);
          this.canvasCtx.lineTo((i + 0.5) * sliceWidth, HEIGHT * (0.5 - rate));
        }
        this.canvasCtx.lineTo(WIDTH, HEIGHT * 0.5);

        this.canvasCtx.closePath();
        this.canvasCtx.stroke();
        this.canvasCtx.restore();
      },
      bezier: function(p0, p1, p2, t) {
        return (1 - t) * (1 - t) * p0 + 2 * t * (1 - t) * p1 + t * t * p2;
      },
      getNumberList: function(len, randomBool) {
        var random = [];
        var count = 0;
        for (var i = 0; i < len; i++) {
          if (randomBool) {
            var num = Math.floor(Math.random() * (len - count));
            var n = 0;
            if (random.length > 0) {
              n = random
                .map(function(el) {
                  return el <= num ? 1 : 0;
                })
                .reduce(function(accumulator, currentValue) {
                  return accumulator + currentValue;
                });
            }
            num = num + n;
            while (random.indexOf(num) !== -1) {
              num++;
              num %= len;
            }
            random[i] = num;
          } else {
            random[i] = i;
          }
          count++;
        }
        return random;
      },
      btn_play_click: function() {
        this.createWave();
        this.playing = !this.playing;
        if (this.playing) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      },
      btn_rewind_click: function() {
        var playListIndex = this.playList.indexOf(this.songIndex);
        var temp = playListIndex - 1;
        if (temp < 0) {
          this.playList = this.getNumberList(this.playList.length, this.shufflePlayback);
        }
        temp = (temp + this.playList.length) % this.playList.length;

        this.advertiseShow(0, this.playList[temp]);
      },
      btn_fast_click: function() {
        var playListIndex = this.playList.indexOf(this.songIndex);
        var temp = playListIndex + 1;
        if (temp >= this.playList.length) {
          this.playList = this.getNumberList(this.playList.length, this.shufflePlayback);
        }
        temp = temp % this.playList.length;

        this.advertiseShow(0, this.playList[temp]);
      },
      setSong: function() {
        this.audio.src = this.currentlySrc;
        this.audio.load();
        this.currentlyTime = 0;
        if (this.playing) {
          this.audio.play();
        }
      },
      btn_shufflePlayback_click: function() {
        this.shufflePlayback = !this.shufflePlayback;
      },
      btn_repeat_click: function() {
        var temp = this.repeatIndex + 1;
        this.repeatIndex = temp % this.repeatTypes.length;
      },
      formatTime: function(time) {
        var temp = Math.ceil(time);
        var m = Math.floor(temp / 60);
        m = (m < 10 ? "0" : "") + m;
        var s = Math.floor(temp % 60);
        s = (s < 10 ? "0" : "") + s;
        return m + ":" + s;
      },
      canplay: function(e) {
        this.currentlyTime = this.audio.currentTime;
        this.totalTime = this.audio.duration;

        this.message001 = "asdasdasdasd";
      },
      timeupdate: function(e) {
        this.currentlyTime = this.audio.currentTime;
      },
      ended: function(e) {
        var type = this.repeatType;
        if (type === "") {
        } else if (type === "all") {
          this.btn_fast_click();
        } else if (type === "one") {
          this.audio.play();
        }
      },
      dragstart: function(e, type) {
        this.temp_playing = this.playing;
        if (type === "button") {
          this.audio.pause();
        }
      },
      dragend: function(e) {
        this.audio.currentTime = this.currentlyTime;
        this.playing = this.temp_playing;
        if (this.playing) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      },
      beforedragmove: function(e) {
        if (!this.audio.paused) {
          this.audio.pause();
        }
      },
      dragmove: function(e) {},
      goplay: function(index) {
        if (index !== this.songIndex) {
          this.createWave();
          this.advertiseShow(0, index, true);
        } else {
          this.btn_play_click();
        }
      },
      back_click: function() {
        this.playListBool = false;
      },
      list_click: function() {
        this.playListBool = true;
      },
      follow_click: function() {
        this.advertiseHide();
      },
      no_click: function() {
        this.advertiseHide();
      },
      advertiseShow: function(albumIndex, songIndex, playing) {
        if (Math.random() > 0.5) {
          this.nextPlay.albumIndex = albumIndex;
          this.nextPlay.songIndex = songIndex;
          this.advertiseBool = true;
          this.temp_playing = playing ? playing : this.playing;
          this.playing = false;
          this.audio.pause();
        } else {
          this.playing = playing ? playing : this.playing;
          this.albumIndex = albumIndex;
          this.songIndex = songIndex;
          this.setSong();
        }
      },
      advertiseHide: function() {
        if (this.advertiseBool) {
          this.advertiseBool = false;
          this.playing = this.temp_playing;
          this.albumIndex = this.nextPlay.albumIndex;
          this.songIndex = this.nextPlay.songIndex;
          this.setSong();
        }
      },
      btn_mute_click: function() {
        this.mute = !this.mute;
      }
    },
    computed: {
      currentlySong: function() {
        return this.albums[this.albumIndex][this.songIndex].song;
      },
      currentlySinger: function() {
        return this.albums[this.albumIndex][this.songIndex].singer;
      },
      currentlySrc: function() {
        return this.albums[this.albumIndex][this.songIndex].src;
      },
      currentlyBg: function() {
        return this.albums[this.albumIndex][this.songIndex].bg;
      },
      currentlyAlbum: function() {
        return this.albums[this.albumIndex];
      },
      repeatType: function() {
        return this.repeatTypes[this.repeatIndex];
      },
      isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }
    }
  });
};
