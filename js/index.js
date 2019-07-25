window.onload = function() {
	var dragPlugin = {};
	dragPlugin.install = function (Vue, options) {
	  	// 1. add global method or property
		Vue.myGlobalMethod = function () {
	    	// some logic ...
	  	}

	  	// 2. add a global asset
	  	Vue.directive('drag', {
	    	bind:function(el, binding, vnode, oldVnode) {
	      		// some logic ...
	    	}
	  	})

	  	// 3. inject some component options
	  	Vue.mixin({
	    	created: function () {
	    	}
	  	})

	  	// 4. add an instance method
	  	Vue.prototype.$myMethod = function (methodOptions) {
	    	// some logic ...
	    	console.log(methodOptions);
	  	}
	}
	//Vue.use(dragPlugin);

	var dragComponent = {
		props: {
			x: {type:Number,default: 0},
			y: {type:Number,default: 0},
			lockX: {type:Boolean,default: false},
			lockY: {type:Boolean,default: false}
		},
		template:
			`<div class="dragComponent" @mousedown="mousedown" :style="dragComponentStyle">
				<slot></slot>
			</div>`,
		data: function () {
		    return {
		    	dragX:0,
	        	dragY:0,
	        	pageX:0,
	        	pageY:0,
	        	dragStartBool:false,
	        	draggingBool:false,
	        	targetPosX:0,
	        	targetPosY:0,
	        	originalPosX:0,
	        	originalPosY:0
		    }
	  	},
	  	beforeMount: function(){
	  	},	            
	  	mounted: function() {
	  		this.targetPosX = this.$el.offsetLeft + this.$el.clientLeft;
	        this.targetPosY = this.$el.offsetTop + this.$el.clientTop;
	        /*this.$nextTick(function(){	        	
	        	console.log(this.limitFun());
	        });*/
        },
        watch:{
        	x:function(val){
        		this.targetPosX = val;
        	},
        	y:function(val){
        		this.targetPosY = val;
        	},
        	targetPosX:function(val){
        		this.$emit('update:x', val);
        	},
        	targetPosY:function(val){
        		this.$emit('update:y', val);
        	}        	
        },
	  	methods: {
	    	mousedown:function(e){
        		var target = e.target || e.srcElement;

	            if (e.button && e.button !== 0) {
	                return;
	            }
	            this.originalPosX = this.$el.offsetLeft + this.$el.clientLeft;
	            this.originalPosY = this.$el.offsetTop + this.$el.clientTop;
	            //console.log(this.$el.clientLeft)
	            e.stopPropagation();
        		e.preventDefault();
        		this.pageX = e.pageX;
        		this.pageY = e.pageY;
        		this.dragStartBool = true;
        		this.draggingBool = false;
        		document.documentElement.addEventListener('mousemove', this.mousemove);
	        	document.documentElement.addEventListener('mouseup', this.mouseup);
	            this.$emit('dragstart',e);
        	},	        
        	mouseup:function(e){
        		if (!this.dragStartBool) {
        			return;
	            }
	            this.dragStartBool = false;
        		this.draggingBool = false;
        		document.documentElement.removeEventListener('mousemove', this.mousemove);
	        	document.documentElement.removeEventListener('mouseup', this.mouseup);
        		this.dragX = 0;
        		this.dragY = 0;        		
	            this.originalPosX  = this.targetPosX + this.dragX;
	            this.originalPosY  = this.targetPosY + this.dragY;
	            this.$emit('dragend',e);
        	},        	
        	mousemove:function(e){
        		if (!this.dragStartBool) {
        			return;
	            }
	            this.dragX = e.pageX - this.pageX;			            
	            this.dragY = e.pageY - this.pageY;			            
	            if(!this.draggingBool){
	            	if(this.dragX===0&&this.dragY===0){
		            	return;
		            }
	            }
	            this.draggingBool = true;
	            e.stopPropagation();
	            this.targetPosX  = this.originalPosX + this.dragX;
	            this.targetPosY  = this.originalPosY + this.dragY;
	            this.$emit('dragmove',e,{x:this.targetPosX,y:this.targetPosY},{x:this.dragX,y:this.dragY},function(x, y){
	            	this.targetPosX = x;
	            	this.targetPosY = y;
	            }.bind(this));
        	}
	  	},
	  	computed:{
			dragComponentStyle:function(){
				var style = {};
	  			if(!this.lockX){
	  				style.left = this.targetPosX+'px';
	  			}
	  			if(!this.lockY){
	  				style.top = this.targetPosY+'px';
	  			}
				return style;
			}
		}
	};
	var dragBarComponent = {
		props: {
			rateX: {type:Number,default: 0},
			rateY: {type:Number,default: 0}
		},
		components: {
	    	'drag-component': dragComponent
	  	},
		template:
			`<div class="dragBarComponent">
				<drag-component class="progress" @dragstart="dragstart" @dragend="dragend" @dragmove="dragmove" :lock-x="true" :lock-y="true">
					<div class="bg"></div>
					<div class="rate" :style="{width:targetRateX*100+'%'}"></div>
					<div class="drag_btn" ref="drag" :style="{left:targetRateX*100+'%'}">
						<slot></slot>
					</div>
				</drag-component>
			</div>`,
		data: function () {
		    return {
	        	targetRateX:0,
	        	targetRateY:0,
	        	targetPosX:0,
	        	targetPosY:0,
	        	originalPosX:0,
	        	originalPosY:0
		    }
	  	},
	  	mounted: function() {
	  		this.targetRateX = this.rateX;
	  		this.targetRateY = this.rateY;
	  		window.addEventListener("resize", this.resize);
        },
        watch:{
        	rateX:function(val){
        		this.targetRateX = val;
        	},
        	rateY:function(val){
        		this.targetRateY = val;
        	},
        	targetRateX:function(val){
        		var ww = this.$el.offsetWidth-this.$refs.drag.offsetWidth;
	  			this.targetPosX = val*ww;
        		this.$emit('update:rateX', val);
        	},
        	targetRateY:function(val){
	        	var hh = this.$el.offsetHeight-this.$refs.drag.offsetHeight;
	  			this.targetPosY = val*hh;
        		this.$emit('update:rateY', val);
        	},
        	targetPosX:function(val){
        		var ww = this.$el.offsetWidth-this.$refs.drag.offsetWidth;
        		this.targetRateX = val/ww;
        	},
        	targetPosY:function(val){
		        var hh = this.$el.offsetHeight-this.$refs.drag.offsetHeight;
        		this.targetRateY = val/hh;
        	}  	
        },
		methods: {
			dragstart:function(e){
				var bool = false;
				var c = e.target;
				while (c) {
					if(c===this.$refs.drag){
						bool = true;
						break;
					}
					c = c.parentElement;
				}
				if(bool){
					this.originalPosX = this.$refs.drag.offsetLeft + this.$refs.drag.clientLeft;
					this.originalPosY = this.$refs.drag.offsetTop + this.$refs.drag.clientTop;
				}else{					
					this.originalPosX = e.offsetX;
					this.originalPosY = e.offsetY;
				}
				this.$emit('dragstart',e);
			},
			dragend:function(e){
				this.$emit('dragend',e);
			},
			dragmove:function(e, pos, drag){
				var ww = this.$el.offsetWidth-this.$refs.drag.offsetWidth;
	            var hh = this.$el.offsetHeight-this.$refs.drag.offsetHeight;
				this.targetRateX = Math.max(0,Math.min(1,(this.originalPosX+drag.x)/ww));
				this.targetRateY = Math.max(0,Math.min(1,(this.originalPosY+drag.y)/hh));
				this.$emit('dragmove',e,{x:this.targetRateX,y:this.targetRateY});
			},
			resize:function(){
				var ww = this.$el.offsetWidth-this.$refs.drag.offsetWidth;
	            var hh = this.$el.offsetHeight-this.$refs.drag.offsetHeight;
	            this.targetPosX = this.targetRateX*ww;
	            this.targetPosY = this.targetRateY*hh;
			}
	  	}
	}
	var app = new Vue({
        el: '#app',
	  	components: {
	    	'drag-component': dragComponent,
	    	'drag-bar-component': dragBarComponent
	  	},
        data: {
        	album:[
        		[
        			{song:"Species",singer:"Diamond Ortiz",src:"song/album01/Species.mp3"},
        			{song:"Irie",singer:"Quincas Moreira",src:"song/album01/Irie.mp3"},
        			{song:"Bed and Breakfast02",singer:"The 126ers",src:"song/album01/Bed_and_Breakfast.mp3"},
        			{song:"Central Park",singer:"Quincas Moreira",src:"song/album01/Central_Park.mp3"},
        			{song:"There's Life Out There",singer:"Cooper Cannell",src:"song/album01/There_s_Life_Out_There.mp3"},
        			{song:"Ticker",singer:"Silent Partner",src:"song/album01/Ticker.mp3"},
        			{song:"Urban Lullaby",singer:"Jimmy Fontanez/Doug Maxwell",src:"song/album01/Urban_Lullaby.mp3"},
        			{song:"Mamas",singer:"Josh Lippi & The Overtimers",src:"song/album01/Mamas.mp3"},
        			{song:"Corporate Mellow Groove",singer:"Doug Maxwell",src:"song/album01/Corporate_Mellow_Groove.mp3"}
        		]
        	],
        	albumIndex:0,
        	songIndex:0,
        	playing:false,
        	temp_playing:false,
        	currentlyTime:40*2,
        	totalTime:60*5,
        	timeRate:0,
        	audio:null	
        },
        mounted: function() {
	        /*this.startAnimation();
        	this.init();*/
        	/*var timeRate = 0;
        	if(this.totalTime>0){
	        	timeRate = this.currentlyTime/this.totalTime;
	        }
        	this.timeRate = timeRate;*/
        	/*this.$nextTick(function(){
        		var a = this.$refs.audio;
        		console.log([a]);
        		a.play();
        	});*/
        	this.audio = new Audio(this.currentlySrc);
        	this.audio.addEventListener("canplay", this.canplay);
        	this.audio.addEventListener("timeupdate", this.timeupdate);
        	this.audio.addEventListener("ended", this.ended);

        	//console.log(this.audio.)   	
        },
        watch:{
        	timeRate:function(val){
        		this.currentlyTime = val*this.totalTime;
        	},
        	currentlyTime:function(){
        		var timeRate = 0;
	        	if(this.totalTime>0){
		        	timeRate = this.currentlyTime/this.totalTime;
		        }
	        	this.timeRate = timeRate;
        	}
        },
        methods: {
	        btn_play_click:function(){
	        	this.playing = !this.playing;
	        	if(this.playing){	        		
	        		this.audio.play();
	        	}else{
	        		this.audio.pause();
	        	}
	        },
	        btn_rewind_click:function(){
	        	var temp = this.songIndex - 1;
	        	this.songIndex = (temp + this.album[this.albumIndex].length)%this.album[this.albumIndex].length;
	        	this.audio.src = this.currentlySrc;
	        	this.audio.load();
        		this.currentlyTime = 0;
        		if(this.playing){
        			this.audio.play();
        		}
	        },
	        btn_fast_click:function(){	        	
	        	var temp = this.songIndex + 1;
	        	this.songIndex = temp%this.album[this.albumIndex].length;
	        	this.audio.src = this.currentlySrc;
	        	this.audio.load();
        		this.currentlyTime = 0;
        		if(this.playing){
        			this.audio.play();
        		}
	        },
	        btn_shufflePlayback_click:function(){

	        },
	        btn_repeat_click:function(){

	        },
	        formatTime:function(time){
        		var temp = Math.ceil(time);
        		var m = Math.floor(temp/60);
        		m = (m<10?"0":"")+m;
        		var s = Math.floor(temp%60);
        		s = (s<10?"0":"")+s;
        		return m+":"+s;
        	},
        	canplay:function(e){
        		//console.log(e);
        		this.currentlyTime = this.audio.currentTime;
        		this.totalTime = this.audio.duration;
        	},
        	timeupdate:function(e){
        		//console.log(e);
        		this.currentlyTime = this.audio.currentTime;
        	},
        	ended:function(e){
        		//console.log(e);
        		this.audio.play();
        		//this.playing = false;
        	},
        	dragstart:function(){
        		this.temp_playing = this.playing;
        		this.audio.pause();
			},
			dragend:function(){
	    		this.audio.currentTime = this.currentlyTime;				
        		this.playing = this.temp_playing;
        		if(this.playing){	        		
	        		this.audio.play();
	        	}else{
	        		this.audio.pause();
	        	}
			},
	    	dragmove:function(e){
	        }   
		},
	    computed:{
	    	currentlySong:function(){
	    		return this.album[this.albumIndex][this.songIndex].song;
	    	},
	    	currentlySinger:function(){
	    		return this.album[this.albumIndex][this.songIndex].singer;
	    	},
	    	currentlySrc:function(){
	    		return this.album[this.albumIndex][this.songIndex].src;
	    	}
		}
    });
}